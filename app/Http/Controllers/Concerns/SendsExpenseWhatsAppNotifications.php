<?php

namespace App\Http\Controllers\Concerns;

use App\Jobs\SendWhatsAppNotificationJob;
use App\Models\WhatsAppSetting;

trait SendsExpenseWhatsAppNotifications
{
    /**
     * Reminds the Owner (via the single configured number in WhatsApp
     * settings) that an expense request is waiting on their approval.
     */
    private function notifyOwnerPendingApproval(string $message): void
    {
        $phone = WhatsAppSetting::current()?->owner_phone;

        if ($phone) {
            SendWhatsAppNotificationJob::dispatch($phone, $message)->afterResponse();
        }
    }
}
