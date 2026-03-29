<?php

namespace Tests\Feature;

use App\Http\Middleware\RestrictAdminIp;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InvoiceShowPermissionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_invoice_show_returns_backend_driven_permissions_for_admin_and_superadmin(): void
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
            'invoice_number' => 'INV-20260328-001111',
            'invoice_date' => now()->toDateString(),
            'status' => 'preview',
            'payment_method' => 'cash',
            'subtotal' => 1200,
            'total' => 1200,
        ]);

        Sanctum::actingAs($admin);
        $adminResponse = $this->getJson("/api/invoices/{$invoice->id}");

        $adminResponse->assertOk()
            ->assertJsonPath('permissions.can_approve_cash', true)
            ->assertJsonPath('permissions.can_approve', false)
            ->assertJsonPath('permissions.can_assign_editor', false);

        $invoice->update([
            'cash_manager_approved_at' => now(),
            'cash_manager_approved_by' => $admin->id,
        ]);

        Sanctum::actingAs($superAdmin);
        $superAdminResponse = $this->getJson("/api/invoices/{$invoice->id}");

        $superAdminResponse->assertOk()
            ->assertJsonPath('permissions.can_approve_cash', false)
            ->assertJsonPath('permissions.can_approve', true)
            ->assertJsonPath('permissions.can_assign_editor', true)
            ->assertJsonFragment([
                'id' => $admin->id,
                'first_name' => 'Cash',
                'last_name' => 'Admin',
            ]);
    }
}
