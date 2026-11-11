<?php

namespace App\Support;

use App\Models\Invoice;
use Illuminate\Support\Collection;

/**
 * Finds invoices waiting on a Cash Review or the Super Admin's Final Review —
 * the same sets the "Cash Review" and "Final Review" tabs show
 * (frontend/src/utils/invoiceWorkflow.ts getInvoiceWorkflowStage()), so the
 * reminder email and the UI never disagree.
 */
class PendingReviews
{
    public const CASH_REVIEW = 'cash_review';
    public const FINAL_REVIEW = 'final_review';

    /**
     * @return array{cash_review: Collection<int, Invoice>, final_review: Collection<int, Invoice>}
     */
    public function grouped(): array
    {
        $invoices = Invoice::with([
            'customer:id,first_name,last_name',
            'branch:id,name',
            'cashManager:id,first_name,last_name',
            'duePayments:id,invoice_id,payment_method',
        ])
            ->where(fn ($q) => $q->whereNull('status')->orWhere('status', '!=', 'approved'))
            ->whereNull('super_admin_approved_at')
            ->orderBy('id')
            ->get();

        return [
            self::CASH_REVIEW => $invoices->filter(fn (Invoice $i) => $this->stage($i) === self::CASH_REVIEW)->values(),
            self::FINAL_REVIEW => $invoices->filter(fn (Invoice $i) => $this->stage($i) === self::FINAL_REVIEW)->values(),
        ];
    }

    /**
     * The review the invoice is waiting on, or null when it isn't waiting on one.
     */
    public function stage(Invoice $invoice): ?string
    {
        if (strtolower(trim((string) $invoice->status)) === 'approved' || $invoice->super_admin_approved_at) {
            return null;
        }

        // Any cash received → Cash Review first, then Final Review.
        if ($invoice->anyCashReceived()) {
            if (!$invoice->cash_manager_approved_at) {
                return self::CASH_REVIEW;
            }

            return $invoice->final_review_approved_at ? null : self::FINAL_REVIEW;
        }

        // Non-cash: submitted and fully paid but not yet approved.
        return $invoice->hasStudentSubmitted() && $invoice->isFullyPaid() ? self::FINAL_REVIEW : null;
    }
}
