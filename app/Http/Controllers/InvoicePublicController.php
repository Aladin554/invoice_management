<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class InvoicePublicController extends Controller
{
    public function show(string $token): JsonResponse
    {
        $invoice = Invoice::where('public_token', $token)
            ->with(['items', 'branch', 'customer', 'contractTemplate', 'salesPerson', 'assistantSalesPerson'])
            ->first();

        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        return response()->json([
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
        ]);
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
}
