<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            // Groups requests that were reviewed together in one bulk
            // finance-review action, so the UI can flag that a shared proof
            // file covers a combined amount across several requests.
            $table->string('finance_batch_id')->nullable()->after('finance_note');
            $table->index('finance_batch_id');
        });
    }

    public function down(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            $table->dropIndex(['finance_batch_id']);
            $table->dropColumn('finance_batch_id');
        });
    }
};
