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
        return $this->subject('Invoice Preview')
            ->view('emails.invoice_preview')
            ->with([
                'invoice' => $this->invoice,
                'previewLink' => $this->previewLink,
            ]);
    }
}
