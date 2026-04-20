<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Validation\Rule;

trait InteractsWithCustomerProfile
{
    protected function customerProfileRules(bool $includeContact = false, ?int $ignoreCustomerId = null): array
    {
        $rules = [
            'emergency_contact_number' => 'nullable|string|max:100',
            'emergency_contact_relationship' => 'nullable|string|max:255',
            'date_of_birth' => 'nullable|date',
            'preferred_study_country_primary' => 'nullable|string|max:255',
            'preferred_study_country_secondary' => 'nullable|string|max:255|different:preferred_study_country_primary',
            'preferred_intake' => 'nullable|string|max:255',
            'academic_profile_ssc' => 'nullable|string|max:2000',
            'academic_profile_hsc' => 'nullable|string|max:2000',
            'academic_profile_bachelor' => 'nullable|string|max:2000',
            'academic_profile_masters' => 'nullable|string|max:2000',
            'has_study_gap' => ['nullable', 'string', Rule::in($this->yesNoOptions())],
            'study_gap_details' => 'nullable|string|max:3000',
            'study_gap_counsellor_approved' => ['nullable', 'string', Rule::in($this->yesNoOptions())],
            'has_english_test_scores' => ['nullable', 'string', Rule::in($this->yesNoOptions())],
            'english_test_plan' => 'nullable|string|max:1000',
            'english_test_score_details' => 'nullable|string|max:1000',
            'intended_level_of_study' => ['nullable', 'string', Rule::in($this->levelOfStudyOptions())],
            'interested_program' => 'nullable|string|max:1000',
            'institution_preference' => 'nullable|string|max:255',
            'city_preference' => 'nullable|string|max:255',
            'max_tuition_budget_bdt' => 'nullable|string|max:255',
            'accompanying_member_status' => ['nullable', 'string', Rule::in($this->yesNoNotApplicableOptions())],
            'accompanying_member_details' => 'nullable|string|max:1000',
            'has_at_least_fifty_lacs_bank_statement' => ['nullable', 'string', Rule::in($this->yesNoConfusedOptions())],
            'wants_connected_bank_loan_support' => ['nullable', 'string', Rule::in($this->yesNoOptions())],
            'grades_below_seventy_percent' => ['nullable', 'string', Rule::in($this->yesNoOptions())],
            'english_score_below_requirement' => ['nullable', 'string', Rule::in($this->yesNoOptions())],
            'education_gap_exceeds_limit' => ['nullable', 'string', Rule::in($this->yesNoOptions())],
            'counsellor_discussed_complex_profile' => ['nullable', 'string', Rule::in($this->yesNoNotApplicableOptions())],
            'application_deadline_within_two_weeks' => ['nullable', 'string', Rule::in($this->yesNoOptions())],
            'has_missing_academic_documents' => ['nullable', 'string', Rule::in($this->yesNoOptions())],
            'missing_academic_documents_details' => 'nullable|string|max:3000',
            'reviewed_no_refund_consent' => ['nullable', 'string', Rule::in(['yes', 'not_applicable'])],
        ];

        if ($includeContact) {
            $rules = array_merge([
                'phone' => ['required', 'string', 'max:50', 'not_regex:/^\s*$/'],
                'email' => [
                    'required',
                    'email',
                    'max:255',
                    Rule::unique('customers', 'email')->ignore($ignoreCustomerId),
                ],
            ], $rules);
        }

        return $rules;
    }

    protected function customerProfilePayload(array $validated): array
    {
        $payload = [];

        foreach ($this->customerProfileFields() as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = $this->normalizeNullableString($validated[$field]);
            }
        }

        foreach (['phone', 'email'] as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = $this->normalizeRequiredString($validated[$field]);
            }
        }

        return $payload;
    }

    protected function yesNoOptions(): array
    {
        return [
            'yes',
            'no',
        ];
    }

    protected function yesNoNotApplicableOptions(): array
    {
        return [
            'yes',
            'no',
            'not_applicable',
        ];
    }

    protected function yesNoConfusedOptions(): array
    {
        return [
            'yes',
            'no',
            'confused',
        ];
    }

    protected function levelOfStudyOptions(): array
    {
        return [
            'foundation',
            'bachelor',
            'masters',
        ];
    }

    private function customerProfileFields(): array
    {
        return [
            'emergency_contact_number',
            'emergency_contact_relationship',
            'date_of_birth',
            'preferred_study_country_primary',
            'preferred_study_country_secondary',
            'preferred_intake',
            'academic_profile_ssc',
            'academic_profile_hsc',
            'academic_profile_bachelor',
            'academic_profile_masters',
            'has_study_gap',
            'study_gap_details',
            'study_gap_counsellor_approved',
            'has_english_test_scores',
            'english_test_plan',
            'english_test_score_details',
            'intended_level_of_study',
            'interested_program',
            'institution_preference',
            'city_preference',
            'max_tuition_budget_bdt',
            'accompanying_member_status',
            'accompanying_member_details',
            'has_at_least_fifty_lacs_bank_statement',
            'wants_connected_bank_loan_support',
            'grades_below_seventy_percent',
            'english_score_below_requirement',
            'education_gap_exceeds_limit',
            'counsellor_discussed_complex_profile',
            'application_deadline_within_two_weeks',
            'has_missing_academic_documents',
            'missing_academic_documents_details',
            'reviewed_no_refund_consent',
        ];
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if (!is_string($value)) {
            return null;
        }

        $normalized = trim($value);

        return $normalized !== '' ? $normalized : null;
    }

    private function normalizeRequiredString(mixed $value): string
    {
        return is_string($value) ? trim($value) : '';
    }
}
