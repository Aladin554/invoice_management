<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            $table->timestamp('payment_rejected_at')->nullable()->after('owner_note');
            $table->foreignId('payment_rejected_by')->nullable()->constrained('users')->nullOnDelete()->after('payment_rejected_at');
            $table->text('payment_note')->nullable()->after('payment_rejected_by');
        });
    }

    public function down(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            $table->dropConstrainedForeignId('payment_rejected_by');
            $table->dropColumn(['payment_rejected_at', 'payment_note']);
        });
    }
};
