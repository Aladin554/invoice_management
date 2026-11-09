<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

/**
 * Reminder to a Super Admin that one or more invoices are waiting on their
 * Final Review. Sent twice a day (see routes/console.php) while any remain.
 */
class FinalReviewPendingMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Collection $invoices, public string $panelUrl)
    {
    }

    public function build()
    {
        $count = $this->invoices->count();

        return $this->subject("Action needed: {$count} invoice" . ($count === 1 ? '' : 's') . ' waiting for your Final Review')
            ->view('emails.final_review_pending')
            ->with([
                'invoices' => $this->invoices,
                'panelUrl' => $this->panelUrl,
            ]);
    }
}
