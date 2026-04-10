<?php

namespace Tests\Feature;

use App\Models\ContractTemplate;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceContractPdfDownloadTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_invoice_response_exposes_dynamic_contract_pdf_url(): void
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
            'price' => 50000,
        ]);

        $template = ContractTemplate::create([
            'name' => 'Australia Admission Contract',
            'description' => 'Admission agreement for Australia-bound students.',
            'service_id' => $service->id,
        ]);
        $template->services()->sync([$service->id]);

        $invoice = Invoice::create([
            'customer_id' => $customer->id,
            'contract_template_id' => $template->id,
            'public_token' => 'contract-preview-token',
            'invoice_number' => 'INV-20260410-000001',
            'invoice_date' => now()->toDateString(),
            'status' => 'preview',
            'subtotal' => 50000,
            'total' => 50000,
        ]);

        $invoice->items()->create([
            'service_id' => $service->id,
            'name' => 'Admission Package',
            'price' => 50000,
            'line_total' => 50000,
        ]);

        $response = $this->getJson("/api/invoices/public/{$invoice->public_token}");

        $response
            ->assertOk()
            ->assertJsonPath(
                'contract_download_url',
                url("/api/invoices/public/{$invoice->public_token}/contract-pdf")
            );
    }

    public function test_contract_pdf_can_be_downloaded_before_approval(): void
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
            'price' => 50000,
        ]);

        $template = ContractTemplate::create([
            'name' => 'Australia Admission Contract',
            'description' => 'Admission agreement for Australia-bound students.',
            'service_id' => $service->id,
        ]);
        $template->services()->sync([$service->id]);

        $invoice = Invoice::create([
            'customer_id' => $customer->id,
            'contract_template_id' => $template->id,
            'public_token' => 'contract-download-token',
            'invoice_number' => 'INV-20260410-000002',
            'invoice_date' => now()->toDateString(),
            'status' => 'preview',
            'subtotal' => 50000,
            'total' => 50000,
        ]);

        $invoice->items()->create([
            'service_id' => $service->id,
            'name' => 'Admission Package',
            'price' => 50000,
            'line_total' => 50000,
        ]);

        $response = $this->get("/api/invoices/public/{$invoice->public_token}/contract-pdf");

        $response->assertOk();
        $this->assertSame('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('.pdf', (string) $response->headers->get('Content-Disposition'));
        $this->assertStringStartsWith('%PDF', (string) $response->getContent());
    }
}
