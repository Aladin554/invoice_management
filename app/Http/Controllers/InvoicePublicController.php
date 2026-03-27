<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\InteractsWithCustomerProfile;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

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

        if ($invoice->customer_profile_submitted_at) {
            return response()->json([
                'message' => 'Student profile has already been submitted and cannot be edited again.',
            ], 422);
        }

        $validated = $request->validate($this->customerProfileRules());

        $customer->fill($this->customerProfilePayload($validated));
        $customer->save();

        $invoice->customer_profile_submitted_at = now();
        $invoice->save();

        return response()->json(array_merge(
            ['message' => 'Customer profile saved successfully'],
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

        if ($request->hasFile('photo')) {
            if ($invoice->student_photo_path) {
                Storage::disk('public')->delete($invoice->student_photo_path);
            }
            $invoice->student_photo_path = $request->file('photo')->store('invoices/student-photos', 'public');
        }

        $invoice->student_signed_at = now();
        $invoice->student_signature_name = $validated['signature_name'];
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

    private function findInvoiceByToken(string $token): ?Invoice
    {
        return Invoice::where('public_token', $token)
            ->with(['items', 'branch', 'customer', 'contractTemplate', 'salesPerson', 'assistantSalesPerson'])
            ->first();
    }

    private function buildPublicInvoiceResponse(Invoice $invoice): array
    {
        $invoice->load(['items', 'branch', 'customer', 'contractTemplate', 'salesPerson', 'assistantSalesPerson']);

        return [
            'invoice' => $invoice,
            'header_text' => config('invoice.header_text'),
            'footer_text' => config('invoice.footer_text'),
            'logo_url' => config('invoice.company_logo_url'),
            'contract_download_url' => $invoice->contractTemplate?->file_path
                ? Storage::disk('public')->url($invoice->contractTemplate->file_path)
                : null,
            'student_photo_url' => $invoice->student_photo_path
                ? Storage::disk('public')->url($invoice->student_photo_path)
                : null,
        ];
    }
}
