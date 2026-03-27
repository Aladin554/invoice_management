<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class InvoiceApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public ?string $contractUrl;
    public ?string $studentPhotoUrl;

    public function __construct(public Invoice $invoice, public ?string $publicLink)
    {
        $this->contractUrl = $invoice->contractTemplate?->file_path
            ? Storage::disk('public')->url($invoice->contractTemplate->file_path)
            : null;
        $this->studentPhotoUrl = $invoice->student_photo_path
            ? Storage::disk('public')->url($invoice->student_photo_path)
            : null;
    }

    public function build()
    {
        return $this->subject('Invoice Approved')
            ->view('emails.invoice_approved')
            ->with([
                'invoice' => $this->invoice,
                'publicLink' => $this->publicLink,
                'contractUrl' => $this->contractUrl,
                'studentPhotoUrl' => $this->studentPhotoUrl,
            ]);
    }
}
