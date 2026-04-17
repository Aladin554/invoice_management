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
                'agree' => 'required|boolean',
                'photo' => 'required|file|mimes:jpg,jpeg,png',
            ]
        ));

        if (!$validated['agree']) {
            return response()->json(['message' => 'Agreement is required'], 422);
        }

        $signatureName = trim((string) $validated['signature_name']);
        if ($signatureName === '') {
            return response()->json(['message' => 'Signature name is required'], 422);
        }

        if ($invoice->show_student_information) {
            $customer->fill($this->customerProfilePayload($validated));
            $customer->save();
        }

        $this->storeStudentPhoto($request, $invoice);

        $submittedAt = now();
        $invoice->customer_profile_submitted_at = $invoice->show_student_information
            ? $submittedAt
            : null;
        $invoice->student_signed_at = $submittedAt;
        $invoice->student_signature_name = $signatureName;
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
            'student_photo_url' => $invoice->student_photo_path
                ? Storage::disk('public')->url($invoice->student_photo_path)
                : null,
        ];
    }

    private function noRefundContractDownloadUrl(Invoice $invoice): ?string
    {
        if (!$invoice->show_no_refund_contract || !$invoice->public_token) {
            return null;
        }

        return url('/api/invoices/public/' . $invoice->public_token . '/no-refund-contract-pdf');
    }

    private function requiresCashApproval(Invoice $invoice): bool
    {
        return $invoice->payment_method === 'cash';
    }
}
