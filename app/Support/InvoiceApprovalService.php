<?php

namespace App\Support;

use App\Jobs\SendInvoiceApprovedMailJob;
use App\Models\Invoice;
use Illuminate\Support\Str;

/**
 * Central place for the student payment & approval rules so the public form
 * flow, the admin sign flow, and the due-payment flow all behave identically.
 *
 * Core classification: ONLY `cash` is cash. bkash / nagad / pos /
 * bank_transfer are all non-cash and share the exact same behaviour.
 *
 * The method of the *settling* payment (the one that brings the due to 0, or
 * the invoice's own method when there was never a due) decides the path:
 *   - settling non-cash + due == 0 + submitted  → Auto Approved
 *   - settling cash     + due == 0              → Cash Review → Final Review
 *   - due > 0                                    → Due List (never approvable)
 */
class InvoiceApprovalService
{
    /**
     * Whether the invoice is eligible to skip the cash-review chain and be
     * approved automatically right now.
     */
    public function shouldAutoApprove(Invoice $invoice): bool
    {
        return $invoice->hasStudentSubmitted()
            && $invoice->isFullyPaid()
            && !$invoice->settlingPaymentIsCash()
            // Any cash received (initial or due) must be cash-reviewed first —
            // even when the final settling payment is non-cash.
            && $invoice->cashReviewSatisfied();
    }

    /**
     * Mark the invoice approved and send the final documents. Callers must have
     * already confirmed shouldAutoApprove(), or be performing a manual approval.
     */
    public function autoApprove(Invoice $invoice): void
    {
        if (!$invoice->public_token) {
            $invoice->public_token = Str::random(48);
        }

        $invoice->status = 'approved';
        $invoice->locked_at = now();
        $invoice->save();

        SendInvoiceApprovedMailJob::dispatch($invoice->id)->afterResponse();
    }

    /**
     * Apply the correct post-submission / post-payment state:
     *   - auto-approve when eligible;
     *   - otherwise leave it "signed" (Due List when due > 0, or Cash Review
     *     when a cash payment settled the balance).
     * Returns true when the invoice was auto-approved.
     */
    public function settleAfterPayment(Invoice $invoice): bool
    {
        if ($this->shouldAutoApprove($invoice)) {
            $this->autoApprove($invoice);

            return true;
        }

        // Not auto-approved: keep it out of the "approved" state. Only touch the
        // status when it hasn't already been approved (defensive).
        if ($invoice->status !== 'approved' && $invoice->hasStudentSubmitted()) {
            $invoice->status = 'signed';
            $invoice->save();
        }

        return false;
    }
}
