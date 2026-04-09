<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->boolean('show_student_information')
                ->default(true)
                ->after('student_photo_path');
            $table->boolean('show_no_refund_contract')
                ->default(false)
                ->after('show_student_information');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn([
                'show_student_information',
                'show_no_refund_contract',
            ]);
        });
    }
};
