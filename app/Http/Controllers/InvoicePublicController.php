<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithCustomerProfile;
use App\Jobs\SendInvoiceApprovedMailJob;
use App\Models\Invoice;
use App\Support\InvoicePdfRenderer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class InvoicePublicController extends Controller
{
    use InteractsWithCustomerProfile;

    public function show(string $token): JsonResponse
    {
        $invoice = $this->findInvoiceByToken($token);

        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        return response()->json($this->buildPublicInvoiceResponse($invoice));
    }

    public function downloadApprovedPdf(string $token, InvoicePdfRenderer $pdfRenderer): Response
    {
        $invoice = $this->findInvoiceByToken($token);

        if (!$invoice || $invoice->status !== 'approved') {
            return response(['message' => 'Invoice not found'], 404);
        }

        $pdfContent = $pdfRenderer->renderApprovedInvoice($invoice);
        $fileName = $pdfRenderer->fileName($invoice);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ]);
    }

    public function downloadReceiptPdf(string $token, InvoicePdfRenderer $pdfRenderer): Response
    {
        $invoice = $this->findInvoiceByToken($token);

        if (!$invoice || $invoice->status !== 'approved') {
            return response(['message' => 'Invoice not found'], 404);
        }

        $pdfContent = $pdfRenderer->renderReceiptPdf($invoice);
        $fileName = $pdfRenderer->receiptPdfFileName($invoice);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ]);
    }

    public function downloadContractPdf(string $token, InvoicePdfRenderer $pdfRenderer): Response
    {
        $invoice = $this->findInvoiceByToken($token);

        if (!$invoice || !$pdfRenderer->contractDownloadUrl($invoice)) {
            return response(['message' => 'Invoice not found'], 404);
        }

        $pdfContent = $pdfRenderer->renderAgreement($invoice);
        $fileName = $pdfRenderer->fileName($invoice);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ]);
    }

    public function downloadNoRefundContractPdf(string $token, InvoicePdfRenderer $pdfRenderer): Response
    {
        $invoice = $this->findInvoiceByToken($token);

        if (!$invoice || !$invoice->show_no_refund_contract) {
            return response(['message' => 'Invoice not found'], 404);
        }

        $pdfContent = $pdfRenderer->renderNoRefundContract($invoice);
        $fileName = $pdfRenderer->noRefundContractFileName($invoice);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ]);
    }

    public function updateCustomerProfile(Request $request, string $token): JsonResponse
    {
        $invoice = $this->findInvoiceByToken($token);

        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        $customer = $invoice->customer;
        if (!$customer) {
            return response()->json(['message' => 'No customer is linked to this invoice'], 422);
        }

        if (!$invoice->show_student_information) {
            return response()->json(['message' => 'Student information is disabled for this invoice'], 422);
        }

        if ($invoice->customer_profile_submitted_at) {
            return response()->json([
                'message' => 'Student profile has already been submitted and cannot be edited again.',
            ], 422);
        }

        $validated = $request->validate($this->customerProfileRules(true, $customer->id));

        $customer->fill($this->customerProfilePayload($validated));
        $customer->save();

        return response()->json(array_merge(
            ['message' => 'Customer profile saved successfully'],
            $this->buildPublicInvoiceResponse($invoice->fresh())
        ));
    }

    public function submit(Request $request, string $token): JsonResponse
    {
        $invoice = $this->findInvoiceByToken($token);

        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        $customer = $invoice->customer;
        if (!$customer) {
            return response()->json(['message' => 'No customer is linked to this invoice'], 422);
        }

        if ($invoice->customer_profile_submitted_at || $invoice->student_signed_at) {
            return response()->json([
                'message' => 'Student details have already been submitted and cannot be edited again.',
            ], 422);
        }

        $validated = $request->validate(array_merge(
            $invoice->show_student_information
                ? $this->customerProfileRules(true, $customer->id)
                : [],
            [
                'signature_name' => 'required|string|max:255',
                'nid' => 'required|file|mimes:jpg,jpeg,png,pdf,doc,docx|max:10240',
                'agree' => 'required|boolean',
                'photo' => 'required|file|mimes:jpg,jpeg,png|max:10240',
                'counsellor_approval_evidence' => [
                    Rule::requiredIf(
                        $invoice->show_student_information
                        && $request->input('has_study_gap') === 'yes'
                        && $request->input('counsellor_discussed_complex_profile') === 'yes'
                    ),
                    'nullable',
                    'file',
                    'mimes:jpg,jpeg,png,webp,pdf,doc,docx',
                    'max:10240',
                ],
                'wants_connected_bank_loan_support' => [
                    Rule::requiredIf(
                        $invoice->show_student_information
                        && (
                            $request->input('has_at_least_fifty_lacs_bank_statement') === 'no'
                            || $request->input('has_at_least_fifty_lacs_bank_statement') === 'confused'
                        )
                    ),
                    'nullable',
                    'string',
                    Rule::in($this->yesNoOptions()),
                ],
            ]
        ));

        if (!$validated['agree']) {
            return response()->json(['message' => 'Agreement is required'], 422);
        }

        $signatureName = trim((string) $validated['signature_name']);
        if ($signatureName === '') {
            return response()->json(['message' => 'Signature name is required'], 422);
        }

        if (!$request->hasFile('nid')) {
            return response()->json(['message' => 'National ID file is required'], 422);
        }

        if ($invoice->show_student_information) {
            $customer->fill($this->customerProfilePayload($validated));
            $customer->save();
            $this->storeCounsellorApprovalEvidence($request, $invoice);
        }

        $this->storeStudentPhoto($request, $invoice);
        $this->storeStudentNid($request, $invoice);

        $submittedAt = now();
        $invoice->customer_profile_submitted_at = $invoice->show_student_information
            ? $submittedAt
            : null;
        $invoice->student_signed_at = $submittedAt;
        $invoice->student_signature_name = $signatureName;
        $invoice->student_nid = $request->file('nid')->getClientOriginalName();
        $invoice->student_signature_ip = $request->ip();
        $invoice->student_signed_by_admin = false;

        if ($this->requiresCashApproval($invoice)) {
            $invoice->status = 'signed';
        } else {
            if (!$invoice->public_token) {
                $invoice->public_token = Str::random(48);
            }

            $invoice->status = 'approved';
            $invoice->locked_at = $submittedAt;
        }

        $invoice->save();

        if (!$this->requiresCashApproval($invoice)) {
            SendInvoiceApprovedMailJob::dispatch($invoice->id)->afterResponse();
        }

        return response()->json(array_merge(
            ['message' => 'Student details submitted successfully'],
            $this->buildPublicInvoiceResponse($invoice->fresh())
        ));
    }

    public function sign(Request $request, string $token): JsonResponse
    {
        $invoice = Invoice::where('public_token', $token)->first();

        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        $validated = $request->validate([
            'signature_name' => 'required|string|max:255',
            'agree' => 'required|boolean',
            'photo' => 'required|file|mimes:jpg,jpeg,png',
        ]);

        if (!$validated['agree']) {
            return response()->json(['message' => 'Agreement is required'], 422);
        }

        $signatureName = trim((string) $validated['signature_name']);
        if ($signatureName === '') {
            return response()->json(['message' => 'Signature name is required'], 422);
        }

        $this->storeStudentPhoto($request, $invoice);

        $invoice->student_signed_at = now();
        $invoice->student_signature_name = $signatureName;
        $invoice->student_signature_ip = $request->ip();
        $invoice->student_signed_by_admin = false;
        if ($invoice->status !== 'approved') {
            $invoice->status = 'signed';
        }
        $invoice->save();

        return response()->json([
            'message' => 'Signature saved',
            'invoice' => $invoice,
            'student_photo_url' => $invoice->student_photo_path
                ? Storage::disk('public')->url($invoice->student_photo_path)
                : null,
        ]);
    }

    private function storeStudentPhoto(Request $request, Invoice $invoice): void
    {
        if (!$request->hasFile('photo')) {
            return;
        }

        if ($invoice->student_photo_path) {
            Storage::disk('public')->delete($invoice->student_photo_path);
        }

        $invoice->student_photo_path = $request->file('photo')->store('invoices/student-photos', 'public');
    }

    private function storeCounsellorApprovalEvidence(Request $request, Invoice $invoice): void
    {
        if (!$request->hasFile('counsellor_approval_evidence')) {
            return;
        }

        if ($invoice->counsellor_approval_evidence_path) {
            Storage::disk('public')->delete($invoice->counsellor_approval_evidence_path);
        }

        $invoice->counsellor_approval_evidence_path = $request->file('counsellor_approval_evidence')
            ->store('invoices/counsellor-approval-evidence', 'public');
    }

    private function storeStudentNid(Request $request, Invoice $invoice): void
    {
        if (!$request->hasFile('nid')) {
            return;
        }

        if ($invoice->student_nid_path) {
            Storage::disk('public')->delete($invoice->student_nid_path);
        }

        $invoice->student_nid_path = $request->file('nid')->store('invoices/student-nid', 'public');
    }

    private function findInvoiceByToken(string $token): ?Invoice
    {
        return Invoice::where('public_token', $token)
            ->with(['items', 'branch', 'customer', 'contractTemplate', 'salesPerson', 'assistantSalesPerson'])
            ->first();
    }

    private function buildPublicInvoiceResponse(Invoice $invoice): array
    {
        $invoice->load(['items', 'branch', 'customer', 'contractTemplate', 'salesPerson', 'assistantSalesPerson']);
        $pdfRenderer = app(InvoicePdfRenderer::class);

        return [
            'invoice' => $invoice,
            'header_text' => config('invoice.header_text'),
            'footer_text' => config('invoice.footer_text'),
            'logo_url' => config('invoice.company_logo_url'),
            'contract_download_url' => $pdfRenderer->contractDownloadUrl($invoice),
            'no_refund_contract_download_url' => $this->noRefundContractDownloadUrl($invoice),
            'receipt_pdf_url' => $pdfRenderer->receiptPdfUrl($invoice),
            'student_photo_url' => $invoice->student_photo_path
                ? Storage::disk('public')->url($invoice->student_photo_path)
                : null,
            'student_nid_url' => $invoice->student_nid_path
                ? Storage::disk('public')->url($invoice->student_nid_path)
                : null,
            'counsellor_approval_evidence_url' => $invoice->counsellor_approval_evidence_path
                ? Storage::disk('public')->url($invoice->counsellor_approval_evidence_path)
                : null,
        ];
    }

    private function noRefundContractDownloadUrl(Invoice $invoice): ?string
    {
        if (!$invoice->show_no_refund_contract || !$invoice->public_token) {
            return null;
        }

        return '/api/invoices/public/' . rawurlencode($invoice->public_token) . '/no-refund-contract-pdf';
    }

    private function requiresCashApproval(Invoice $invoice): bool
    {
        return $invoice->payment_method === 'cash';
    }
}
