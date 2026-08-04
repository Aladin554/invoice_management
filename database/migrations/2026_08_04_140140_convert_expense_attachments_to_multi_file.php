<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            $table->json('money_provided_paths')->nullable()->after('money_provided_path');
            $table->json('used_receipt_paths')->nullable()->after('used_receipt_path');
        });

        // Carry forward existing single-file uploads as one-item arrays.
        DB::table('payment_requests')->whereNotNull('money_provided_path')->orderBy('id')->each(function ($row) {
            DB::table('payment_requests')->where('id', $row->id)->update([
                'money_provided_paths' => json_encode([$row->money_provided_path]),
            ]);
        });

        DB::table('payment_requests')->whereNotNull('used_receipt_path')->orderBy('id')->each(function ($row) {
            DB::table('payment_requests')->where('id', $row->id)->update([
                'used_receipt_paths' => json_encode([$row->used_receipt_path]),
            ]);
        });

        Schema::table('payment_requests', function (Blueprint $table) {
            $table->dropColumn(['money_provided_path', 'used_receipt_path']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            $table->string('money_provided_path')->nullable()->after('finance_note');
            $table->string('used_receipt_path')->nullable()->after('money_provided_path');
        });

        DB::table('payment_requests')->whereNotNull('money_provided_paths')->orderBy('id')->each(function ($row) {
            $paths = json_decode($row->money_provided_paths, true) ?: [];
            DB::table('payment_requests')->where('id', $row->id)->update([
                'money_provided_path' => $paths[0] ?? null,
            ]);
        });

        DB::table('payment_requests')->whereNotNull('used_receipt_paths')->orderBy('id')->each(function ($row) {
            $paths = json_decode($row->used_receipt_paths, true) ?: [];
            DB::table('payment_requests')->where('id', $row->id)->update([
                'used_receipt_path' => $paths[0] ?? null,
            ]);
        });

        Schema::table('payment_requests', function (Blueprint $table) {
            $table->dropColumn(['money_provided_paths', 'used_receipt_paths']);
        });
    }
};
