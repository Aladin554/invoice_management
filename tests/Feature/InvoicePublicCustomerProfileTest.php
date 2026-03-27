<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Invoice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoicePublicCustomerProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_invoice_customer_profile_is_saved_to_the_customer_record(): void
    {
        $customer = Customer::create([
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'email' => 'jane@example.com',
            'phone' => '0123456789',
        ]);

        $invoice = Invoice::create([
            'customer_id' => $customer->id,
            'public_token' => 'secure-public-token',
            'status' => 'preview',
            'subtotal' => 1200,
            'total' => 1200,
        ]);

        $payload = [
            'academic_profile_ssc' => 'GPA 5.00 out of 5.00 (100%)',
            'academic_profile_hsc' => 'GPA 4.80 out of 5.00 (96%)',
            'academic_profile_bachelor' => 'CGPA 3.75 out of 4.00 (93.75%)',
            'academic_profile_masters' => 'N/A',
            'study_gap' => '1 year',
            'total_funds_for_applicant' => 'BDT 2,000,000',
            'total_funds_for_accompanying_members' => 'BDT 500,000',
            'moving_abroad_member_count' => 2,
            'available_documents' => ['passport', 'cv', 'portfolio'],
            'english_language_proficiencies' => ['ielts', 'duolingo'],
        ];

        $response = $this->postJson("/api/invoices/public/{$invoice->public_token}/customer-profile", $payload);

        $response
            ->assertOk()
            ->assertJsonPath('invoice.customer.academic_profile_ssc', $payload['academic_profile_ssc'])
            ->assertJsonPath('invoice.customer.available_documents.1', 'cv')
            ->assertJsonPath('invoice.customer.english_language_proficiencies.0', 'ielts');

        $customer->refresh();
        $invoice->refresh();

        $this->assertSame($payload['study_gap'], $customer->study_gap);
        $this->assertSame($payload['moving_abroad_member_count'], $customer->moving_abroad_member_count);
        $this->assertSame($payload['available_documents'], $customer->available_documents);
        $this->assertSame($payload['english_language_proficiencies'], $customer->english_language_proficiencies);
        $this->assertNotNull($invoice->customer_profile_submitted_at);
    }

    public function test_public_invoice_customer_profile_cannot_be_edited_after_first_save(): void
    {
        $customer = Customer::create([
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'email' => 'jane@example.com',
            'phone' => '0123456789',
        ]);

        $invoice = Invoice::create([
            'customer_id' => $customer->id,
            'public_token' => 'locked-profile-token',
            'status' => 'preview',
            'subtotal' => 1200,
            'total' => 1200,
        ]);

        $firstPayload = [
            'academic_profile_ssc' => 'GPA 5.00 out of 5.00 (100%)',
            'study_gap' => '1 year',
        ];

        $this->postJson("/api/invoices/public/{$invoice->public_token}/customer-profile", $firstPayload)
            ->assertOk();

        $secondPayload = [
            'academic_profile_ssc' => 'Changed result',
            'study_gap' => '2 years',
        ];

        $this->postJson("/api/invoices/public/{$invoice->public_token}/customer-profile", $secondPayload)
            ->assertStatus(422)
            ->assertJsonPath(
                'message',
                'Student profile has already been submitted and cannot be edited again.'
            );

        $customer->refresh();

        $this->assertSame($firstPayload['academic_profile_ssc'], $customer->academic_profile_ssc);
        $this->assertSame($firstPayload['study_gap'], $customer->study_gap);
    }
}
