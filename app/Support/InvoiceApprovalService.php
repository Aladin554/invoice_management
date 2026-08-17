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
 * Any invoice that ever received cash — the initial payment or a due
 * instalment — must clear Cash Review AND Final Review before it can be
 * approved, auto or otherwise; signing is not a prerequisite to enter that
 * chain. Once both are cleared and due == 0, submission auto-finalizes it
 * (whether the customer signs first or the review chain clears first).
 * Non-cash-only invoices keep the original rule: due == 0 + submitted →
 * Auto Approved. Any due > 0 always means the Due List, never approvable.
 */
class InvoiceApprovalService
{
    /**
     * Whether the invoice is eligible to skip the cash-review chain and be
     * approved automatically right now.
     */
    public function shouldAutoApprove(Invoice $invoice): bool
    {
        if (!$invoice->hasStudentSubmitted() || !$invoice->isFullyPaid()) {
            return false;
        }

        // Any invoice that ever received cash must clear the full Cash Review
        // → Final Review chain before it can be approved — auto or otherwise.
        // Once both are cleared, signing (or a later non-cash due settlement)
        // may finalize it automatically, same as a pure non-cash invoice.
        if ($invoice->anyCashReceived()) {
            return $invoice->cashReviewSatisfied() && $invoice->finalReviewSatisfied();
        }

        return true;
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
