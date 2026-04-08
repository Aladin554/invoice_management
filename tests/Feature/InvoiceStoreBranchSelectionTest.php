<?php

namespace Tests\Feature;

use App\Http\Middleware\RestrictAdminIp;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InvoiceStoreBranchSelectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_superadmin_can_choose_a_branch_when_creating_an_invoice(): void
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
            'branch_id' => $branchA->id,
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

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/invoices', [
            'branch_id' => $branchB->id,
            'customer_id' => $customer->id,
            'payment_method' => 'cash',
            'items' => [
                [
                    'service_id' => $service->id,
                    'name' => $service->name,
                    'price' => $service->price,
                ],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('invoice.branch_id', $branchB->id)
            ->assertJsonPath('invoice.payment_method', 'cash');

        $this->assertDatabaseHas('invoices', [
            'branch_id' => $branchB->id,
            'customer_id' => $customer->id,
            'payment_method' => 'cash',
        ]);
    }

    public function test_admin_cannot_create_an_invoice_for_a_different_branch(): void
    {
        $this->withoutMiddleware(RestrictAdminIp::class);

        $branchA = Branch::create(['name' => 'Chattogram']);
        $branchB = Branch::create(['name' => 'Dhaka']);

        $user = User::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role_id' => 2,
            'branch_id' => $branchA->id,
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

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/invoices', [
            'branch_id' => $branchB->id,
            'customer_id' => $customer->id,
            'payment_method' => 'cash',
            'items' => [
                [
                    'service_id' => $service->id,
                    'name' => $service->name,
                    'price' => $service->price,
                ],
            ],
        ]);

        $response->assertForbidden()
            ->assertJson([
                'message' => 'You can only create invoices for your assigned branch',
            ]);

        $this->assertDatabaseCount('invoices', 0);
    }
}
