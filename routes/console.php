<?php

use App\Mail\FinalReviewPendingMail;
use App\Models\User;
use App\Support\PendingFinalReview;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('invoices:remind-final-review', function (PendingFinalReview $pending) {
    $invoices = $pending->invoices();

    if ($invoices->isEmpty()) {
        $this->info('No invoices waiting for Final Review.');

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

    foreach ($superAdmins as $superAdmin) {
        try {
            Mail::to($superAdmin->email)->send(new FinalReviewPendingMail($invoices, $panelUrl));
            $this->info("Sent to {$superAdmin->email} ({$invoices->count()} invoices).");
        } catch (\Throwable $e) {
            // One bad address must not stop the others from being reminded.
            Log::error('Final review reminder failed', ['user_id' => $superAdmin->id, 'error' => $e->getMessage()]);
            $this->error("Failed for user {$superAdmin->id}: {$e->getMessage()}");
        }
    }
})->purpose('Email every super admin the invoices waiting for their Final Review');

// Twice a day inside office hours (9 AM – 6 PM Bangladesh time).
Schedule::command('invoices:remind-final-review')
    ->twiceDaily(10, 16)
    ->timezone('Asia/Dhaka');
