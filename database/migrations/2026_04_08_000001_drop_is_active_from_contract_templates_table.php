<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('contract_templates', 'is_active')) {
            return;
        }

        Schema::table('contract_templates', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('contract_templates', 'is_active')) {
            return;
        }

        Schema::table('contract_templates', function (Blueprint $table) {
            $table->boolean('is_active')->default(true);
        });
    }
};
