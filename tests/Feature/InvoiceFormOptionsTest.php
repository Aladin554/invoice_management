<?php

namespace Tests\Feature;

use App\Http\Middleware\RestrictAdminIp;
use App\Models\AssistantSalesPerson;
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

    public function test_invoice_form_options_are_returned_from_a_single_endpoint(): void
    {
        $this->withoutMiddleware(RestrictAdminIp::class);

        $user = User::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
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
}
