<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            // Itemized breakdown for the request (e.g. Category: Food ->
            // [{name: "Apple", price: 50}, {name: "Banana", price: 30}]).
            // `amount` stays the source of truth for totals/reports — it's
            // always recomputed server-side as the sum of these prices.
            $table->json('items')->nullable()->after('amount');
        });
    }

    public function down(): void
    {
        Schema::table('payment_requests', function (Blueprint $table) {
            $table->dropColumn('items');
        });
    }
};
