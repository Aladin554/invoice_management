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
            'customer:id,first_name,last_name,email,phone,emergency_contact_number,emergency_contact_relationship,date_of_birth,preferred_study_country_primary,preferred_study_country_secondary,preferred_intake,academic_profile_ssc,academic_profile_hsc,academic_profile_bachelor,academic_profile_masters,has_study_gap,study_gap_details,study_gap_counsellor_approved,has_english_test_scores,english_test_plan,english_test_score_details,intended_level_of_study,interested_program,institution_preference,city_preference,max_tuition_budget_bdt,accompanying_member_status,accompanying_member_details,has_at_least_fifty_lacs_bank_statement,wants_connected_bank_loan_support,grades_below_seventy_percent,english_score_below_requirement,education_gap_exceeds_limit,counsellor_discussed_complex_profile,application_deadline_within_two_weeks,has_missing_academic_documents,missing_academic_documents_details,reviewed_no_refund_consent',
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
