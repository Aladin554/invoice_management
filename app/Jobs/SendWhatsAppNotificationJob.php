<?php

namespace App\Jobs;

use App\Services\WhatsAppService;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;

class SendWhatsAppNotificationJob
{
    use Dispatchable;
    use Queueable;
    use SerializesModels;

    public function __construct(public string $phone, public string $message)
    {
    }

    public function handle(WhatsAppService $whatsApp): void
    {
        $whatsApp->sendTextMessage($this->phone, $this->message);
    }
}
