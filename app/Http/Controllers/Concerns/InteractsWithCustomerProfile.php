<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Validation\Rule;

trait InteractsWithCustomerProfile
{
    protected function customerProfileRules(): array
    {
        return [
            'academic_profile_ssc' => 'nullable|string|max:2000',
            'academic_profile_hsc' => 'nullable|string|max:2000',
            'academic_profile_bachelor' => 'nullable|string|max:2000',
            'academic_profile_masters' => 'nullable|string|max:2000',
            'study_gap' => 'nullable|string|max:255',
            'total_funds_for_applicant' => 'nullable|string|max:255',
            'total_funds_for_accompanying_members' => 'nullable|string|max:255',
            'moving_abroad_member_count' => 'nullable|integer|min:0|max:50',
            'available_documents' => 'nullable|array',
            'available_documents.*' => ['string', Rule::in($this->availableDocumentOptions())],
            'english_language_proficiencies' => 'nullable|array',
            'english_language_proficiencies.*' => ['string', Rule::in($this->englishLanguageProficiencyOptions())],
        ];
    }

    protected function customerProfilePayload(array $validated): array
    {
        $payload = [];

        foreach ($this->customerProfileTextFields() as $field) {
            if (array_key_exists($field, $validated)) {
                $payload[$field] = $this->normalizeNullableString($validated[$field]);
            }
        }

        if (array_key_exists('moving_abroad_member_count', $validated)) {
            $payload['moving_abroad_member_count'] = $validated['moving_abroad_member_count'] !== null
                ? (int) $validated['moving_abroad_member_count']
                : null;
        }

        if (array_key_exists('available_documents', $validated)) {
            $payload['available_documents'] = $this->normalizeStringArray($validated['available_documents']);
        }

        if (array_key_exists('english_language_proficiencies', $validated)) {
            $payload['english_language_proficiencies'] = $this->normalizeStringArray($validated['english_language_proficiencies']);
        }

        return $payload;
    }

    protected function availableDocumentOptions(): array
    {
        return [
            'ssc_or_o_level_transcript',
            'ssc_or_o_level_certificate',
            'hsc_or_a_level_transcript',
            'hsc_or_a_level_certificate',
            'bachelor_transcript',
            'bachelor_certificate',
            'masters_transcript',
            'masters_certificate',
            'passport',
            'recommendation_letter',
            'extracurricular_activities',
            'portfolio',
            'cv',
            'work_experience_certificates',
        ];
    }

    protected function englishLanguageProficiencyOptions(): array
    {
        return [
            'ielts',
            'sat',
            'pte',
            'toefl',
            'duolingo',
            'moi',
            'gre',
            'gmat',
        ];
    }

    private function customerProfileTextFields(): array
    {
        return [
            'academic_profile_ssc',
            'academic_profile_hsc',
            'academic_profile_bachelor',
            'academic_profile_masters',
            'study_gap',
            'total_funds_for_applicant',
            'total_funds_for_accompanying_members',
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

    private function normalizeStringArray(mixed $values): array
    {
        if (!is_array($values)) {
            return [];
        }

        $normalized = [];

        foreach ($values as $value) {
            if (!is_string($value)) {
                continue;
            }

            $trimmed = trim($value);
            if ($trimmed === '' || in_array($trimmed, $normalized, true)) {
                continue;
            }

            $normalized[] = $trimmed;
        }

        return $normalized;
    }
}
