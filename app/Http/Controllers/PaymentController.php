<?php

namespace App\Http\Controllers;

use App\Models\PaymentRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PaymentController extends Controller
{
    /**
     * Finance Manager can still cancel a request after money has been
     * provided (e.g. money handed over by mistake). Actually settling the
     * request — attaching the used receipt — is the employee's own action,
     * via PaymentRequestController::settle().
     */
    public function store(Request $request, int $paymentRequestId): JsonResponse
    {
        $user = Auth::user();

        if ($user->isOwner() || !$user->isFinanceManager()) {
            return response()->json(['message' => 'Only Finance Manager can cancel a provided request'], 403);
        }

        $paymentRequest = PaymentRequest::with(['employee', 'category'])->findOrFail($paymentRequestId);

        if ($paymentRequest->status !== PaymentRequest::STATUS_MONEY_PROVIDED) {
            return response()->json(['message' => 'Request is not awaiting settlement'], 422);
        }

        $request->validate([
            'action' => 'required|in:reject',
            'note' => 'nullable|string',
        ]);

        $paymentRequest->update([
            'status' => PaymentRequest::STATUS_PAYMENT_REJECTED,
            'payment_rejected_at' => now(),
            'payment_rejected_by' => $user->id,
            'payment_note' => $request->input('note'),
        ]);

        return response()->json([
            'message' => 'Request cancelled',
            'payment_request' => $paymentRequest->fresh([
                'employee:id,first_name,last_name,email',
                'category:id,name',
            ]),
        ]);
    }
}
