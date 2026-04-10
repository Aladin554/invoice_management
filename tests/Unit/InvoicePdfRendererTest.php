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

    private function createInvoiceWithTemplate(Customer $customer): Invoice
    {
        $service = Service::create([
            'name' => 'Admission Package',
            'description' => 'Admission support service.',
            'price' => 50000,
        ]);

        $template = ContractTemplate::create([
            'name' => 'Australia Combo Contract',
            'description' => 'Dynamic agreement based on the selected services.',
            'service_id' => $service->id,
        ]);
        $template->services()->sync([$service->id]);

        $invoice = Invoice::create([
            'customer_id' => $customer->id,
            'contract_template_id' => $template->id,
            'invoice_number' => 'INV-20260410-000003',
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

        return $invoice;
    }

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

    public function test_profile_agreement_section_is_hidden_when_no_profile_data_exists(): void
    {
        $customer = Customer::create([
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'email' => 'jane@example.com',
            'phone' => '0123456789',
        ]);

        $invoice = $this->createInvoiceWithTemplate($customer);
        $renderer = app(InvoicePdfRenderer::class);
        $viewData = $renderer->viewData($invoice->fresh());
        $html = view('pdf.invoice_approved', $viewData)->render();

        $this->assertFalse($viewData['hasProfileAgreementSection']);
        $this->assertSame([], $viewData['profileAgreementRows']);
        $this->assertStringNotContainsString('Profile Agreement for the Client', $html);
    }

    public function test_profile_agreement_section_shows_only_answered_questions(): void
    {
        $customer = Customer::create([
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'email' => 'jane@example.com',
            'phone' => '0123456789',
            'preferred_study_country_primary' => 'canada',
            'academic_profile_ssc' => 'GPA 5.00 out of 5.00',
            'has_study_gap' => 'yes',
            'study_gap_details' => 'Worked full-time for 2 years.',
            'available_documents' => ['passport', 'cv'],
        ]);

        $invoice = $this->createInvoiceWithTemplate($customer);
        $invoice->customer_profile_submitted_at = now();
        $invoice->save();

        $renderer = app(InvoicePdfRenderer::class);
        $viewData = $renderer->viewData($invoice->fresh());
        $html = view('pdf.invoice_approved', $viewData)->render();

        $this->assertTrue($viewData['hasProfileAgreementSection']);
        $this->assertNotEmpty($viewData['profileAgreementRows']);
        $this->assertStringContainsString('Profile Agreement for the Client', $html);
        $this->assertStringContainsString('Student Phone Number', $html);
        $this->assertStringContainsString('Preferred Country to Study: First Priority', $html);
        $this->assertStringContainsString('Canada', $html);
        $this->assertStringContainsString('Documents Student Can Provide', $html);
        $this->assertStringContainsString('Passport, CV', $html);
        $this->assertStringContainsString('Did you carefully read our terms and conditions contract carefully?', $html);
        $this->assertStringNotContainsString('Preferred Country to Study: Second Priority', $html);
        $this->assertStringNotContainsString('Institution Preference', $html);
    }
}
