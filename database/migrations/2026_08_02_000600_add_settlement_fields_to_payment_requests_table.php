<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            // Proof that Finance Manager physically handed the money over,
            // attached at the moment Finance approves the request.
            $table->string('money_provided_path')->nullable()->after('finance_note');

            // Employee's own proof of how the money was actually spent,
            // attached later when they settle the request.
            $table->string('used_receipt_path')->nullable()->after('money_provided_path');
            $table->timestamp('settled_at')->nullable()->after('used_receipt_path');
            $table->foreignId('settled_by')->nullable()->constrained('users')->nullOnDelete()->after('settled_at');
            $table->decimal('amount_used', 12, 2)->nullable()->after('settled_by');
            $table->decimal('amount_returned', 12, 2)->nullable()->after('amount_used');
            $table->text('settlement_note')->nullable()->after('amount_returned');
        });
    }

    public function down(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('settled_by');
            $table->dropColumn([
                'money_provided_path',
                'used_receipt_path',
                'settled_at',
                'amount_used',
                'amount_returned',
                'settlement_note',
            ]);
        });
    }
};
