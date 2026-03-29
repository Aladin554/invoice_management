<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Invoice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceApprovedPdfDownloadTest extends TestCase
{
    use RefreshDatabase;

    public function test_approved_invoice_pdf_can_be_downloaded_from_public_route(): void
    {
        $customer = Customer::create([
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'email' => 'jane@example.com',
            'phone' => '0123456789',
        ]);

        $invoice = Invoice::create([
            'customer_id' => $customer->id,
            'public_token' => 'approved-pdf-token',
            'invoice_number' => 'INV-20260328-000001',
            'invoice_date' => now()->toDateString(),
            'status' => 'approved',
            'subtotal' => 1200,
            'total' => 1200,
        ]);

        $response = $this->get("/api/invoices/public/{$invoice->public_token}/approved-pdf");

        $response->assertOk();
        $this->assertSame('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('.pdf', (string) $response->headers->get('Content-Disposition'));
        $this->assertStringStartsWith('%PDF', (string) $response->getContent());
    }
}
