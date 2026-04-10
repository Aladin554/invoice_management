<?php

namespace App\Support;

use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\CarbonInterface;

class InvoicePdfRenderer
{
    public function renderAgreement(Invoice $invoice): string
    {
        return Pdf::loadView('pdf.invoice_approved', $this->viewData($invoice))
            ->setPaper('a4')
            ->output();
    }

    public function renderApprovedInvoice(Invoice $invoice): string
    {
        return $this->renderAgreement($invoice);
    }

    public function fileName(Invoice $invoice): string
    {
        $baseName = $invoice->invoice_number ?: 'invoice-' . $invoice->id;
        $safeBaseName = preg_replace('/[^A-Za-z0-9\-_]+/', '-', $baseName) ?: 'invoice';

        return trim($safeBaseName, '-') . '.pdf';
    }

    public function contractDownloadUrl(Invoice $invoice): ?string
    {
        if (!$invoice->public_token || !$this->hasAgreementData($invoice)) {
            return null;
        }

        return url('/api/invoices/public/' . $invoice->public_token . '/contract-pdf');
    }

    public function approvedPdfUrl(Invoice $invoice): ?string
    {
        if (!$invoice->public_token || $invoice->status !== 'approved') {
            return null;
        }

        return url('/api/invoices/public/' . $invoice->public_token . '/approved-pdf');
    }

    public function viewData(Invoice $invoice): array
    {
        $invoice->load([
            'items',
            'branch',
            'customer',
            'contractTemplate.service',
            'contractTemplate.services',
        ]);

        $serviceSection = $this->serviceSectionData($invoice);
        $profileAgreement = $this->profileAgreementData($invoice);

        return [
            'invoice' => $invoice,
            'headerText' => config('invoice.header_text'),
            'footerText' => config('invoice.footer_text'),
            'discountAmount' => $this->discountAmount($invoice),
            'documentLabels' => $this->documentLabels(),
            'englishLabels' => $this->englishLabels(),
            'contractHeading' => $serviceSection['contract_heading'],
            'contractDescription' => $serviceSection['contract_description'],
            'primaryServiceName' => $serviceSection['primary_service_name'],
            'primaryServiceAmount' => $serviceSection['primary_service_amount'],
            'hasPrimaryService' => $serviceSection['has_primary_service'],
            'selectedServiceRows' => $serviceSection['selected_service_rows'],
            'additionalServiceRows' => $serviceSection['additional_service_rows'],
            'hasProfileAgreementSection' => $profileAgreement['has_profile_agreement_section'],
            'profileAgreementRows' => $profileAgreement['profile_agreement_rows'],
        ];
    }

    private function discountAmount(Invoice $invoice): float
    {
        $subtotal = (float) $invoice->subtotal;
        $discountValue = (float) $invoice->discount_value;

        if ($invoice->discount_type === 'percent') {
            return round($subtotal * $discountValue / 100, 2);
        }

        return round($discountValue, 2);
    }

    private function serviceSectionData(Invoice $invoice): array
    {
        $template = $invoice->contractTemplate;
        $invoiceItems = $invoice->items->values();

        $normalizeServiceName = static function ($value): string {
            $value = preg_replace('/\s+/', ' ', trim((string) $value));

            return mb_strtolower($value ?? '');
        };

        $findMatchingInvoiceItem = static function ($service) use ($invoiceItems, $normalizeServiceName) {
            if (!$service) {
                return null;
            }

            $serviceId = $service->id ?? null;
            $serviceName = $normalizeServiceName($service->name ?? '');

            return $invoiceItems->first(function ($item) use ($serviceId, $serviceName, $normalizeServiceName) {
                if ($serviceId && (int) ($item->service_id ?? 0) === (int) $serviceId) {
                    return true;
                }

                return $serviceName !== '' && $normalizeServiceName($item->name ?? '') === $serviceName;
            });
        };

        $formatAmount = static function ($amount): string {
            $amount = (float) $amount;
            $decimals = abs($amount - floor($amount)) < 0.00001 ? 0 : 2;

            return 'BDT ' . number_format($amount, $decimals) . '/-';
        };

        $templateServices = collect([$template?->service])
            ->merge(collect($template?->services ?? []))
            ->filter()
            ->unique(function ($service) use ($normalizeServiceName) {
                $serviceId = $service->id ?? null;

                if ($serviceId) {
                    return 'id:' . $serviceId;
                }

                return 'name:' . $normalizeServiceName($service->name ?? '');
            })
            ->values();

        $selectedServiceRows = $invoiceItems
            ->map(function ($item) use ($formatAmount) {
                $name = trim((string) ($item->name ?? ''));
                if ($name === '') {
                    return null;
                }

                return [
                    'name' => $name,
                    'amount' => $formatAmount($item->line_total ?? $item->price ?? 0),
                ];
            })
            ->filter()
            ->values();

        if ($selectedServiceRows->isEmpty() && $templateServices->isNotEmpty()) {
            $fallbackService = $templateServices->first();

            $selectedServiceRows = collect([[
                'name' => trim((string) ($fallbackService->name ?? 'Selected service package')),
                'amount' => $formatAmount($fallbackService->price ?? 0),
            ]]);
        }

        $primarySelectedService = $selectedServiceRows->first();

        $additionalServiceRows = $templateServices
            ->reject(fn ($service) => (bool) $findMatchingInvoiceItem($service))
            ->map(function ($service) use ($formatAmount) {
                return [
                    'name' => $service->name,
                    'amount' => $formatAmount($service->price ?? 0),
                ];
            })
            ->values()
            ->all();

        return [
            'contract_heading' => $template?->name
                ?: ($primarySelectedService['name'] ?? ($templateServices->first()?->name ?: 'Selected Service Package')),
            'contract_description' => trim((string) ($template?->description ?? '')),
            'primary_service_name' => $primarySelectedService['name'] ?? 'Primary service package not recorded',
            'primary_service_amount' => $primarySelectedService['amount']
                ?? $formatAmount($templateServices->first()?->price ?? 0),
            'has_primary_service' => $primarySelectedService !== null,
            'selected_service_rows' => $selectedServiceRows->all(),
            'additional_service_rows' => $additionalServiceRows,
        ];
    }

    private function hasAgreementData(Invoice $invoice): bool
    {
        $invoice->loadMissing('items');

        return (bool) $invoice->contract_template_id || $invoice->items->isNotEmpty();
    }

    private function profileAgreementData(Invoice $invoice): array
    {
        $customer = $invoice->customer;
        if (!$customer) {
            return [
                'has_profile_agreement_section' => false,
                'profile_agreement_rows' => [],
            ];
        }

        $contentRows = [];
        $appendRow = function (array &$rows, string $question, ?string $answer): void {
            if ($answer === null) {
                return;
            }

            $rows[] = [
                'question' => $question,
                'answer' => $answer,
            ];
        };

        $appendRow($contentRows, 'Emergency Contact Number', $this->stringAnswer($customer->emergency_contact_number));
        $appendRow($contentRows, 'Relationship with Emergency Contact', $this->stringAnswer($customer->emergency_contact_relationship));
        $appendRow($contentRows, 'Date of Birth', $this->dateAnswer($customer->date_of_birth));
        $appendRow(
            $contentRows,
            'Preferred Country to Study: First Priority',
            $this->optionAnswer($customer->preferred_study_country_primary, $this->studyCountryOptions())
        );
        $appendRow(
            $contentRows,
            'Preferred Country to Study: Second Priority',
            $this->optionAnswer($customer->preferred_study_country_secondary, $this->studyCountryOptions())
        );
        $appendRow(
            $contentRows,
            'Preferred Intake',
            $this->optionAnswer($customer->preferred_intake, $this->preferredIntakeOptions())
        );
        $appendRow($contentRows, 'SSC or O Level', $this->stringAnswer($customer->academic_profile_ssc));
        $appendRow($contentRows, 'HSC or A Level', $this->stringAnswer($customer->academic_profile_hsc));
        $appendRow($contentRows, 'Bachelor', $this->stringAnswer($customer->academic_profile_bachelor));
        $appendRow($contentRows, 'Masters', $this->stringAnswer($customer->academic_profile_masters));
        $appendRow($contentRows, 'Study Gap', $this->stringAnswer($customer->study_gap));
        $appendRow($contentRows, 'Total Funds Being Shown for Applicant', $this->stringAnswer($customer->total_funds_for_applicant));
        $appendRow(
            $contentRows,
            'Total Funds Being Shown for Accompanying Members',
            $this->stringAnswer($customer->total_funds_for_accompanying_members)
        );
        $appendRow(
            $contentRows,
            'Number of Members Who Will Be Moving Abroad',
            $this->numericAnswer($customer->moving_abroad_member_count)
        );
        $appendRow(
            $contentRows,
            'Documents Student Can Provide',
            $this->mappedListAnswer($customer->available_documents, $this->documentLabels())
        );
        $appendRow(
            $contentRows,
            'English Language Proficiency',
            $this->mappedListAnswer($customer->english_language_proficiencies, $this->englishLabels())
        );
        $appendRow(
            $contentRows,
            'Do you have any study gaps?',
            $this->optionAnswer($customer->has_study_gap, $this->yesNoOptions())
        );
        $appendRow($contentRows, 'Please provide gap explanation details', $this->stringAnswer($customer->study_gap_details));
        $appendRow(
            $contentRows,
            'Did our counsellor approve your study gap?',
            $this->optionAnswer($customer->study_gap_counsellor_approved, $this->yesNoOptions())
        );
        $appendRow(
            $contentRows,
            'Do you have IELTS/PTE/TOEFL/Duolingo/MOI Score?',
            $this->optionAnswer($customer->has_english_test_scores, $this->yesNoOptions())
        );
        $appendRow($contentRows, 'If not, when do you plan to write your exam?', $this->stringAnswer($customer->english_test_plan));
        $appendRow(
            $contentRows,
            "If you have your test results, what's your score?",
            $this->stringAnswer($customer->english_test_score_details)
        );
        $appendRow(
            $contentRows,
            'Intended Level of Study',
            $this->optionAnswer($customer->intended_level_of_study, $this->levelOfStudyOptions())
        );
        $appendRow($contentRows, 'Interested Program Of Study', $this->stringAnswer($customer->interested_program));
        $appendRow($contentRows, 'Institution Preference', $this->stringAnswer($customer->institution_preference));
        $appendRow($contentRows, 'City Preference', $this->stringAnswer($customer->city_preference));
        $appendRow(
            $contentRows,
            'Maximum Budget for Tuition Fees Per Year in BDT',
            $this->stringAnswer($customer->max_tuition_budget_bdt)
        );
        $appendRow(
            $contentRows,
            'Will your spouse or children accompany you?',
            $this->optionAnswer($customer->accompanying_member_status, $this->yesNoNotApplicableOptions())
        );
        $appendRow($contentRows, 'Who will accompany you?', $this->stringAnswer($customer->accompanying_member_details));
        $appendRow(
            $contentRows,
            'Do you have at least 50 lacs to show in Bank Statement for the past 6 months?',
            $this->optionAnswer($customer->has_at_least_fifty_lacs_bank_statement, $this->yesNoOptions())
        );
        $appendRow(
            $contentRows,
            'If no, are you willing to take Bank Loan Support From Connected?',
            $this->optionAnswer($customer->wants_connected_bank_loan_support, $this->yesNoOptions())
        );
        $appendRow(
            $contentRows,
            'Are your grades below 70% grading scale?',
            $this->optionAnswer($customer->grades_below_seventy_percent, $this->yesNoOptions())
        );
        $appendRow(
            $contentRows,
            'Is your IELTS or equivalent score below the usual requirement?',
            $this->optionAnswer($customer->english_score_below_requirement, $this->yesNoOptions())
        );
        $appendRow(
            $contentRows,
            'Is your education gap beyond the usual limit?',
            $this->optionAnswer($customer->education_gap_exceeds_limit, $this->yesNoOptions())
        );
        $appendRow(
            $contentRows,
            'Did our counsellor mention that your profile may have limited institution and program options?',
            $this->optionAnswer($customer->counsellor_discussed_complex_profile, $this->yesNoNotApplicableOptions())
        );
        $appendRow(
            $contentRows,
            'Is your admission application deadline within 2 weeks from today?',
            $this->optionAnswer($customer->application_deadline_within_two_weeks, $this->yesNoOptions())
        );
        $appendRow(
            $contentRows,
            'Are there any academic documents which you will not be able to provide?',
            $this->optionAnswer($customer->has_missing_academic_documents, $this->yesNoOptions())
        );
        $appendRow(
            $contentRows,
            'If yes, please share details of which documents you will not be able to provide',
            $this->stringAnswer($customer->missing_academic_documents_details)
        );
        $appendRow(
            $contentRows,
            'If you have a complex profile, did our counsellor review the No Refund Consent Form with you?',
            $this->optionAnswer($customer->reviewed_no_refund_consent, $this->noRefundConsentOptions())
        );

        $hasProfileAgreementSection = !empty($contentRows);

        if (!$hasProfileAgreementSection) {
            return [
                'has_profile_agreement_section' => false,
                'profile_agreement_rows' => [],
            ];
        }

        $rows = [];
        $appendRow($rows, 'Student Phone Number', $this->stringAnswer($customer->phone));
        $appendRow($rows, 'Student Email', $this->stringAnswer($customer->email));

        foreach ($contentRows as $row) {
            $rows[] = $row;
        }

        if ($invoice->student_signed_at || $invoice->customer_profile_submitted_at) {
            $rows[] = [
                'question' => 'Did you carefully read our terms and conditions contract carefully?',
                'answer' => 'Yes',
            ];
        }

        return [
            'has_profile_agreement_section' => true,
            'profile_agreement_rows' => $rows,
        ];
    }

    private function documentLabels(): array
    {
        return [
            'ssc_or_o_level_transcript' => 'SSC or O Level transcript',
            'ssc_or_o_level_certificate' => 'SSC or O Level certificate',
            'hsc_or_a_level_transcript' => 'HSC or A Level transcript',
            'hsc_or_a_level_certificate' => 'HSC or A Level certificate',
            'bachelor_transcript' => 'Bachelor transcript',
            'bachelor_certificate' => 'Bachelor certificate',
            'masters_transcript' => 'Masters transcript',
            'masters_certificate' => 'Masters certificate',
            'passport' => 'Passport',
            'recommendation_letter' => 'Recommendation letter',
            'extracurricular_activities' => 'Extracurricular activities',
            'portfolio' => 'Portfolio',
            'cv' => 'CV',
            'work_experience_certificates' => 'Work Experience Certificates',
        ];
    }

    private function yesNoOptions(): array
    {
        return [
            'yes' => 'Yes',
            'no' => 'No',
        ];
    }

    private function yesNoNotApplicableOptions(): array
    {
        return [
            'yes' => 'Yes',
            'no' => 'No',
            'not_applicable' => 'Not Applicable',
        ];
    }

    private function studyCountryOptions(): array
    {
        return [
            'canada' => 'Canada',
            'australia' => 'Australia',
            'united_kingdom' => 'United Kingdom',
            'united_states' => 'United States',
            'ireland' => 'Ireland',
            'new_zealand' => 'New Zealand',
            'germany' => 'Germany',
            'sweden' => 'Sweden',
            'finland' => 'Finland',
            'denmark' => 'Denmark',
            'france' => 'France',
            'malta' => 'Malta',
            'malaysia' => 'Malaysia',
            'united_arab_emirates' => 'United Arab Emirates',
        ];
    }

    private function preferredIntakeOptions(): array
    {
        return [
            'january' => 'January',
            'may' => 'May',
            'september' => 'September',
            'flexible' => 'Flexible',
        ];
    }

    private function levelOfStudyOptions(): array
    {
        return [
            'foundation' => 'Foundation',
            'bachelor' => 'Bachelor',
            'masters' => 'Masters',
        ];
    }

    private function noRefundConsentOptions(): array
    {
        return [
            'yes' => 'Yes',
            'not_applicable' => 'Not Applicable',
        ];
    }

    private function englishLabels(): array
    {
        return [
            'ielts' => 'IELTS',
            'sat' => 'SAT',
            'pte' => 'PTE',
            'toefl' => 'TOEFL',
            'duolingo' => 'Duolingo',
            'moi' => 'MOI',
            'gre' => 'GRE',
            'gmat' => 'GMAT',
        ];
    }

    private function stringAnswer(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = trim((string) $value);

        return $text !== '' ? $text : null;
    }

    private function numericAnswer(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }

    private function optionAnswer(mixed $value, array $options): ?string
    {
        $text = $this->stringAnswer($value);
        if ($text === null) {
            return null;
        }

        return $options[$text] ?? $text;
    }

    private function mappedListAnswer(mixed $values, array $labels): ?string
    {
        if (!is_array($values)) {
            return null;
        }

        $mapped = collect($values)
            ->filter(fn ($value) => $value !== null && trim((string) $value) !== '')
            ->map(function ($value) use ($labels) {
                $value = trim((string) $value);

                return $labels[$value] ?? $value;
            })
            ->values()
            ->all();

        if (empty($mapped)) {
            return null;
        }

        return implode(', ', $mapped);
    }

    private function dateAnswer(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if ($value instanceof CarbonInterface) {
            return $value->format('M j, Y');
        }

        $text = trim((string) $value);
        if ($text === '') {
            return null;
        }

        try {
            return \Carbon\Carbon::parse($text)->format('M j, Y');
        } catch (\Throwable) {
            return $text;
        }
    }
}
