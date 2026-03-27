<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->text('academic_profile_ssc')->nullable()->after('phone');
            $table->text('academic_profile_hsc')->nullable()->after('academic_profile_ssc');
            $table->text('academic_profile_bachelor')->nullable()->after('academic_profile_hsc');
            $table->text('academic_profile_masters')->nullable()->after('academic_profile_bachelor');
            $table->string('study_gap')->nullable()->after('academic_profile_masters');
            $table->string('total_funds_for_applicant')->nullable()->after('study_gap');
            $table->string('total_funds_for_accompanying_members')->nullable()->after('total_funds_for_applicant');
            $table->unsignedInteger('moving_abroad_member_count')->nullable()->after('total_funds_for_accompanying_members');
            $table->json('available_documents')->nullable()->after('moving_abroad_member_count');
            $table->json('english_language_proficiencies')->nullable()->after('available_documents');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn([
                'academic_profile_ssc',
                'academic_profile_hsc',
                'academic_profile_bachelor',
                'academic_profile_masters',
                'study_gap',
                'total_funds_for_applicant',
                'total_funds_for_accompanying_members',
                'moving_abroad_member_count',
                'available_documents',
                'english_language_proficiencies',
            ]);
        });
    }
};
