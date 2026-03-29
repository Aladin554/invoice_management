<?php

namespace Tests\Feature;

use App\Mail\InvoiceApprovedMail;
use App\Models\Customer;
use App\Models\Invoice;
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

        $invoice = Invoice::create([
            'customer_id' => $customer->id,
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

        $mail = new InvoiceApprovedMail($invoice->fresh(['customer']), 'https://example.com/invoice/token');
        $mail->build();

        $this->assertCount(1, $mail->rawAttachments);
        $this->assertSame('INV-20260327-000001.pdf', $mail->rawAttachments[0]['name']);
        $this->assertSame('application/pdf', $mail->rawAttachments[0]['options']['mime']);
        $this->assertStringStartsWith('%PDF', $mail->rawAttachments[0]['data']);
    }
}
