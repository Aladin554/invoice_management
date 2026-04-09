<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->string('emergency_contact_number')->nullable()->after('phone');
            $table->string('emergency_contact_relationship')->nullable()->after('emergency_contact_number');
            $table->date('date_of_birth')->nullable()->after('emergency_contact_relationship');
            $table->string('preferred_study_country_primary')->nullable()->after('date_of_birth');
            $table->string('preferred_study_country_secondary')->nullable()->after('preferred_study_country_primary');
            $table->string('preferred_intake')->nullable()->after('preferred_study_country_secondary');
            $table->string('has_study_gap')->nullable()->after('academic_profile_masters');
            $table->text('study_gap_details')->nullable()->after('has_study_gap');
            $table->string('study_gap_counsellor_approved')->nullable()->after('study_gap_details');
            $table->string('has_english_test_scores')->nullable()->after('study_gap_counsellor_approved');
            $table->text('english_test_plan')->nullable()->after('has_english_test_scores');
            $table->text('english_test_score_details')->nullable()->after('english_test_plan');
            $table->string('intended_level_of_study')->nullable()->after('english_test_score_details');
            $table->text('interested_program')->nullable()->after('intended_level_of_study');
            $table->string('institution_preference')->nullable()->after('interested_program');
            $table->string('city_preference')->nullable()->after('institution_preference');
            $table->string('max_tuition_budget_bdt')->nullable()->after('city_preference');
            $table->string('accompanying_member_status')->nullable()->after('max_tuition_budget_bdt');
            $table->text('accompanying_member_details')->nullable()->after('accompanying_member_status');
            $table->string('has_at_least_fifty_lacs_bank_statement')->nullable()->after('accompanying_member_details');
            $table->string('wants_connected_bank_loan_support')->nullable()->after('has_at_least_fifty_lacs_bank_statement');
            $table->string('grades_below_seventy_percent')->nullable()->after('wants_connected_bank_loan_support');
            $table->string('english_score_below_requirement')->nullable()->after('grades_below_seventy_percent');
            $table->string('education_gap_exceeds_limit')->nullable()->after('english_score_below_requirement');
            $table->string('counsellor_discussed_complex_profile')->nullable()->after('education_gap_exceeds_limit');
            $table->string('application_deadline_within_two_weeks')->nullable()->after('counsellor_discussed_complex_profile');
            $table->string('has_missing_academic_documents')->nullable()->after('application_deadline_within_two_weeks');
            $table->text('missing_academic_documents_details')->nullable()->after('has_missing_academic_documents');
            $table->string('reviewed_no_refund_consent')->nullable()->after('missing_academic_documents_details');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'emergency_contact_number',
                'emergency_contact_relationship',
                'date_of_birth',
                'preferred_study_country_primary',
                'preferred_study_country_secondary',
                'preferred_intake',
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
            ]);
        });
    }
};
