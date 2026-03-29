<?php

namespace App\Jobs;

use App\Mail\InvoiceApprovedMail;
use App\Models\Invoice;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendInvoiceApprovedMailJob
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
            'customer:id,first_name,last_name,email,phone,academic_profile_ssc,academic_profile_hsc,academic_profile_bachelor,academic_profile_masters,study_gap,total_funds_for_applicant,total_funds_for_accompanying_members,moving_abroad_member_count,available_documents,english_language_proficiencies',
            'contractTemplate:id,name,file_path,description',
        ])->find($this->invoiceId);

        if (!$invoice) {
            return;
        }

        $customer = $invoice->customer;
        if (!$customer || empty($customer->email)) {
            return;
        }

        $publicLink = $invoice->public_token
            ? rtrim((string) config('invoice.frontend_url'), '/') . '/invoice/' . $invoice->public_token
            : null;

        Mail::to($customer->email)->send(new InvoiceApprovedMail($invoice, $publicLink));
    }
}
