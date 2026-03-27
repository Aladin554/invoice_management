<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn(['address_line1', 'address_line2', 'phone']);
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->string('address_line1')->nullable()->after('name');
            $table->string('address_line2')->nullable()->after('address_line1');
            $table->string('phone')->nullable()->after('address_line2');
        });
    }
};
