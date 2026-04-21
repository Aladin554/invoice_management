<?php

namespace Tests\Feature;

use App\Http\Middleware\RestrictAdminIp;
use App\Jobs\SendInvoiceApprovedMailJob;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InvoiceResendApprovedEmailTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_resend_approved_email_for_approved_invoice(): void
    {
        $this->withoutMiddleware(RestrictAdminIp::class);
        Bus::fake();

        $admin = User::create([
            'first_name' => 'Cash',
            'last_name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role_id' => 2,
        ]);

        $customer = Customer::create([
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'email' => 'jane@example.com',
            'phone' => '0123456789',
        ]);

        $invoice = Invoice::create([
            'customer_id' => $customer->id,
            'public_token' => 'approved-resend-token',
            'invoice_number' => 'INV-20260328-009999',
            'invoice_date' => now()->toDateString(),
            'status' => 'approved',
            'subtotal' => 1200,
            'total' => 1200,
        ]);

        Sanctum::actingAs($admin);

        $this->postJson("/api/invoices/{$invoice->id}/resend-approved-email")
            ->assertOk()
            ->assertJson([
                'message' => 'Approved email resent successfully',
            ]);

        Bus::assertDispatched(SendInvoiceApprovedMailJob::class, function (SendInvoiceApprovedMailJob $job) use ($invoice) {
            return $job->invoiceId === $invoice->id;
        });
    }
}
