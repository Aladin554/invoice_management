<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;

/**
 * Reminder to a Super Admin that invoices are waiting on a Cash Review and/or
 * their Final Review. Sent twice a day (see routes/console.php) while any remain.
 */
class PendingReviewsMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Collection $cashReview,
        public Collection $finalReview,
        public string $panelUrl,
    ) {
    }

    public function build()
    {
        $parts = [];
        if ($this->cashReview->isNotEmpty()) {
            $parts[] = 'Cash Review: ' . $this->cashReview->count();
        }
        if ($this->finalReview->isNotEmpty()) {
            $parts[] = 'Final Review: ' . $this->finalReview->count();
        }

        $total = $this->cashReview->count() + $this->finalReview->count();

        return $this->subject("Action needed: {$total} invoice" . ($total === 1 ? '' : 's')
                . ' waiting for your approval (' . implode(', ', $parts) . ')')
            ->view('emails.pending_reviews')
            ->with([
                'cashReview' => $this->cashReview,
                'finalReview' => $this->finalReview,
                'panelUrl' => $this->panelUrl,
            ]);
    }
}
