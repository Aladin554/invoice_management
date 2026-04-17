<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Invoice;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class InvoicePublicSignatureOnlySubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_invoice_submit_only_requires_signature_fields_when_student_information_is_disabled(): void
    {
        Storage::fake('public');

        $customer = Customer::create([
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'email' => 'jane@example.com',
            'phone' => '0123456789',
        ]);

        $invoice = Invoice::create([
            'customer_id' => $customer->id,
            'public_token' => 'signature-only-submit-token',
            'status' => 'preview',
            'payment_method' => 'cash',
            'subtotal' => 1200,
            'total' => 1200,
            'show_student_information' => false,
        ]);

        $response = $this->post("/api/invoices/public/{$invoice->public_token}/submit", [
            'signature_name' => 'Jane Student',
            'agree' => '1',
            'photo' => UploadedFile::fake()->image('student-photo.jpg'),
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('invoice.student_signature_name', 'Jane Student')
            ->assertJsonPath('invoice.show_student_information', false);

        $customer->refresh();
        $invoice->refresh();

        $this->assertSame('0123456789', $customer->phone);
        $this->assertSame('jane@example.com', $customer->email);
        $this->assertNull($invoice->customer_profile_submitted_at);
        $this->assertNotNull($invoice->student_signed_at);
        $this->assertSame('Jane Student', $invoice->student_signature_name);
        $this->assertSame('signed', $invoice->status);
        $this->assertNotNull($invoice->student_photo_path);
        $this->assertCount(1, Storage::disk('public')->allFiles('invoices/student-photos'));
    }
}
