<?php

use App\Mail\PendingReviewsMail;
use App\Models\User;
use App\Support\PendingReviews;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('invoices:remind-pending-reviews', function (PendingReviews $pending) {
    $groups = $pending->grouped();
    $cashReview = $groups[PendingReviews::CASH_REVIEW];
    $finalReview = $groups[PendingReviews::FINAL_REVIEW];

    if ($cashReview->isEmpty() && $finalReview->isEmpty()) {
        $this->info('No invoices waiting for Cash Review or Final Review.');

        return;
    }

    $superAdmins = User::query()
        ->where('role_id', 1)
        ->whereNotNull('email')
        ->where('email', '!=', '')
        ->where(fn ($q) => $q->whereNull('account_expires_at')->orWhere('account_expires_at', '>', now()))
        ->get(['id', 'email']);

    if ($superAdmins->isEmpty()) {
        $this->warn('No super admin with an email address.');

        return;
    }

    $panelUrl = rtrim((string) config('invoice.frontend_url'), '/');
    $summary = "cash review {$cashReview->count()}, final review {$finalReview->count()}";

    foreach ($superAdmins as $superAdmin) {
        try {
            Mail::to($superAdmin->email)->send(new PendingReviewsMail($cashReview, $finalReview, $panelUrl));
            Log::info('Pending reviews reminder sent', ['user_id' => $superAdmin->id, 'email' => $superAdmin->email,
                'cash_review' => $cashReview->count(), 'final_review' => $finalReview->count()]);
            $this->info("Sent to {$superAdmin->email} ({$summary}).");
        } catch (\Throwable $e) {
            // One bad address must not stop the others from being reminded.
            Log::error('Pending reviews reminder failed', ['user_id' => $superAdmin->id, 'error' => $e->getMessage()]);
            $this->error("Failed for user {$superAdmin->id}: {$e->getMessage()}");
        }
    }
})->purpose('Email every super admin the invoices waiting for Cash Review or Final Review');

// Twice a day inside office hours (9 AM – 6 PM Bangladesh time).
Schedule::command('invoices:remind-pending-reviews')
    ->twiceDaily(10, 16)
    ->timezone('Asia/Dhaka');
