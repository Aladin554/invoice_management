<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\SendsExpenseWhatsAppNotifications;
use App\Models\ExpenseSetting;
use App\Models\Payment;
use App\Models\PaymentRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PaymentRequestController extends Controller
{
    use SendsExpenseWhatsAppNotifications;

    private const MAX_UPLOAD_SIZE_KB = 10240;

    private const RELATIONS = [
        'employee:id,first_name,last_name,email',
        'branch:id,name',
        'category:id,name',
        'financeReviewer:id,first_name,last_name',
        'ownerReviewer:id,first_name,last_name',
        'settledBy:id,first_name,last_name',
        'paymentRejecter:id,first_name,last_name',
        'payment',
        'payment.recordedBy:id,first_name,last_name',
    ];

    private function authUser(): User
    {
        return Auth::user();
    }

    private function isOwner(): bool
    {
        return $this->authUser()->isOwner();
    }

    private function isFinanceManager(): bool
    {
        return $this->authUser()->isFinanceManager();
    }

    private function isEmployee(): bool
    {
        return $this->authUser()->isExpenseEmployee();
    }

    public function index(Request $request): JsonResponse
    {
        $query = PaymentRequest::with(self::RELATIONS)->latest();

        if ($this->isEmployee() || $request->boolean('mine')) {
            $query->where('employee_id', $this->authUser()->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $requests = $query->get()->map(fn (PaymentRequest $pr) => $this->withUrls($pr));

        return response()->json($requests);
    }

    public function store(Request $request): JsonResponse
    {
        if (!$this->isEmployee() && !$this->isFinanceManager()) {
            return response()->json(['message' => 'Only employees or Finance Manager can submit payment requests'], 403);
        }

        $request->validate([
            'category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:0.01',
            'purpose' => 'required|string',
            'payment_preference' => 'required|in:cash,bank,bkash,nagad',
        ]);

        // A Finance Manager reviewing their own request would be a conflict of
        // interest, so their submissions always skip finance review and go
        // straight to the Owner for approval — this is a fixed safeguard and
        // is not affected by the "Owner Approval Required" toggle, which only
        // governs the normal employee → finance → owner flow.
        $submittedByFinanceManager = $this->isFinanceManager();

        $status = PaymentRequest::STATUS_SUBMITTED;
        $financeNote = null;
        if ($submittedByFinanceManager) {
            $status = PaymentRequest::STATUS_FINANCE_APPROVED;
            $financeNote = 'Submitted by Finance Manager — sent directly to Owner.';
        }

        $paymentRequest = PaymentRequest::create([
            'employee_id' => $this->authUser()->id,
            'branch_id' => $this->authUser()->branch_id,
            'category_id' => $request->category_id,
            'amount' => $request->amount,
            'purpose' => $request->purpose,
            'expense_date' => now()->toDateString(),
            'payment_preference' => $request->payment_preference,
            'status' => $status,
            'finance_reviewed_at' => $submittedByFinanceManager ? now() : null,
            'finance_reviewed_by' => $submittedByFinanceManager ? $this->authUser()->id : null,
            'finance_note' => $financeNote,
        ]);

        $paymentRequest->load(self::RELATIONS);

        if ($submittedByFinanceManager) {
            $this->notifyOwnerPendingApproval(
                "Expense request from Finance Manager {$this->authUser()->first_name} {$this->authUser()->last_name} — "
                    . "৳{$paymentRequest->amount} ({$paymentRequest->category->name}) is awaiting your approval."
            );
        }

        return response()->json($this->withUrls($paymentRequest), 201);
    }

    /**
     * The requesting employee can edit their own request while it's still
     * untouched — once Finance has acted on it, changes have to go through
     * the review flow instead (reject-and-resubmit).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $paymentRequest = PaymentRequest::with(['employee', 'category'])->findOrFail($id);

        if ((int) $paymentRequest->employee_id !== (int) $this->authUser()->id) {
            return response()->json(['message' => 'Only the requesting employee can edit this request'], 403);
        }

        if ($paymentRequest->status !== PaymentRequest::STATUS_SUBMITTED) {
            return response()->json(['message' => 'This request can no longer be edited'], 422);
        }

        $request->validate([
            'category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:0.01',
            'purpose' => 'required|string',
            'payment_preference' => 'required|in:cash,bank,bkash,nagad',
        ]);

        $paymentRequest->update([
            'category_id' => $request->category_id,
            'amount' => $request->amount,
            'purpose' => $request->purpose,
            'payment_preference' => $request->payment_preference,
        ]);

        return response()->json($this->withUrls($paymentRequest->load(self::RELATIONS)));
    }

    public function show(int $id): JsonResponse
    {
        $paymentRequest = PaymentRequest::with(self::RELATIONS)->findOrFail($id);

        if ($this->isEmployee() && (int) $paymentRequest->employee_id !== (int) $this->authUser()->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($this->withUrls($paymentRequest));
    }

    public function financeReview(Request $request, int $id): JsonResponse
    {
        if (!$this->isFinanceManager()) {
            return response()->json(['message' => 'Only Finance Manager can review this request'], 403);
        }

        $paymentRequest = PaymentRequest::with(['employee', 'category'])->findOrFail($id);

        if ($paymentRequest->status !== PaymentRequest::STATUS_SUBMITTED) {
            return response()->json(['message' => 'Request is not pending finance review'], 422);
        }

        // Approving means Finance is handing the money over right now, so
        // proof of that handover is required at the point of approval —
        // except for cash, where a photo/receipt isn't always practical to
        // produce on the spot.
        $requiresProof = $request->input('action') === 'approve' && $paymentRequest->payment_preference !== 'cash';

        $request->validate([
            'action' => 'required|in:approve,reject',
            'note' => 'nullable|string',
            // Multiple files are allowed (e.g. several handover photos).
            'money_provided_proof' => [$requiresProof ? 'required' : 'nullable', 'array'],
            'money_provided_proof.*' => 'file|mimes:jpg,jpeg,png,pdf|max:' . self::MAX_UPLOAD_SIZE_KB,
        ]);

        $approved = $request->action === 'approve';
        // When Owner approval is switched off, Finance Manager's approval is
        // the final word — money goes straight to "provided", awaiting the
        // employee to settle it, instead of also waiting on the Owner.
        $skipOwnerApproval = $approved && !ExpenseSetting::ownerApprovalRequired();

        $status = PaymentRequest::STATUS_FINANCE_REJECTED;
        if ($approved) {
            $status = $skipOwnerApproval ? PaymentRequest::STATUS_MONEY_PROVIDED : PaymentRequest::STATUS_FINANCE_APPROVED;
        }

        $moneyProvidedPaths = $approved
            ? collect($request->file('money_provided_proof'))
                ->map(fn ($file) => $file->store('expenses/money-provided', 'public'))
                ->values()
                ->all()
            : null;

        $paymentRequest->update([
            'status' => $status,
            'finance_reviewed_at' => now(),
            'finance_reviewed_by' => $this->authUser()->id,
            'finance_note' => $request->input('note'),
            'money_provided_paths' => $moneyProvidedPaths,
        ]);

        if ($approved && !$skipOwnerApproval) {
            $this->notifyOwnerPendingApproval(
                "Expense request from {$paymentRequest->employee->first_name} {$paymentRequest->employee->last_name} "
                    . "(৳{$paymentRequest->amount}, {$paymentRequest->category->name}) was approved by Finance. "
                    . "Awaiting your approval."
            );
        }

        return response()->json($this->withUrls($paymentRequest->load(self::RELATIONS)));
    }

    public function ownerReview(Request $request, int $id): JsonResponse
    {
        if (!$this->isOwner()) {
            return response()->json(['message' => 'Only Owner can approve this request'], 403);
        }

        $paymentRequest = PaymentRequest::with(['employee', 'category'])->findOrFail($id);

        if ($paymentRequest->status !== PaymentRequest::STATUS_FINANCE_APPROVED) {
            return response()->json(['message' => 'Request is not pending owner approval'], 422);
        }

        $request->validate([
            'action' => 'required|in:approve,reject',
            'note' => 'nullable|string',
        ]);

        $approved = $request->action === 'approve';

        // Money was already handed over and proven by Finance at their
        // approval step — Owner approval is just the final sign-off, moving
        // the request to "awaiting the employee's used-receipt".
        $paymentRequest->update([
            'status' => $approved ? PaymentRequest::STATUS_MONEY_PROVIDED : PaymentRequest::STATUS_OWNER_REJECTED,
            'owner_reviewed_at' => now(),
            'owner_reviewed_by' => $this->authUser()->id,
            'owner_note' => $request->input('note'),
        ]);

        return response()->json($this->withUrls($paymentRequest->load(self::RELATIONS)));
    }

    /**
     * Employee settles their own request: attaches proof of how the money
     * was actually used, and how much (if any) is being returned unused.
     * This is what finally marks the request as paid/complete.
     */
    public function settle(Request $request, int $id): JsonResponse
    {
        $paymentRequest = PaymentRequest::with(['employee', 'category'])->findOrFail($id);

        if ((int) $paymentRequest->employee_id !== (int) $this->authUser()->id) {
            return response()->json(['message' => 'Only the requesting employee can settle this request'], 403);
        }

        if ($paymentRequest->status !== PaymentRequest::STATUS_MONEY_PROVIDED) {
            return response()->json(['message' => 'Request is not awaiting settlement'], 422);
        }

        $request->validate([
            // Multiple receipts are allowed (e.g. several purchases made
            // with the same provided amount).
            'used_receipt' => 'required|array|min:1',
            'used_receipt.*' => 'file|mimes:jpg,jpeg,png,pdf|max:' . self::MAX_UPLOAD_SIZE_KB,
            'amount_used' => 'nullable|numeric|min:0',
            'amount_returned' => 'nullable|numeric|min:0',
            'note' => 'nullable|string',
        ]);

        $usedReceiptPaths = collect($request->file('used_receipt'))
            ->map(fn ($file) => $file->store('expenses/used-receipts', 'public'))
            ->values()
            ->all();
        $amountUsed = $request->filled('amount_used') ? $request->input('amount_used') : $paymentRequest->amount;

        // Settling — with or without a refund — is final as soon as the
        // employee attaches the receipt. Any returned amount is recorded on
        // the request for the Owner/Finance Manager to audit later (e.g.
        // monthly), rather than gating this on a separate approval step.
        $paymentRequest->update([
            'status' => PaymentRequest::STATUS_PAID,
            'used_receipt_paths' => $usedReceiptPaths,
            'settled_at' => now(),
            'settled_by' => $this->authUser()->id,
            'amount_used' => $amountUsed,
            'amount_returned' => $request->input('amount_returned'),
            'settlement_note' => $request->input('note'),
        ]);

        Payment::create([
            'payment_request_id' => $paymentRequest->id,
            'payment_method' => $paymentRequest->payment_preference,
            'payment_date' => now()->toDateString(),
            'amount_paid' => $amountUsed,
            'recorded_by' => $this->authUser()->id,
        ]);

        return response()->json($this->withUrls($paymentRequest->load(self::RELATIONS)));
    }

    private function withUrls(PaymentRequest $paymentRequest): PaymentRequest
    {
        $paymentRequest->receipt_url = $paymentRequest->receipt_path
            ? Storage::disk('public')->url($paymentRequest->receipt_path)
            : null;

        $paymentRequest->money_provided_urls = collect($paymentRequest->money_provided_paths ?? [])
            ->map(fn (string $path) => Storage::disk('public')->url($path))
            ->values()
            ->all();

        $paymentRequest->used_receipt_urls = collect($paymentRequest->used_receipt_paths ?? [])
            ->map(fn (string $path) => Storage::disk('public')->url($path))
            ->values()
            ->all();

        if ($paymentRequest->payment && $paymentRequest->payment->proof_path) {
            $paymentRequest->payment->proof_url = Storage::disk('public')->url($paymentRequest->payment->proof_path);
        }

        return $paymentRequest;
    }
}
