<?php

namespace App\Mail;

use App\Models\Invoice;
use App\Support\InvoicePdfRenderer;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class InvoiceApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public ?string $contractUrl;
    public ?string $approvedPdfUrl;
    public ?string $receiptPdfUrl;
    public ?string $noRefundContractUrl;
    public ?string $studentPhotoUrl;

    public function __construct(public Invoice $invoice, public ?string $publicLink)
    {
        $this->invoice->load(['items', 'branch', 'customer', 'contractTemplate.service', 'contractTemplate.services']);
        $pdfRenderer = app(InvoicePdfRenderer::class);

        $this->contractUrl = $this->absoluteUrl($pdfRenderer->contractDownloadUrl($invoice));
        $this->approvedPdfUrl = $this->absoluteUrl($pdfRenderer->approvedPdfUrl($invoice));
        $this->receiptPdfUrl = $this->absoluteUrl($pdfRenderer->receiptPdfUrl($invoice));
        $this->noRefundContractUrl = $invoice->show_no_refund_contract && $invoice->public_token
            ? $this->absoluteUrl('/api/invoices/public/' . rawurlencode($invoice->public_token) . '/no-refund-contract-pdf')
            : null;
        $this->studentPhotoUrl = $invoice->student_photo_path
            ? Storage::disk('public')->url($invoice->student_photo_path)
            : null;
    }

    public function build()
    {
        $pdfRenderer = app(InvoicePdfRenderer::class);
        $receiptNumber = $this->invoice->display_invoice_number ?: ('Receipt-' . $this->invoice->id);

        return $this->subject('Connected Education Agreement - Receipt #' . $receiptNumber)
            ->view('emails.invoice_approved')
            ->with([
                'invoice' => $this->invoice,
                'publicLink' => $this->publicLink,
                'contractUrl' => $this->contractUrl,
                'approvedPdfUrl' => $this->approvedPdfUrl,
                'receiptPdfUrl' => $this->receiptPdfUrl,
                'noRefundContractUrl' => $this->noRefundContractUrl,
                'studentPhotoUrl' => $this->studentPhotoUrl,
            ])
            ->attachData(
                $pdfRenderer->renderAgreement($this->invoice),
                $pdfRenderer->fileName($this->invoice),
                ['mime' => 'application/pdf']
            );
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
