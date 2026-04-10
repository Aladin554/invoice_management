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
    public ?string $studentPhotoUrl;

    public function __construct(public Invoice $invoice, public ?string $publicLink)
    {
        $this->invoice->loadMissing(['items', 'branch', 'customer', 'contractTemplate.service', 'contractTemplate.services']);
        $pdfRenderer = app(InvoicePdfRenderer::class);

        $this->contractUrl = $pdfRenderer->contractDownloadUrl($invoice);
        $this->approvedPdfUrl = $pdfRenderer->approvedPdfUrl($invoice);
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
                'studentPhotoUrl' => $this->studentPhotoUrl,
            ])
            ->attachData(
                $pdfRenderer->renderAgreement($this->invoice),
                $pdfRenderer->fileName($this->invoice),
                ['mime' => 'application/pdf']
            );
    }
}
