<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('invoice_items', 'quantity')) {
            return;
        }

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->dropColumn('quantity');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('invoice_items', 'quantity')) {
            return;
        }

        Schema::table('invoice_items', function (Blueprint $table) {
            $table->integer('quantity')->default(1);
        });
    }
};
