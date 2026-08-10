<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('due_payments', function (Blueprint $table) {
            // cash / bkash / nagad / pos / bank_transfer — the method used to
            // pay this due instalment (can differ from the invoice's method).
            $table->string('payment_method')->default('cash')->after('amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('due_payments', function (Blueprint $table) {
            $table->dropColumn('payment_method');
        });
    }
};
