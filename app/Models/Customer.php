<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
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
        'study_gap',
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
        'total_funds_for_applicant',
        'total_funds_for_accompanying_members',
        'moving_abroad_member_count',
        'available_documents',
        'english_language_proficiencies',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
        'moving_abroad_member_count' => 'integer',
        'available_documents' => 'array',
        'english_language_proficiencies' => 'array',
    ];
}
