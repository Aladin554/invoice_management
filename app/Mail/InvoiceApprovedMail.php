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
        $this->invoice->loadMissing(['items', 'branch', 'customer', 'contractTemplate']);

        $this->contractUrl = $invoice->contractTemplate?->file_path
            ? Storage::disk('public')->url($invoice->contractTemplate->file_path)
            : null;
        $this->approvedPdfUrl = $invoice->public_token
            ? url('/api/invoices/public/' . $invoice->public_token . '/approved-pdf')
            : null;
        $this->studentPhotoUrl = $invoice->student_photo_path
            ? Storage::disk('public')->url($invoice->student_photo_path)
            : null;
    }

    public function build()
    {
        $pdfRenderer = app(InvoicePdfRenderer::class);

        return $this->subject('Invoice Approved')
            ->view('emails.invoice_approved')
            ->with([
                'invoice' => $this->invoice,
                'publicLink' => $this->publicLink,
                'contractUrl' => $this->contractUrl,
                'approvedPdfUrl' => $this->approvedPdfUrl,
                'studentPhotoUrl' => $this->studentPhotoUrl,
            ])
            ->attachData(
                $pdfRenderer->renderApprovedInvoice($this->invoice),
                $pdfRenderer->fileName($this->invoice),
                ['mime' => 'application/pdf']
            );
    }
}
