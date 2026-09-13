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
        Schema::create('banks', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // Seed the previously hardcoded bank list so the table is a
        // drop-in replacement for the frontend's static BANK_OPTIONS array.
        $now = now();
        $banks = [
            'AB Bank', 'Agrani Bank', 'Al-Arafah Islami Bank', 'Bank Asia', 'BRAC Bank',
            'City Bank', 'Dutch-Bangla Bank', 'Eastern Bank', 'EXIM Bank', 'IFIC Bank',
            'Islami Bank Bangladesh', 'Jamuna Bank', 'Janata Bank', 'Mercantile Bank',
            'Midland Bank', 'Mutual Trust Bank', 'National Bank', 'NCC Bank', 'One Bank',
            'Prime Bank', 'Pubali Bank', 'Rupali Bank', 'Shahjalal Islami Bank',
            'Social Islami Bank', 'Sonali Bank', 'Southeast Bank', 'Standard Bank',
            'Standard Chartered Bank', 'Trust Bank', 'United Commercial Bank', 'Uttara Bank',
        ];

        DB::table('banks')->insert(array_map(fn (string $name) => [
            'name' => $name,
            'created_at' => $now,
            'updated_at' => $now,
        ], $banks));

        // Backfill any custom bank name already saved on an invoice or due
        // payment (typed before this table existed) so it's not lost.
        $existingCustomNames = collect()
            ->merge(DB::table('invoices')->whereNotNull('bank_name')->distinct()->pluck('bank_name'))
            ->merge(DB::table('due_payments')->whereNotNull('bank_name')->distinct()->pluck('bank_name'))
            ->map(fn ($name) => trim((string) $name))
            ->filter()
            ->unique()
            ->values();

        if ($existingCustomNames->isNotEmpty()) {
            DB::table('banks')->insertOrIgnore(
                $existingCustomNames->map(fn (string $name) => [
                    'name' => $name,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])->all()
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banks');
    }
};
