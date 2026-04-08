<?php

namespace App\Http\Controllers;

use App\Jobs\SendInvoiceApprovedMailJob;
use App\Jobs\SendInvoicePreviewMailJob;
use App\Models\AssistantSalesPerson;
use App\Models\Branch;
use App\Models\ContractTemplate;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\SalesPerson;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    private const CUSTOMER_DETAIL_RELATION = 'customer:id,first_name,last_name,email,phone,academic_profile_ssc,academic_profile_hsc,academic_profile_bachelor,academic_profile_masters,study_gap,total_funds_for_applicant,total_funds_for_accompanying_members,moving_abroad_member_count,available_documents,english_language_proficiencies';

    private const INVOICE_INDEX_RELATIONS = [
        'customer:id,first_name,last_name,email',
        'branch:id,name',
        'salesPerson:id,first_name,last_name',
        'assistantSalesPerson:id,first_name,last_name',
    ];

    private const INVOICE_DETAIL_RELATIONS = [
        'items:id,invoice_id,service_id,name,price,line_total',
        'branch:id,name',
        self::CUSTOMER_DETAIL_RELATION,
        'salesPerson:id,first_name,last_name',
        'assistantSalesPerson:id,first_name,last_name',
        'contractTemplate:id,name,file_path',
    ];

    private const CONTRACT_TEMPLATE_FORM_RELATIONS = [
        'service:id,name,price',
        'services:id,name,price',
    ];

    private function authUser(): User
    {
        return auth()->user();
    }

    private function isSuperAdmin(): bool
    {
        return $this->isSuperAdminUser($this->authUser());
    }

    private function isAdmin(): bool
    {
        return $this->isAdminUser($this->authUser());
    }

    private function isSuperAdminUser(?User $user): bool
    {
        return $user !== null && ((int) $user->role_id === 1 || $user->role?->name === 'superadmin');
    }

    private function isAdminUser(?User $user): bool
    {
        return $user !== null && ((int) $user->role_id === 2 || $user->role?->name === 'admin');
    }

    private function canEditInvoiceFor(?User $user, Invoice $invoice): bool
    {
        if ($user === null) {
            return false;
        }

        if (!$invoice->locked_at) {
            return true;
        }

        if ($this->isSuperAdminUser($user)) {
            return true;
        }

        return $invoice->edit_override_user_id && (int) $invoice->edit_override_user_id === (int) $user->id;
    }

    private function ensureEditable(Invoice $invoice): ?JsonResponse
    {
        if ($this->canEditInvoiceFor($this->authUser(), $invoice)) {
            return null;
        }

        return response()->json(['message' => 'Invoice is locked'], 403);
    }

    private function parseItems($itemsInput): array
    {
        if (is_string($itemsInput)) {
            $decoded = json_decode($itemsInput, true);
            return is_array($decoded) ? $decoded : [];
        }

        return is_array($itemsInput) ? $itemsInput : [];
    }

    private function validateItems(array $items): array
    {
        $validator = Validator::make(
            ['items' => $items],
            [
                'items' => 'required|array|min:1',
                'items.*.service_id' => 'nullable|exists:services,id',
                'items.*.name' => 'required|string|max:255',
                'items.*.price' => 'required|numeric|min:0',
            ]
        );

        if ($validator->fails()) {
            return ['errors' => $validator->errors()];
        }

        return [];
    }

    private function calculateTotals(array $items, ?string $discountType, float $discountValue): array
    {
        $subtotal = 0;
        $normalizedItems = [];

        foreach ($items as $item) {
            $price = (float) ($item['price'] ?? 0);
            $lineTotal = array_key_exists('line_total', $item)
                ? (float) ($item['line_total'] ?? 0)
                : $price;

            $normalizedItems[] = [
                'service_id' => $item['service_id'] ?? null,
                'name' => $item['name'],
                'price' => $price,
                'line_total' => $lineTotal,
            ];

            $subtotal += $lineTotal;
        }

        $discountAmount = 0.0;
        if ($discountType === 'percent') {
            $discountAmount = max(0, min(100, $discountValue)) * $subtotal / 100;
        } elseif ($discountType === 'amount') {
            $discountAmount = min($subtotal, max(0, $discountValue));
        }

        $total = max(0, $subtotal - $discountAmount);

        return [
            'items' => $normalizedItems,
            'subtotal' => $subtotal,
            'discount_amount' => $discountAmount,
            'total' => $total,
        ];
    }

    private function assignInvoiceNumber(Invoice $invoice): void
    {
        if ($invoice->invoice_number) {
            return;
        }

        $prefix = 'INV-' . now()->format('Ymd') . '-';
        $invoice->invoice_number = $prefix . str_pad((string) $invoice->id, 6, '0', STR_PAD_LEFT);
        $invoice->invoice_date = $invoice->invoice_date ?? now()->toDateString();
        $invoice->save();
    }

    private function resolveContractTemplate(array $items, ?int $contractTemplateId): ?int
    {
        if ($contractTemplateId) {
            return $contractTemplateId;
        }

        $serviceIds = collect($items)
            ->pluck('service_id')
            ->filter()
            ->unique()
            ->values();

        if ($serviceIds->isEmpty()) {
            return null;
        }

        $template = ContractTemplate::query()
            ->where(function ($query) use ($serviceIds) {
                $query->whereIn('service_id', $serviceIds)
                    ->orWhereHas('services', function ($sub) use ($serviceIds) {
                        $sub->whereIn('services.id', $serviceIds);
                    });
            })
            ->orderByDesc('id')
            ->first();

        return $template?->id;
    }

    private function buildInvoiceResponse(Invoice $invoice): array
    {
        $viewer = auth()->user();
        $invoice->loadMissing(self::INVOICE_DETAIL_RELATIONS);

        return [
            'invoice' => $invoice,
            'header_text' => config('invoice.header_text'),
            'footer_text' => config('invoice.footer_text'),
            'logo_url' => config('invoice.company_logo_url'),
            'public_link' => $invoice->public_token
                ? rtrim((string) config('invoice.frontend_url'), '/') . '/invoice/' . $invoice->public_token
                : null,
            'contract_download_url' => $invoice->contractTemplate?->file_path
                ? Storage::disk('public')->url($invoice->contractTemplate->file_path)
                : null,
            'approved_pdf_url' => $invoice->public_token && $invoice->status === 'approved'
                ? url('/api/invoices/public/' . $invoice->public_token . '/approved-pdf')
                : null,
            'payment_evidence_url' => $invoice->payment_evidence_path
                ? Storage::disk('public')->url($invoice->payment_evidence_path)
                : null,
            'student_photo_url' => $invoice->student_photo_path
                ? Storage::disk('public')->url($invoice->student_photo_path)
                : null,
            'permissions' => $this->invoicePermissions($invoice, $viewer),
            'workflow' => $this->invoiceWorkflow($invoice),
            'editor_options' => $this->editorOptionsFor($viewer),
        ];
    }

    private function invoicePermissions(Invoice $invoice, ?User $viewer): array
    {
        $isCash = $invoice->payment_method === 'cash';
        $canApproveCash = $this->isAdminUser($viewer) && $isCash && !$invoice->cash_manager_approved_at;
        $canApprove = $this->isSuperAdminUser($viewer)
            && !$invoice->super_admin_approved_at
            && (!$isCash || (bool) $invoice->cash_manager_approved_at);

        return [
            'can_move_to_preview' => $this->canEditInvoiceFor($viewer, $invoice) && $invoice->status === 'draft',
            'can_approve_cash' => $canApproveCash,
            'can_approve' => $canApprove,
            'can_admin_sign' => $this->isAdminUser($viewer) || $this->isSuperAdminUser($viewer),
            'can_assign_editor' => $this->isSuperAdminUser($viewer),
        ];
    }

    private function invoiceWorkflow(Invoice $invoice): array
    {
        return [
            'requires_cash_approval' => $invoice->payment_method === 'cash',
            'cash_approval_completed' => (bool) $invoice->cash_manager_approved_at,
            'super_admin_approval_completed' => (bool) $invoice->super_admin_approved_at,
        ];
    }

    private function editorOptionsFor(?User $viewer)
    {
        if (!$this->isSuperAdminUser($viewer)) {
            return [];
        }

        return User::query()
            ->select(['id', 'first_name', 'last_name'])
            ->where('role_id', 2)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }

    public function index(): JsonResponse
    {
        $invoices = Invoice::with(self::INVOICE_INDEX_RELATIONS)
            ->orderByDesc('id')
            ->get();

        return response()->json($invoices);
    }

    public function formOptions(): JsonResponse
    {
        $user = $this->authUser()->loadMissing('branch:id,name');
        $branches = $this->isSuperAdminUser($user)
            ? Branch::query()
                ->select(['id', 'name'])
                ->orderBy('name')
                ->get()
            : ($user->branch
                ? collect([[
                    'id' => $user->branch->id,
                    'name' => $user->branch->name,
                ]])
                : collect());

        return response()->json([
            'branch' => $user->branch ? [
                'id' => $user->branch->id,
                'name' => $user->branch->name,
            ] : null,
            'branches' => $branches->values(),
            'customers' => Customer::query()
                ->select(['id', 'first_name', 'last_name', 'email', 'phone'])
                ->orderByDesc('id')
                ->get(),
            'services' => Service::query()
                ->select(['id', 'name', 'price'])
                ->orderBy('name')
                ->get(),
            'sales_persons' => SalesPerson::query()
                ->select(['id', 'first_name', 'last_name'])
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(),
            'assistant_sales_persons' => AssistantSalesPerson::query()
                ->select(['id', 'first_name', 'last_name'])
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get(),
            'contract_templates' => ContractTemplate::query()
                ->select(['id', 'name', 'service_id', 'file_path'])
                ->with(self::CONTRACT_TEMPLATE_FORM_RELATIONS)
                ->orderByDesc('id')
                ->get(),
        ]);
    }

    public function report(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        $query = Invoice::with([
            'branch:id,name',
            'items:id,invoice_id,service_id,name,price,line_total',
        ])
            ->where('status', 'approved')
            ->orderByDesc('invoice_date')
            ->orderByDesc('id');

        if (!empty($validated['branch_id'])) {
            $query->where('branch_id', $validated['branch_id']);
        }

        if (!empty($validated['from'])) {
            $query->whereDate('invoice_date', '>=', $validated['from']);
        }

        if (!empty($validated['to'])) {
            $query->whereDate('invoice_date', '<=', $validated['to']);
        }

        $invoices = $query->get();

        $summary = [
            'approved_invoice_count' => $invoices->count(),
            'total_cash_inflow' => round((float) $invoices->sum('total'), 2),
            'total_item_price' => round((float) $invoices->sum('subtotal'), 2),
        ];

        $branchBreakdown = $invoices
            ->groupBy(fn (Invoice $invoice) => (string) ($invoice->branch_id ?? 0))
            ->map(function ($group) {
                /** @var Invoice $first */
                $first = $group->first();

                return [
                    'branch_id' => $first->branch_id,
                    'branch_name' => $first->branch?->name ?? 'Unassigned',
                    'approved_invoice_count' => $group->count(),
                    'total_cash_inflow' => round((float) $group->sum('total'), 2),
                    'total_item_price' => round((float) $group->sum('subtotal'), 2),
                ];
            })
            ->sortBy('branch_name')
            ->values();

        $itemSales = $invoices
            ->flatMap(function (Invoice $invoice) {
                return $invoice->items->map(function ($item) use ($invoice) {
                    return [
                        'service_id' => $item->service_id,
                        'item_name' => $item->name,
                        'branch_id' => $invoice->branch_id,
                        'branch_name' => $invoice->branch?->name ?? 'Unassigned',
                        'line_total' => (float) $item->line_total,
                    ];
                });
            })
            ->groupBy(function (array $item) {
                return implode('|', [
                    (string) ($item['service_id'] ?? 0),
                    $item['item_name'],
                    (string) ($item['branch_id'] ?? 0),
                ]);
            })
            ->map(function ($group) {
                $first = $group->first();

                return [
                    'service_id' => $first['service_id'],
                    'item_name' => $first['item_name'],
                    'branch_id' => $first['branch_id'],
                    'branch_name' => $first['branch_name'],
                    'sold_count' => $group->count(),
                    'total_item_price' => round((float) $group->sum('line_total'), 2),
                ];
            })
            ->sortByDesc('total_item_price')
            ->values();

        return response()->json([
            'filters' => [
                'branches' => Branch::orderBy('name')->get(['id', 'name']),
                'date_range' => [
                    'from' => $validated['from'] ?? null,
                    'to' => $validated['to'] ?? null,
                ],
            ],
            'summary' => $summary,
            'branch_breakdown' => $branchBreakdown,
            'item_sales' => $itemSales,
            'top_items' => $itemSales->take(5)->values(),
            'service_options' => Service::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function show(Invoice $invoice): JsonResponse
    {
        return response()->json($this->buildInvoiceResponse($invoice));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'customer_id' => 'nullable|exists:customers,id',
            'sales_person_id' => 'nullable|exists:sales_people,id',
            'assistant_sales_person_id' => 'nullable|exists:assistant_sales_people,id',
            'discount_type' => 'nullable|in:amount,percent',
            'discount_value' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|in:bkash,nagad,pos,cash,bank_transfer',
            'contract_template_id' => 'nullable|exists:contract_templates,id',
        ]);

        $items = $this->parseItems($request->input('items', []));
        $itemErrors = $this->validateItems($items);
        if (!empty($itemErrors)) {
            return response()->json($itemErrors, 422);
        }

        $requestedBranchId = array_key_exists('branch_id', $validated) && $validated['branch_id']
            ? (int) $validated['branch_id']
            : null;
        $userBranchId = $this->authUser()->branch_id ? (int) $this->authUser()->branch_id : null;

        if (!$this->isSuperAdmin() && $requestedBranchId && $requestedBranchId !== $userBranchId) {
            return response()->json(['message' => 'You can only create invoices for your assigned branch'], 403);
        }

        $branchId = $this->isSuperAdmin()
            ? ($requestedBranchId ?: $userBranchId)
            : $userBranchId;
        if (!$branchId) {
            return response()->json(['message' => 'Branch is required for invoice creation'], 422);
        }

        $discountType = $validated['discount_type'] ?? null;
        $discountValue = (float) ($validated['discount_value'] ?? 0);
        $paymentMethod = $validated['payment_method'] ?? null;

        $totals = $this->calculateTotals($items, $discountType, $discountValue);

        $contractTemplateId = $this->resolveContractTemplate($totals['items'], $validated['contract_template_id'] ?? null);

        $invoice = Invoice::create([
            'invoice_date' => now()->toDateString(),
            'status' => 'draft',
            'branch_id' => $branchId,
            'customer_id' => $validated['customer_id'] ?? null,
            'sales_person_id' => $validated['sales_person_id'] ?? null,
            'assistant_sales_person_id' => $validated['assistant_sales_person_id'] ?? null,
            'contract_template_id' => $contractTemplateId,
            'payment_method' => $paymentMethod,
            'discount_type' => $discountType,
            'discount_value' => $discountValue,
            'subtotal' => $totals['subtotal'],
            'total' => $totals['total'],
        ]);

        foreach ($totals['items'] as $item) {
            $invoice->items()->create($item);
        }

        if ($paymentMethod !== 'cash' && $request->hasFile('payment_evidence')) {
            $path = $request->file('payment_evidence')->store('invoices/payment-evidence', 'public');
            $invoice->payment_evidence_path = $path;
            $invoice->save();
        }

        $this->assignInvoiceNumber($invoice);

        return response()->json($this->buildInvoiceResponse($invoice), 201);
    }

    public function update(Request $request, Invoice $invoice): JsonResponse
    {
        if ($response = $this->ensureEditable($invoice)) {
            return $response;
        }

        $validated = $request->validate([
            'branch_id' => 'nullable|exists:branches,id',
            'customer_id' => 'nullable|exists:customers,id',
            'sales_person_id' => 'nullable|exists:sales_people,id',
            'assistant_sales_person_id' => 'nullable|exists:assistant_sales_people,id',
            'discount_type' => 'nullable|in:amount,percent',
            'discount_value' => 'nullable|numeric|min:0',
            'payment_method' => 'nullable|in:bkash,nagad,pos,cash,bank_transfer',
            'contract_template_id' => 'nullable|exists:contract_templates,id',
        ]);

        $itemsInput = $request->input('items', null);
        $items = $itemsInput !== null ? $this->parseItems($itemsInput) : null;
        if ($items !== null) {
            $itemErrors = $this->validateItems($items);
            if (!empty($itemErrors)) {
                return response()->json($itemErrors, 422);
            }
        }

        $requestedBranchId = array_key_exists('branch_id', $validated) && $validated['branch_id']
            ? (int) $validated['branch_id']
            : null;
        $userBranchId = $this->authUser()->branch_id ? (int) $this->authUser()->branch_id : null;

        if (!$this->isSuperAdmin() && $requestedBranchId && $requestedBranchId !== $userBranchId) {
            return response()->json(['message' => 'You can only update invoices for your assigned branch'], 403);
        }

        $branchId = $this->isSuperAdmin()
            ? ($requestedBranchId ?: $invoice->branch_id ?: $userBranchId)
            : ($userBranchId ?: $invoice->branch_id);
        if (!$branchId) {
            return response()->json(['message' => 'Branch is required for invoice creation'], 422);
        }

        $discountType = array_key_exists('discount_type', $validated) ? $validated['discount_type'] : $invoice->discount_type;
        $discountValue = array_key_exists('discount_value', $validated) ? (float) $validated['discount_value'] : (float) $invoice->discount_value;
        $paymentMethod = array_key_exists('payment_method', $validated) ? $validated['payment_method'] : $invoice->payment_method;

        $itemsForTotals = $items ?? $invoice->items()->get()->toArray();
        $totals = $this->calculateTotals($itemsForTotals, $discountType, $discountValue);

        if ($items !== null) {
            $invoice->items()->delete();
            foreach ($totals['items'] as $item) {
                $invoice->items()->create($item);
            }
        }

        $invoice->subtotal = $totals['subtotal'];
        $invoice->total = $totals['total'];

        $itemsForContract = $items !== null ? $totals['items'] : $itemsForTotals;

        $contractTemplateId = $this->resolveContractTemplate(
            $itemsForContract,
            $validated['contract_template_id'] ?? $invoice->contract_template_id
        );

        $invoice->fill([
            'branch_id' => $branchId,
            'customer_id' => $validated['customer_id'] ?? $invoice->customer_id,
            'sales_person_id' => $validated['sales_person_id'] ?? $invoice->sales_person_id,
            'assistant_sales_person_id' => $validated['assistant_sales_person_id'] ?? $invoice->assistant_sales_person_id,
            'contract_template_id' => $contractTemplateId,
            'payment_method' => $paymentMethod,
            'discount_type' => $discountType,
            'discount_value' => $discountValue,
        ]);

        if ($paymentMethod === 'cash') {
            if ($invoice->payment_evidence_path) {
                Storage::disk('public')->delete($invoice->payment_evidence_path);
            }
            $invoice->payment_evidence_path = null;
        } elseif ($request->hasFile('payment_evidence')) {
            if ($invoice->payment_evidence_path) {
                Storage::disk('public')->delete($invoice->payment_evidence_path);
            }
            $invoice->payment_evidence_path = $request->file('payment_evidence')->store('invoices/payment-evidence', 'public');
        }

        $invoice->save();

        return response()->json($this->buildInvoiceResponse($invoice));
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        if ($invoice->locked_at || $invoice->status !== 'draft') {
            return response()->json(['message' => 'Only draft invoices can be deleted'], 403);
        }

        $invoice->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    public function preview(Request $request, Invoice $invoice): JsonResponse
    {
        if ($response = $this->ensureEditable($invoice)) {
            return $response;
        }

        if ($invoice->status === 'draft') {
            $invoice->status = 'preview';
        }

        if (!$invoice->public_token) {
            $invoice->public_token = Str::random(48);
        }

        $invoice->preview_sent_at = now();
        $invoice->save();

        $this->sendPreviewEmail($invoice);

        return response()->json($this->buildInvoiceResponse($invoice));
    }

    public function sendPreviewEmail(Invoice $invoice): void
    {
        SendInvoicePreviewMailJob::dispatch($invoice->id)->afterResponse();
    }

    public function approveCash(Invoice $invoice): JsonResponse
    {
        if (!$this->isAdmin() && !$this->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($invoice->payment_method !== 'cash') {
            return response()->json(['message' => 'Cash approval is only required for cash payments'], 422);
        }

        $invoice->cash_manager_approved_at = now();
        $invoice->cash_manager_approved_by = $this->authUser()->id;
        $invoice->save();

        return response()->json($this->buildInvoiceResponse($invoice));
    }

    public function approvalNotifications(): JsonResponse
    {
        if (!$this->isSuperAdmin()) {
            return response()->json([]);
        }

        $notifications = Invoice::with(['customer:id,first_name,last_name', 'cashManager:id,first_name,last_name'])
            ->where('payment_method', 'cash')
            ->whereNotNull('cash_manager_approved_at')
            ->whereNull('super_admin_approved_at')
            ->orderByDesc('cash_manager_approved_at')
            ->get()
            ->map(function (Invoice $invoice) {
                $customerName = trim(implode(' ', array_filter([
                    $invoice->customer?->first_name,
                    $invoice->customer?->last_name,
                ])));

                $managerName = trim(implode(' ', array_filter([
                    $invoice->cashManager?->first_name,
                    $invoice->cashManager?->last_name,
                ])));

                return [
                    'invoice_id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number ?: 'INV-' . $invoice->id,
                    'customer_name' => $customerName !== '' ? $customerName : 'Unknown customer',
                    'cash_manager_name' => $managerName !== '' ? $managerName : 'Admin',
                    'approved_at' => $invoice->cash_manager_approved_at?->toDateTimeString(),
                ];
            })
            ->values();

        return response()->json($notifications);
    }

    public function approve(Request $request, Invoice $invoice): JsonResponse
    {
        if (!$this->isSuperAdmin()) {
            return response()->json(['message' => 'Super admin approval required'], 403);
        }

        if ($invoice->payment_method === 'cash' && !$invoice->cash_manager_approved_at) {
            return response()->json(['message' => 'Cash payment requires admin approval first'], 422);
        }

        if (!$invoice->public_token) {
            $invoice->public_token = Str::random(48);
        }

        $invoice->super_admin_approved_at = now();
        $invoice->super_admin_approved_by = $this->authUser()->id;
        $invoice->status = 'approved';
        $invoice->locked_at = now();
        $invoice->save();

        $this->sendFinalDocuments($invoice);

        return response()->json($this->buildInvoiceResponse($invoice));
    }

    public function adminSign(Request $request, Invoice $invoice): JsonResponse
    {
        if (!$this->isAdmin() && !$this->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'signature_name' => 'required|string|max:255',
            'photo' => 'nullable|file|mimes:jpg,jpeg,png',
        ]);

        if ($request->hasFile('photo')) {
            if ($invoice->student_photo_path) {
                Storage::disk('public')->delete($invoice->student_photo_path);
            }
            $invoice->student_photo_path = $request->file('photo')->store('invoices/student-photos', 'public');
        }

        $invoice->student_signed_at = now();
        $invoice->student_signature_name = $validated['signature_name'];
        $invoice->student_signature_ip = $request->ip();
        $invoice->student_signed_by_admin = true;
        $invoice->student_signed_by_user_id = $this->authUser()->id;
        $invoice->status = $invoice->status === 'approved' ? $invoice->status : 'signed';
        $invoice->save();

        return response()->json($this->buildInvoiceResponse($invoice));
    }

    public function assignEditor(Request $request, Invoice $invoice): JsonResponse
    {
        if (!$this->isSuperAdmin()) {
            return response()->json(['message' => 'Super admin only'], 403);
        }

        $validated = $request->validate([
            'edit_override_user_id' => 'required|exists:users,id',
        ]);

        $invoice->edit_override_user_id = (int) $validated['edit_override_user_id'];
        $invoice->save();

        return response()->json($this->buildInvoiceResponse($invoice));
    }

    private function sendFinalDocuments(Invoice $invoice): void
    {
        SendInvoiceApprovedMailJob::dispatch($invoice->id)->afterResponse();
    }
}
