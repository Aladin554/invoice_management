<?php

namespace App\Http\Controllers;

use App\Mail\InvoiceApprovedMail;
use App\Mail\InvoicePreviewMail;
use App\Models\Branch;
use App\Models\ContractTemplate;
use App\Models\Invoice;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class InvoiceController extends Controller
{
    private function authUser(): User
    {
        return auth()->user();
    }

    private function isSuperAdmin(): bool
    {
        $user = $this->authUser();
        return (int) $user->role_id === 1 || $user->role?->name === 'superadmin';
    }

    private function isAdmin(): bool
    {
        $user = $this->authUser();
        return (int) $user->role_id === 2 || $user->role?->name === 'admin';
    }

    private function ensureEditable(Invoice $invoice): ?JsonResponse
    {
        if (!$invoice->locked_at) {
            return null;
        }

        if ($this->isSuperAdmin()) {
            return null;
        }

        if ($invoice->edit_override_user_id && (int) $invoice->edit_override_user_id === (int) $this->authUser()->id) {
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

        $template = ContractTemplate::where('is_active', true)
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
        $invoice->load(['items', 'branch', 'customer', 'salesPerson', 'assistantSalesPerson', 'contractTemplate']);

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
            'payment_evidence_url' => $invoice->payment_evidence_path
                ? Storage::disk('public')->url($invoice->payment_evidence_path)
                : null,
            'student_photo_url' => $invoice->student_photo_path
                ? Storage::disk('public')->url($invoice->student_photo_path)
                : null,
        ];
    }

    public function index(): JsonResponse
    {
        $invoices = Invoice::with(['customer', 'branch', 'salesPerson', 'assistantSalesPerson'])
            ->orderByDesc('id')
            ->get();

        return response()->json($invoices);
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

        $branchId = $request->input('branch_id') ?: $this->authUser()->branch_id;
        if (!$branchId) {
            return response()->json(['message' => 'Branch is required for invoice creation'], 422);
        }

        $discountType = $validated['discount_type'] ?? null;
        $discountValue = (float) ($validated['discount_value'] ?? 0);

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
            'payment_method' => $validated['payment_method'] ?? null,
            'discount_type' => $discountType,
            'discount_value' => $discountValue,
            'subtotal' => $totals['subtotal'],
            'total' => $totals['total'],
        ]);

        foreach ($totals['items'] as $item) {
            $invoice->items()->create($item);
        }

        if ($request->hasFile('payment_evidence')) {
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

        $discountType = array_key_exists('discount_type', $validated) ? $validated['discount_type'] : $invoice->discount_type;
        $discountValue = array_key_exists('discount_value', $validated) ? (float) $validated['discount_value'] : (float) $invoice->discount_value;

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
            'customer_id' => $validated['customer_id'] ?? $invoice->customer_id,
            'sales_person_id' => $validated['sales_person_id'] ?? $invoice->sales_person_id,
            'assistant_sales_person_id' => $validated['assistant_sales_person_id'] ?? $invoice->assistant_sales_person_id,
            'contract_template_id' => $contractTemplateId,
            'payment_method' => $validated['payment_method'] ?? $invoice->payment_method,
            'discount_type' => $discountType,
            'discount_value' => $discountValue,
        ]);

        if ($request->hasFile('payment_evidence')) {
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
        $customer = $invoice->customer;
        if (!$customer || empty($customer->email)) {
            return;
        }

        $publicLink = rtrim((string) config('invoice.frontend_url'), '/') . '/invoice/' . $invoice->public_token;
        Mail::to($customer->email)->send(new InvoicePreviewMail($invoice, $publicLink));
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

    public function approve(Request $request, Invoice $invoice): JsonResponse
    {
        if (!$this->isSuperAdmin()) {
            return response()->json(['message' => 'Super admin approval required'], 403);
        }

        if ($invoice->payment_method === 'cash' && !$invoice->cash_manager_approved_at) {
            return response()->json(['message' => 'Cash payment requires manager approval first'], 422);
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
        $customer = $invoice->customer;
        if (!$customer || empty($customer->email)) {
            return;
        }

        $publicLink = $invoice->public_token
            ? rtrim((string) config('invoice.frontend_url'), '/') . '/invoice/' . $invoice->public_token
            : null;

        Mail::to($customer->email)->send(new InvoiceApprovedMail($invoice, $publicLink));
    }
}
