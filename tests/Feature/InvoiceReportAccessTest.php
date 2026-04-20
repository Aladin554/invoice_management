<?php

namespace Tests\Feature;

use App\Http\Middleware\RestrictAdminIp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InvoiceReportAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_superadmin_can_access_invoice_report(): void
    {
        $this->withoutMiddleware(RestrictAdminIp::class);

        $user = User::create([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'superadmin@example.com',
            'password' => bcrypt('password'),
            'role_id' => 1,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/invoice-report')
            ->assertOk()
            ->assertJsonStructure([
                'filters',
                'summary',
                'branch_breakdown',
                'sales_person_breakdown',
                'assistant_sales_person_breakdown',
                'item_sales',
                'top_items',
                'service_options',
            ]);
    }

    public function test_admin_cannot_access_invoice_report(): void
    {
        $this->withoutMiddleware(RestrictAdminIp::class);

        $user = User::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role_id' => 2,
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/invoice-report')
            ->assertForbidden()
            ->assertJson([
                'message' => 'Only super admins can access reports',
            ]);
    }
}
