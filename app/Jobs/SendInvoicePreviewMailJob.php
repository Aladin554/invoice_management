<?php

namespace App\Jobs;

use App\Mail\InvoicePreviewMail;
use App\Models\Invoice;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendInvoicePreviewMailJob
{
    use Dispatchable;
    use Queueable;
    use SerializesModels;

    public function __construct(public int $invoiceId)
    {
    }

    public function handle(): void
    {
        $invoice = Invoice::with([
            'items:id,invoice_id,service_id,name,price,line_total',
            'branch:id,name',
            'customer:id,first_name,last_name,email,phone',
            'contractTemplate:id,name,file_path',
        ])->find($this->invoiceId);

        if (!$invoice) {
            return;
        }

        $customer = $invoice->customer;
        if (!$customer || empty($customer->email) || !$invoice->public_token) {
            return;
        }

        $publicLink = rtrim((string) config('invoice.frontend_url'), '/') . '/invoice/' . $invoice->public_token;

        Mail::to($customer->email)->send(new InvoicePreviewMail($invoice, $publicLink));
    }
}
