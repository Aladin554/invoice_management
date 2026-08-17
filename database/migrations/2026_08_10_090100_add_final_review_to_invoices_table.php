<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Set when the Super Admin approves Final Review (independent of the
            // resulting decision — due list, not-signed, or approved). Cash
            // invoices can now clear Final Review before the customer signs, so
            // this is the signal that distinguishes "Final Review still pending"
            // from "Final Review already cleared, only sign/due state matters".
            $table->timestamp('final_review_approved_at')->nullable()->after('cash_manager_approved_by');
            $table->foreignId('final_review_approved_by')->nullable()->after('final_review_approved_at')
                ->constrained('users')->nullOnDelete();
        });

        // Backfill: invoices currently sitting in the Due list that already had
        // a Super Admin "Approve while due remains" click under the old
        // workflow already completed Final Review in spirit for their CURRENT
        // due instalment. Copy that timestamp over so they don't reappear in
        // the Final Review tab after deploy.
        //
        // Restricted to due_amount > 0: due_acknowledged_at is never cleared by
        // a due payment, so if the due has since been paid down to 0 (possibly
        // through another cash instalment that already reset
        // cash_manager_approved_at and got re-reviewed), that timestamp is
        // stale and must NOT be trusted as evidence Final Review happened for
        // the current state — that invoice should correctly reappear in Final
        // Review for a fresh Super Admin click.
        DB::table('invoices')
            ->whereNotNull('cash_manager_approved_at')
            ->whereNotNull('due_acknowledged_at')
            ->whereNull('final_review_approved_at')
            ->where('due_amount', '>', 0)
            ->update([
                'final_review_approved_at' => DB::raw('due_acknowledged_at'),
                'final_review_approved_by' => DB::raw('due_acknowledged_by'),
            ]);
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('final_review_approved_by');
            $table->dropColumn('final_review_approved_at');
        });
    }
};
