<?php

namespace App\Services;

use App\Models\WhatsAppSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppService
{
    public function isConfigured(): bool
    {
        $settings = WhatsAppSetting::current();

        return (bool) ($settings?->is_enabled && $settings->phone_number_id && $settings->access_token);
    }

    /**
     * Send a plain text WhatsApp message. Fails silently (logs only) so
     * notification delivery never breaks the calling business action.
     */
    public function sendTextMessage(string $to, string $message): bool
    {
        $settings = WhatsAppSetting::current();

        if (!$settings || !$settings->is_enabled || !$settings->phone_number_id || !$settings->access_token) {
            Log::info('WhatsApp notification skipped: not configured or disabled.');
            return false;
        }

        $recipient = $this->normalizePhone($to);
        if (!$recipient) {
            Log::warning('WhatsApp notification skipped: invalid phone number.', ['to' => $to]);
            return false;
        }

        $apiVersion = config('services.whatsapp.api_version', 'v21.0');

        try {
            $response = Http::withToken($settings->access_token)
                ->timeout(15)
                ->post("https://graph.facebook.com/{$apiVersion}/{$settings->phone_number_id}/messages", [
                    'messaging_product' => 'whatsapp',
                    'to' => $recipient,
                    'type' => 'text',
                    'text' => ['body' => $message],
                ]);

            if ($response->failed()) {
                Log::error('WhatsApp message send failed.', [
                    'to' => $recipient,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::error('WhatsApp message send exception: ' . $e->getMessage());
            return false;
        }
    }

    private function normalizePhone(string $phone): ?string
    {
        $digits = preg_replace('/\D+/', '', $phone);

        return $digits !== '' ? $digits : null;
    }
}
