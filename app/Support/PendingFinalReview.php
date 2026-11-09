<?php

namespace App\Support;

use App\Models\Invoice;
use Illuminate\Support\Collection;

/**
 * Finds invoices that are waiting on the Super Admin's Final Review — the
 * same set the "Final Review" tab shows (frontend/src/utils/invoiceWorkflow.ts
 * getInvoiceWorkflowStage() === "final_review"), so the reminder email and
 * the UI never disagree.
 */
class PendingFinalReview
{
    /**
     * @return Collection<int, Invoice>
     */
    public function invoices(): Collection
    {
        return Invoice::with([
            'customer:id,first_name,last_name',
            'branch:id,name',
            'cashManager:id,first_name,last_name',
            'duePayments:id,invoice_id,payment_method',
        ])
            ->where(fn ($q) => $q->whereNull('status')->orWhere('status', '!=', 'approved'))
            ->whereNull('super_admin_approved_at')
            ->orderBy('id')
            ->get()
            ->filter(fn (Invoice $invoice) => $this->isPending($invoice))
            ->values();
    }

    public function isPending(Invoice $invoice): bool
    {
        if (strtolower(trim((string) $invoice->status)) === 'approved' || $invoice->super_admin_approved_at) {
            return false;
        }

        // Any cash received → Cash Review first, then Final Review.
        if ($invoice->anyCashReceived()) {
            return (bool) $invoice->cash_manager_approved_at && !$invoice->final_review_approved_at;
        }

        // Non-cash: submitted and fully paid but not yet approved.
        return $invoice->hasStudentSubmitted() && $invoice->isFullyPaid();
    }
}
