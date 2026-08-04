<?php

namespace App\Http\Controllers;

use App\Models\WhatsAppSetting;
use App\Services\WhatsAppService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class WhatsAppSettingsController extends Controller
{
    private function isOwner(): bool
    {
        return (int) Auth::user()->role_id === 1;
    }

    public function show(): JsonResponse
    {
        if (!$this->isOwner()) {
            return response()->json(['message' => 'Only Owner can view WhatsApp settings'], 403);
        }

        $settings = WhatsAppSetting::current();

        return response()->json([
            'phone_number_id' => $settings->phone_number_id ?? null,
            'business_account_id' => $settings->business_account_id ?? null,
            'owner_phone' => $settings->owner_phone ?? null,
            'is_enabled' => (bool) ($settings->is_enabled ?? false),
            'access_token_set' => (bool) ($settings->access_token ?? false),
            'access_token_preview' => $settings?->access_token
                ? '••••••••' . Str::substr($settings->access_token, -4)
                : null,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        if (!$this->isOwner()) {
            return response()->json(['message' => 'Only Owner can update WhatsApp settings'], 403);
        }

        $request->validate([
            'phone_number_id' => 'required|string|max:255',
            'access_token' => 'nullable|string',
            'business_account_id' => 'nullable|string|max:255',
            'owner_phone' => 'nullable|string|max:20',
            'is_enabled' => 'sometimes|boolean',
        ]);

        $settings = WhatsAppSetting::current() ?? new WhatsAppSetting();

        $settings->phone_number_id = $request->phone_number_id;
        $settings->business_account_id = $request->input('business_account_id');
        $settings->owner_phone = $request->input('owner_phone');
        $settings->is_enabled = $request->boolean('is_enabled');
        $settings->updated_by = Auth::id();

        if ($request->filled('access_token')) {
            $settings->access_token = $request->input('access_token');
        }

        $settings->save();

        return response()->json(['message' => 'WhatsApp settings saved successfully']);
    }

    public function test(Request $request, WhatsAppService $whatsApp): JsonResponse
    {
        if (!$this->isOwner()) {
            return response()->json(['message' => 'Only Owner can send a test message'], 403);
        }

        $request->validate([
            'phone' => 'required|string|max:20',
        ]);

        if (!$whatsApp->isConfigured()) {
            return response()->json(['message' => 'WhatsApp is not configured or is disabled'], 422);
        }

        $sent = $whatsApp->sendTextMessage(
            $request->phone,
            'This is a test message from your Expense & Payment Control System.'
        );

        if (!$sent) {
            return response()->json(['message' => 'Failed to send test message. Check credentials and logs.'], 422);
        }

        return response()->json(['message' => 'Test message sent successfully']);
    }
}
