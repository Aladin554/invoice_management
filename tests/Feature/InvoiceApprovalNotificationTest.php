<?php

namespace Tests\Feature;

use App\Http\Middleware\RestrictAdminIp;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InvoiceApprovalNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_superadmin_sees_cash_approval_notification_after_manager_approval(): void
    {
        $this->withoutMiddleware(RestrictAdminIp::class);

        $superAdmin = User::create([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'superadmin@example.com',
            'password' => bcrypt('password'),
            'role_id' => 1,
        ]);

        $admin = User::create([
            'first_name' => 'Cash',
            'last_name' => 'Manager',
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
            'invoice_number' => 'INV-20260328-000777',
            'invoice_date' => now()->toDateString(),
            'status' => 'preview',
            'payment_method' => 'cash',
            'subtotal' => 1200,
            'total' => 1200,
        ]);

        Sanctum::actingAs($admin);
        $this->postJson("/api/invoices/{$invoice->id}/approve-cash")->assertOk();

        Sanctum::actingAs($superAdmin);
        $response = $this->getJson('/api/invoices/approval-notifications');

        $response->assertOk()
            ->assertJsonCount(1)
            ->assertJsonFragment([
                'invoice_id' => $invoice->id,
                'invoice_number' => 'INV-20260328-000777',
                'customer_name' => 'Jane Student',
                'cash_manager_name' => 'Cash Manager',
            ]);
    }
}
