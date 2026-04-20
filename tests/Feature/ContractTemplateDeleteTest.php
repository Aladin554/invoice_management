<?php

namespace Tests\Feature;

use App\Http\Middleware\RestrictAdminIp;
use App\Models\ContractTemplate;
use App\Models\Invoice;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ContractTemplateDeleteTest extends TestCase
{
    use RefreshDatabase;

    public function test_deleting_a_contract_template_clears_invoice_links_and_service_pivots(): void
    {
        $this->withoutMiddleware(RestrictAdminIp::class);

        $user = User::create([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'superadmin@example.com',
            'password' => bcrypt('password'),
            'role_id' => 1,
        ]);

        $service = Service::create([
            'name' => 'Visa Service',
            'description' => 'Visa service package',
            'price' => 5000,
        ]);

        $template = ContractTemplate::create([
            'name' => 'Visa Template',
            'service_id' => $service->id,
        ]);
        $template->services()->attach($service->id);

        $invoice = Invoice::create([
            'invoice_number' => 'INV-DELETE-001',
            'invoice_date' => now()->toDateString(),
            'status' => 'draft',
            'contract_template_id' => $template->id,
            'subtotal' => 5000,
            'total' => 5000,
        ]);

        Sanctum::actingAs($user);

        $this->deleteJson("/api/contract-templates/{$template->id}")
            ->assertOk()
            ->assertJson([
                'message' => 'Deleted successfully',
            ]);

        $this->assertDatabaseMissing('contract_templates', [
            'id' => $template->id,
        ]);
        $this->assertDatabaseMissing('contract_template_service', [
            'contract_template_id' => $template->id,
            'service_id' => $service->id,
        ]);

        $invoice->refresh();
        $this->assertNull($invoice->contract_template_id);
    }
}
