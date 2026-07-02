<?php

namespace App\Mail;

use App\Models\Invoice;
use App\Support\InvoicePdfRenderer;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InvoiceApprovedAdminNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public ?string $approvedPdfUrl;
    public ?string $receiptPdfUrl;

    public function __construct(public Invoice $invoice, public ?string $publicLink)
    {
        $this->invoice->load(['items', 'branch', 'customer', 'salesPerson', 'assistantSalesPerson']);
        $pdfRenderer = app(InvoicePdfRenderer::class);

        $this->approvedPdfUrl = $this->absoluteUrl($pdfRenderer->approvedPdfUrl($invoice));
        $this->receiptPdfUrl = $this->absoluteUrl($pdfRenderer->receiptPdfUrl($invoice));
    }

    public function build()
    {
        $receiptNumber = $this->invoice->display_invoice_number ?: ('Receipt-' . $this->invoice->id);

        return $this->subject('Invoice Approved - Receipt #' . $receiptNumber)
            ->view('emails.invoice_approved_admin')
            ->with([
                'invoice' => $this->invoice,
                'publicLink' => $this->publicLink,
                'approvedPdfUrl' => $this->approvedPdfUrl,
                'receiptPdfUrl' => $this->receiptPdfUrl,
            ]);
    }

    private function absoluteUrl(?string $path): ?string
    {
        if (!is_string($path) || trim($path) === '') {
            return null;
        }

        if (preg_match('/^https?:\/\//i', $path) === 1) {
            return $path;
        }

        return url($path);
    }
}
