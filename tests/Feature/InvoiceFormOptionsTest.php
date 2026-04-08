<?php

namespace Tests\Feature;

use App\Http\Middleware\RestrictAdminIp;
use App\Models\AssistantSalesPerson;
use App\Models\Branch;
use App\Models\ContractTemplate;
use App\Models\Customer;
use App\Models\SalesPerson;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InvoiceFormOptionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_invoice_form_options_include_the_users_assigned_branch(): void
    {
        $this->withoutMiddleware(RestrictAdminIp::class);

        $branch = Branch::create([
            'name' => 'Dhaka',
        ]);

        $user = User::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role_id' => 2,
            'branch_id' => $branch->id,
        ]);

        $customer = Customer::create([
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'email' => 'jane@example.com',
            'phone' => '0123456789',
        ]);

        $service = Service::create([
            'name' => 'Visa Package',
            'description' => 'Visa support package',
            'price' => 75000,
        ]);

        $salesPerson = SalesPerson::create([
            'first_name' => 'Sales',
            'last_name' => 'One',
            'email' => 'sales@example.com',
            'phone' => '01700000000',
        ]);

        $assistant = AssistantSalesPerson::create([
            'first_name' => 'Assistant',
            'last_name' => 'One',
            'email' => 'assistant@example.com',
            'phone' => '01800000000',
        ]);

        $template = ContractTemplate::create([
            'name' => 'Australia Package',
            'service_id' => $service->id,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/invoices/form-options');

        $response->assertOk()
            ->assertJsonPath('branch.id', $branch->id)
            ->assertJsonPath('branch.name', 'Dhaka')
            ->assertJsonCount(1, 'branches')
            ->assertJsonFragment([
                'id' => $branch->id,
                'name' => 'Dhaka',
            ])
            ->assertJsonFragment([
                'id' => $customer->id,
                'email' => 'jane@example.com',
            ])
            ->assertJsonFragment([
                'id' => $service->id,
                'name' => 'Visa Package',
            ])
            ->assertJsonFragment([
                'id' => $salesPerson->id,
                'first_name' => 'Sales',
            ])
            ->assertJsonFragment([
                'id' => $assistant->id,
                'first_name' => 'Assistant',
            ])
            ->assertJsonFragment([
                'id' => $template->id,
                'name' => 'Australia Package',
            ]);
    }

    public function test_superadmin_receives_all_branch_options_for_invoice_forms(): void
    {
        $this->withoutMiddleware(RestrictAdminIp::class);

        $branchA = Branch::create(['name' => 'Chattogram']);
        $branchB = Branch::create(['name' => 'Dhaka']);

        $user = User::create([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'superadmin@example.com',
            'password' => bcrypt('password'),
            'role_id' => 1,
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/invoices/form-options');

        $response->assertOk()
            ->assertJsonPath('branch', null)
            ->assertJsonCount(2, 'branches')
            ->assertJsonFragment([
                'id' => $branchA->id,
                'name' => 'Chattogram',
            ])
            ->assertJsonFragment([
                'id' => $branchB->id,
                'name' => 'Dhaka',
            ]);
    }
}
