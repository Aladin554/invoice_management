<?php

namespace Tests\Feature;

use App\Http\Middleware\RestrictAdminIp;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Student Payment & Approval Flow.
 *
 * Classification: ONLY `cash` is cash. bkash / nagad / pos / bank_transfer are
 * all non-cash and share identical approval behaviour.
 *
 * The method of the *settling* payment (the one that brings due to 0) decides:
 *   settling non-cash → Auto Approved   |   settling cash → Cash Review → Final Review
 * An application can NEVER be approved while a due remains.
 */
class StudentPaymentApprovalFlowTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        return User::create([
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'super_' . Str::random(6) . '@example.com',
            'password' => bcrypt('password'),
            'role_id' => 1,
        ]);
    }

    private function admin(): User
    {
        return User::create([
            'first_name' => 'Cash',
            'last_name' => 'Manager',
            'email' => 'admin_' . Str::random(6) . '@example.com',
            'password' => bcrypt('password'),
            'role_id' => 2,
        ]);
    }

    private function makeInvoice(string $method, float $total, float $due): Invoice
    {
        $customer = Customer::create([
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'email' => 'jane_' . Str::random(6) . '@example.com',
            'phone' => '0123456789',
        ]);

        return Invoice::create([
            'customer_id' => $customer->id,
            'public_token' => Str::random(40),
            'invoice_date' => now()->toDateString(),
            'status' => 'preview',
            'payment_method' => $method,
            'subtotal' => $total,
            'total' => $total,
            'due_amount' => $due,
            'show_student_information' => false,
        ]);
    }

    private function submitForm(Invoice $invoice): TestResponse
    {
        return $this->post("/api/invoices/public/{$invoice->public_token}/submit", [
            'signature_name' => 'Jane Student',
            'agree' => '1',
            'photo' => UploadedFile::fake()->image('photo.jpg'),
            'nid' => UploadedFile::fake()->create('nid.pdf', 10, 'application/pdf'),
        ]);
    }

    private function payDue(Invoice $invoice, User $actor, float $amount, string $method): TestResponse
    {
        $this->withoutMiddleware(RestrictAdminIp::class);
        Sanctum::actingAs($actor);

        $payload = ['amount' => $amount, 'payment_method' => $method];
        if ($method !== 'cash') {
            $payload['proof'] = UploadedFile::fake()->image('proof.jpg');
        }

        return $this->post("/api/invoices/{$invoice->id}/due-payment", $payload);
    }

    private function approveCash(Invoice $invoice, User $actor): TestResponse
    {
        $this->withoutMiddleware(RestrictAdminIp::class);
        Sanctum::actingAs($actor);

        return $this->postJson("/api/invoices/{$invoice->id}/approve-cash");
    }

    private function approve(Invoice $invoice, User $actor): TestResponse
    {
        $this->withoutMiddleware(RestrictAdminIp::class);
        Sanctum::actingAs($actor);

        return $this->postJson("/api/invoices/{$invoice->id}/approve");
    }

    private function assertApproved(Invoice $invoice): void
    {
        $this->assertSame('approved', $invoice->fresh()->status);
    }

    private function assertNotApproved(Invoice $invoice): void
    {
        $this->assertNotSame('approved', $invoice->fresh()->status);
    }

    // ── RULE 1: Non-cash + No Due → Auto Approved ──────────────────────────

    public function test_1_bkash_no_due_auto_approved(): void
    {
        Storage::fake('public');
        $invoice = $this->makeInvoice('bkash', 1000, 0);
        $this->submitForm($invoice)->assertOk();
        $this->assertApproved($invoice);
    }

    public function test_2_nagad_no_due_auto_approved(): void
    {
        Storage::fake('public');
        $invoice = $this->makeInvoice('nagad', 1000, 0);
        $this->submitForm($invoice)->assertOk();
        $this->assertApproved($invoice);
    }

    public function test_3_pos_no_due_auto_approved(): void
    {
        Storage::fake('public');
        $invoice = $this->makeInvoice('pos', 1000, 0);
        $this->submitForm($invoice)->assertOk();
        $this->assertApproved($invoice);
    }

    public function test_4_bank_transfer_no_due_auto_approved(): void
    {
        Storage::fake('public');
        $invoice = $this->makeInvoice('bank_transfer', 1000, 0);
        $this->submitForm($invoice)->assertOk();
        $this->assertApproved($invoice);
    }

    // ── RULE 2: Cash + No Due → Signed → Cash Review → Final Review → Approved

    public function test_5_cash_no_due_goes_through_cash_and_final_review(): void
    {
        Storage::fake('public');
        [$super, $admin] = [$this->superAdmin(), $this->admin()];
        $invoice = $this->makeInvoice('cash', 1000, 0);

        $this->submitForm($invoice)->assertOk();
        // Cash must NEVER auto-approve.
        $this->assertSame('signed', $invoice->fresh()->status);

        $this->approveCash($invoice, $admin)->assertOk();
        $this->assertNotNull($invoice->fresh()->cash_manager_approved_at);
        $this->assertNotApproved($invoice);

        $this->approve($invoice, $super)->assertOk();
        $this->assertApproved($invoice);
    }

    // ── RULE 3: Non-cash init + Due paid by Non-cash → Auto Approved ───────

    public function test_6_bkash_due_paid_by_bkash_auto_approved(): void
    {
        Storage::fake('public');
        $super = $this->superAdmin();
        $invoice = $this->makeInvoice('bkash', 1000, 400);

        $this->submitForm($invoice)->assertOk();
        $this->assertSame('signed', $invoice->fresh()->status); // Due List

        $this->payDue($invoice, $super, 400, 'bkash')->assertOk();
        $this->assertApproved($invoice);
        $this->assertSame('0.00', $invoice->fresh()->due_amount);
    }

    public function test_7_bkash_due_paid_by_nagad_auto_approved(): void
    {
        Storage::fake('public');
        $super = $this->superAdmin();
        $invoice = $this->makeInvoice('bkash', 1000, 400);
        $this->submitForm($invoice)->assertOk();
        $this->payDue($invoice, $super, 400, 'nagad')->assertOk();
        $this->assertApproved($invoice);
    }

    public function test_8_bkash_due_paid_by_pos_auto_approved(): void
    {
        Storage::fake('public');
        $super = $this->superAdmin();
        $invoice = $this->makeInvoice('bkash', 1000, 400);
        $this->submitForm($invoice)->assertOk();
        $this->payDue($invoice, $super, 400, 'pos')->assertOk();
        $this->assertApproved($invoice);
    }

    public function test_9_bkash_due_paid_by_bank_transfer_auto_approved(): void
    {
        Storage::fake('public');
        $super = $this->superAdmin();
        $invoice = $this->makeInvoice('bkash', 1000, 400);
        $this->submitForm($invoice)->assertOk();
        $this->payDue($invoice, $super, 400, 'bank_transfer')->assertOk();
        $this->assertApproved($invoice);
    }

    // ── RULE 4: Non-cash init + Due paid by Cash → Cash Review chain ───────

    public function test_10_bkash_due_paid_by_cash_goes_to_cash_review(): void
    {
        Storage::fake('public');
        [$super, $admin] = [$this->superAdmin(), $this->admin()];
        $invoice = $this->makeInvoice('bkash', 1000, 400);

        $this->submitForm($invoice)->assertOk();
        $this->payDue($invoice, $super, 400, 'cash')->assertOk();

        // Cash settling must NOT auto-approve, even though the initial was bKash.
        $this->assertNotApproved($invoice);
        $this->assertSame('0.00', $invoice->fresh()->due_amount);

        $this->approveCash($invoice, $admin)->assertOk();
        $this->approve($invoice, $super)->assertOk();
        $this->assertApproved($invoice);
    }

    // ── RULE 5: Cash init + Due → Cash Review first, then Non-cash due →
    //           Auto Approved (no super-admin final review). ───────────────
    // A cash initial payment ALWAYS routes to Cash Review after form fill,
    // even while a due remains, so the cash is verified.

    private function assertCashReviewRequiredAndPending(Invoice $invoice): void
    {
        $fresh = $invoice->fresh();
        $this->assertTrue($fresh->cash_review_required, 'Cash invoice with due must require cash review.');
        $this->assertNull($fresh->cash_manager_approved_at);
        $this->assertNotSame('approved', $fresh->status);
    }

    public function test_11_cash_due_paid_by_bkash_cash_review_then_auto_approved(): void
    {
        Storage::fake('public');
        [$super, $admin] = [$this->superAdmin(), $this->admin()];
        $invoice = $this->makeInvoice('cash', 1000, 400);

        $this->submitForm($invoice)->assertOk();
        // Cash + Due → Cash Review (the reported bug).
        $this->assertCashReviewRequiredAndPending($invoice);

        $this->approveCash($invoice, $admin)->assertOk();
        $this->payDue($invoice, $super, 400, 'bkash')->assertOk();
        $this->assertApproved($invoice);
    }

    public function test_12_cash_due_paid_by_nagad_cash_review_then_auto_approved(): void
    {
        Storage::fake('public');
        [$super, $admin] = [$this->superAdmin(), $this->admin()];
        $invoice = $this->makeInvoice('cash', 1000, 400);
        $this->submitForm($invoice)->assertOk();
        $this->assertCashReviewRequiredAndPending($invoice);
        $this->approveCash($invoice, $admin)->assertOk();
        $this->payDue($invoice, $super, 400, 'nagad')->assertOk();
        $this->assertApproved($invoice);
    }

    public function test_13_cash_due_paid_by_pos_cash_review_then_auto_approved(): void
    {
        Storage::fake('public');
        [$super, $admin] = [$this->superAdmin(), $this->admin()];
        $invoice = $this->makeInvoice('cash', 1000, 400);
        $this->submitForm($invoice)->assertOk();
        // Order variant: pay the due first, then cash review triggers approval.
        $this->payDue($invoice, $super, 400, 'pos')->assertOk();
        $this->assertNotApproved($invoice);
        $this->approveCash($invoice, $admin)->assertOk();
        $this->assertApproved($invoice);
    }

    public function test_14_cash_due_paid_by_bank_transfer_cash_review_then_auto_approved(): void
    {
        Storage::fake('public');
        [$super, $admin] = [$this->superAdmin(), $this->admin()];
        $invoice = $this->makeInvoice('cash', 1000, 400);
        $this->submitForm($invoice)->assertOk();
        $this->assertCashReviewRequiredAndPending($invoice);
        $this->approveCash($invoice, $admin)->assertOk();
        $this->payDue($invoice, $super, 400, 'bank_transfer')->assertOk();
        $this->assertApproved($invoice);
    }

    // ── CRITICAL: cannot approve while Due > 0 ─────────────────────────────

    public function test_15_final_review_cannot_approve_while_due_outstanding(): void
    {
        Storage::fake('public');
        $super = $this->superAdmin();
        $invoice = $this->makeInvoice('cash', 1000, 400);
        $this->submitForm($invoice)->assertOk();

        // Cash not yet reviewed → approval is blocked at the cash-review guard.
        $this->approve($invoice, $super)->assertStatus(422);
        $this->assertNotApproved($invoice);
    }

    // ── Final Review "Approve" with a due → money-received confirmation ─────
    // After Cash Review a Cash + Due invoice sits in Final Review. Clicking
    // Approve there is NOT an approval: it confirms the money received so far
    // and moves the application to the Due List until the balance is collected.

    public function test_18_final_review_approve_with_due_moves_to_due_list(): void
    {
        Storage::fake('public');
        [$super, $admin] = [$this->superAdmin(), $this->admin()];
        $invoice = $this->makeInvoice('cash', 1000, 400);

        $this->submitForm($invoice)->assertOk();
        $this->approveCash($invoice, $admin)->assertOk();
        $this->assertNotApproved($invoice);

        // Super Admin clicks Approve while the due remains.
        $response = $this->approve($invoice, $super);
        $response->assertOk();
        $response->assertJson(['moved_to_due' => true]);

        $fresh = $invoice->fresh();
        $this->assertNotSame('approved', $fresh->status);
        $this->assertNotNull($fresh->due_acknowledged_at);
        $this->assertSame('400.00', $fresh->due_amount);

        // Collect the remaining cash due — fresh cash re-triggers Cash Review:
        // the review must be redone before it can go back to Final Review.
        $this->payDue($invoice, $super, 400, 'cash')->assertOk();
        $fresh = $invoice->fresh();
        $this->assertSame('0.00', $fresh->due_amount);
        $this->assertNull($fresh->cash_manager_approved_at, 'Cash due must reopen Cash Review.');
        $this->assertTrue($fresh->cash_review_required);

        // Approving while cash review is pending is blocked.
        $this->approve($invoice, $super)->assertStatus(422);

        // Cash Review → Final Review → Approved.
        $this->approveCash($invoice, $admin)->assertOk();
        $this->approve($invoice, $super)->assertOk();
        $this->assertApproved($invoice);
    }

    // ── PARTIAL payment must remain in Due List ────────────────────────────

    public function test_16_partial_due_payment_stays_in_due_list(): void
    {
        Storage::fake('public');
        $super = $this->superAdmin();
        $invoice = $this->makeInvoice('bkash', 1000, 1000);
        $this->submitForm($invoice)->assertOk();

        $this->payDue($invoice, $super, 400, 'bkash')->assertOk();

        $this->assertNotApproved($invoice);
        $this->assertSame('600.00', $invoice->fresh()->due_amount);
    }

    // ── RULE 6: Cash init + Cash Due → Cash Review → Final Review → Approved

    public function test_17_cash_due_paid_by_cash_goes_through_review_chain(): void
    {
        Storage::fake('public');
        [$super, $admin] = [$this->superAdmin(), $this->admin()];
        $invoice = $this->makeInvoice('cash', 1000, 400);

        $this->submitForm($invoice)->assertOk();
        $this->payDue($invoice, $super, 400, 'cash')->assertOk();

        $this->assertNotApproved($invoice);
        $this->assertSame('0.00', $invoice->fresh()->due_amount);

        $this->approveCash($invoice, $admin)->assertOk();
        $this->approve($invoice, $super)->assertOk();
        $this->assertApproved($invoice);
    }

    // ── Non-cash due payment requires proof ────────────────────────────────

    public function test_non_cash_due_payment_requires_proof(): void
    {
        Storage::fake('public');
        $this->withoutMiddleware(RestrictAdminIp::class);
        $super = $this->superAdmin();
        $invoice = $this->makeInvoice('bkash', 1000, 400);
        $this->submitForm($invoice)->assertOk();

        Sanctum::actingAs($super);
        // No proof attached for a non-cash method → validation error.
        $this->postJson("/api/invoices/{$invoice->id}/due-payment", [
            'amount' => 400,
            'payment_method' => 'bkash',
        ])->assertStatus(422);
    }
}
