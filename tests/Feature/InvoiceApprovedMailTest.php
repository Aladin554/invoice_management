<?php

namespace Tests\Feature;

use App\Mail\InvoiceApprovedMail;
use App\Models\ContractTemplate;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceApprovedMailTest extends TestCase
{
    use RefreshDatabase;

    public function test_approved_mail_attaches_pdf(): void
    {
        $customer = Customer::create([
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'email' => 'jane@example.com',
            'phone' => '0123456789',
        ]);

        $service = Service::create([
            'name' => 'Admission Package',
            'description' => 'Admission support service.',
            'price' => 1200,
        ]);

        $template = ContractTemplate::create([
            'name' => 'Admission Contract',
            'description' => 'Dynamic agreement for the selected admission package.',
            'service_id' => $service->id,
        ]);
        $template->services()->sync([$service->id]);

        $invoice = Invoice::create([
            'customer_id' => $customer->id,
            'contract_template_id' => $template->id,
            'public_token' => 'approved-mail-token',
            'invoice_number' => 'INV-20260327-000001',
            'invoice_date' => now()->toDateString(),
            'status' => 'approved',
            'subtotal' => 1200,
            'discount_type' => 'amount',
            'discount_value' => 200,
            'total' => 1000,
            'student_signature_name' => 'Jane Student',
            'student_signed_at' => now(),
        ]);
        $invoice->items()->create([
            'service_id' => $service->id,
            'name' => 'Admission Package',
            'price' => 1200,
            'line_total' => 1200,
        ]);

        $mail = new InvoiceApprovedMail($invoice->fresh(['customer']), 'https://example.com/invoice/token');
        $mail->build();

        $this->assertCount(1, $mail->rawAttachments);
        $this->assertSame('29000.pdf', $mail->rawAttachments[0]['name']);
        $this->assertSame('application/pdf', $mail->rawAttachments[0]['options']['mime']);
        $this->assertStringStartsWith('%PDF', $mail->rawAttachments[0]['data']);
        $this->assertSame(
            url("/api/invoices/public/{$invoice->public_token}/contract-pdf"),
            $mail->contractUrl
        );
        $this->assertSame(
            url("/api/invoices/public/{$invoice->public_token}/approved-pdf"),
            $mail->approvedPdfUrl
        );
    }
}
