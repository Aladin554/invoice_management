<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InvoicePreviewMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Invoice $invoice, public string $previewLink)
    {
    }

    public function build()
    {
        $receiptNumber = $this->invoice->invoice_number ?: ('INV-' . $this->invoice->id);

        return $this->subject('Draft Agreement For Review - Receipt #' . $receiptNumber)
            ->view('emails.invoice_preview')
            ->with([
                'invoice' => $this->invoice,
                'previewLink' => $this->previewLink,
            ]);
    }
}
