<?php

namespace Tests\Unit;

use App\Models\ContractTemplate;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\Service;
use App\Support\InvoicePdfRenderer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoicePdfRendererTest extends TestCase
{
    use RefreshDatabase;

    public function test_view_data_includes_selected_and_additional_services_from_invoice_and_template(): void
    {
        $customer = Customer::create([
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'email' => 'jane@example.com',
            'phone' => '0123456789',
        ]);

        $admissionService = Service::create([
            'name' => 'Admission Package',
            'description' => 'Admission support service.',
            'price' => 50000,
        ]);

        $visaService = Service::create([
            'name' => 'Visa Package',
            'description' => 'Visa support service.',
            'price' => 70000,
        ]);

        $loanSupportService = Service::create([
            'name' => 'Loan Support',
            'description' => 'Loan support service.',
            'price' => 15000,
        ]);

        $template = ContractTemplate::create([
            'name' => 'Australia Combo Contract',
            'description' => 'Dynamic agreement based on the selected services.',
            'service_id' => $admissionService->id,
        ]);
        $template->services()->sync([
            $admissionService->id,
            $visaService->id,
            $loanSupportService->id,
        ]);

        $invoice = Invoice::create([
            'customer_id' => $customer->id,
            'contract_template_id' => $template->id,
            'invoice_number' => 'INV-20260410-000003',
            'invoice_date' => now()->toDateString(),
            'status' => 'preview',
            'subtotal' => 120000,
            'total' => 120000,
        ]);

        $invoice->items()->create([
            'service_id' => $admissionService->id,
            'name' => 'Admission Package',
            'price' => 50000,
            'line_total' => 50000,
        ]);

        $invoice->items()->create([
            'service_id' => $visaService->id,
            'name' => 'Visa Package',
            'price' => 70000,
            'line_total' => 70000,
        ]);

        $renderer = app(InvoicePdfRenderer::class);
        $viewData = $renderer->viewData($invoice->fresh());

        $this->assertSame('Australia Combo Contract', $viewData['contractHeading']);
        $this->assertSame('Dynamic agreement based on the selected services.', $viewData['contractDescription']);
        $this->assertSame([
            ['name' => 'Admission Package', 'amount' => 'BDT 50,000/-'],
            ['name' => 'Visa Package', 'amount' => 'BDT 70,000/-'],
        ], $viewData['selectedServiceRows']);
        $this->assertSame([
            ['name' => 'Loan Support', 'amount' => 'BDT 15,000/-'],
        ], $viewData['additionalServiceRows']);
    }
}
