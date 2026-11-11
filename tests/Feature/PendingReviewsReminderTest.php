<?php

namespace Tests\Feature;

use App\Mail\PendingReviewsMail;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class PendingReviewsReminderTest extends TestCase
{
    use RefreshDatabase;

    private function user(int $roleId, string $email, array $extra = []): User
    {
        $user = User::create([
            'first_name' => 'User',
            'last_name' => (string) $roleId,
            'email' => $email,
            'password' => bcrypt('password'),
            'role_id' => $roleId,
        ]);

        if ($extra) {
            $user->forceFill($extra)->save();
        }

        return $user;
    }

    private function invoice(array $attributes): Invoice
    {
        $customer = Customer::create([
            'first_name' => 'Jane',
            'last_name' => 'Student',
            'email' => 'jane_' . Str::random(6) . '@example.com',
            'phone' => '0123456789',
        ]);

        $invoice = Invoice::create(array_merge([
            'customer_id' => $customer->id,
            'public_token' => Str::random(40),
            'invoice_date' => now()->toDateString(),
            'status' => 'preview',
            'payment_method' => 'cash',
            'subtotal' => 1000,
            'total' => 1000,
            'due_amount' => 0,
            'show_student_information' => false,
        ], $attributes));

        // Workflow timestamps are not mass-assignable on every model version.
        $invoice->forceFill($attributes)->save();

        return $invoice->refresh();
    }

    private function ids($collection): array
    {
        return $collection->pluck('id')->sort()->values()->all();
    }

    public function test_emails_every_super_admin_the_invoices_waiting_for_cash_and_final_review(): void
    {
        Mail::fake();

        $cashier = $this->user(2, 'cashier@example.com');
        $this->user(1, 'boss1@example.com');
        $this->user(1, 'boss2@example.com');
        $this->user(1, 'expired@example.com', ['account_expires_at' => now()->subDay()]);

        // Cash Review: cash received, not verified yet (signed or not).
        $cashUnsigned = $this->invoice([]);
        $cashSigned = $this->invoice(['student_signed_at' => now(), 'due_amount' => 400]);
        // Final Review: cash reviewed, final review not done (with or without due).
        $finalPaid = $this->invoice(['cash_manager_approved_at' => now(), 'cash_manager_approved_by' => $cashier->id]);
        $finalWithDue = $this->invoice(['cash_manager_approved_at' => now(), 'due_amount' => 500]);

        // Not waiting on any review:
        $this->invoice(['cash_manager_approved_at' => now(), 'final_review_approved_at' => now(), 'due_amount' => 300]);
        $this->invoice(['status' => 'approved', 'super_admin_approved_at' => now()]);
        $this->invoice(['payment_method' => 'bkash', 'student_signed_at' => now(), 'due_amount' => 200]); // due list
        $this->invoice(['payment_method' => 'bkash']); // not signed, no cash

        $this->artisan('invoices:remind-pending-reviews')->assertSuccessful();

        Mail::assertSent(PendingReviewsMail::class, 2);
        foreach (['boss1@example.com', 'boss2@example.com'] as $email) {
            Mail::assertSent(PendingReviewsMail::class, fn (PendingReviewsMail $mail) => $mail->hasTo($email)
                && $this->ids($mail->cashReview) === [$cashUnsigned->id, $cashSigned->id]
                && $this->ids($mail->finalReview) === [$finalPaid->id, $finalWithDue->id]);
        }
        Mail::assertNotSent(PendingReviewsMail::class, fn ($mail) => $mail->hasTo('expired@example.com') || $mail->hasTo('cashier@example.com'));
    }

    public function test_sends_when_only_cash_review_is_waiting(): void
    {
        Mail::fake();
        $this->user(1, 'boss@example.com');
        $invoice = $this->invoice([]);

        $this->artisan('invoices:remind-pending-reviews')->assertSuccessful();

        Mail::assertSent(PendingReviewsMail::class, fn ($mail) => $this->ids($mail->cashReview) === [$invoice->id]
            && $mail->finalReview->isEmpty());
    }

    public function test_cash_due_instalment_on_a_non_cash_invoice_needs_cash_then_final_review(): void
    {
        Mail::fake();
        $this->user(1, 'boss@example.com');

        $invoice = $this->invoice(['payment_method' => 'bkash', 'student_signed_at' => now()]);
        $invoice->duePayments()->create([
            'amount' => 500,
            'payment_method' => 'cash',
            'payment_date' => now()->toDateString(),
        ]);

        $this->artisan('invoices:remind-pending-reviews')->assertSuccessful();
        Mail::assertSent(PendingReviewsMail::class, fn ($mail) => $this->ids($mail->cashReview) === [$invoice->id]);

        $invoice->forceFill(['cash_manager_approved_at' => now()])->save();
        Mail::fake();

        $this->artisan('invoices:remind-pending-reviews')->assertSuccessful();
        Mail::assertSent(PendingReviewsMail::class, fn ($mail) => $this->ids($mail->finalReview) === [$invoice->id]
            && $mail->cashReview->isEmpty());
    }

    public function test_sends_nothing_when_no_invoice_is_waiting(): void
    {
        Mail::fake();
        $this->user(1, 'boss@example.com');
        $this->invoice(['cash_manager_approved_at' => now(), 'final_review_approved_at' => now(), 'due_amount' => 300]);

        $this->artisan('invoices:remind-pending-reviews')->assertSuccessful();

        Mail::assertNothingSent();
    }

    public function test_mail_renders_both_sections(): void
    {
        $cash = $this->invoice([])->load('customer', 'branch');
        $final = $this->invoice(['cash_manager_approved_at' => now()])->load('customer', 'branch', 'cashManager');

        $mail = new PendingReviewsMail(collect([$cash]), collect([$final]), 'https://invoice.example.com');
        $html = $mail->render();

        $this->assertSame('Action needed: 2 invoices waiting for your approval (Cash Review: 1, Final Review: 1)', $mail->subject);
        $this->assertStringContainsString('Cash Review (1)', $html);
        $this->assertStringContainsString('Final Review (1)', $html);
        $this->assertStringContainsString("https://invoice.example.com/invoices/{$cash->id}/preview", $html);
        $this->assertStringContainsString("https://invoice.example.com/invoices/{$final->id}/preview", $html);
    }

    public function test_scheduled_twice_a_day_at_10am_and_4pm_dhaka_time(): void
    {
        $event = collect(app(Schedule::class)->events())
            ->first(fn ($e) => str_contains((string) $e->command, 'invoices:remind-pending-reviews'));

        $this->assertNotNull($event);
        $this->assertSame('0 10,16 * * *', $event->expression);
        $this->assertSame('Asia/Dhaka', $event->timezone);
    }
}
