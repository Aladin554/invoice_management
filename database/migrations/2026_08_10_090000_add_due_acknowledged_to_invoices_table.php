<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            // Set when the Super Admin clicks Approve at Final Review while a due
            // still remains: it is NOT an approval — it records that the Super
            // Admin confirmed the money received so far and sends the
            // application to the Due List to wait for the remaining balance.
            $table->timestamp('due_acknowledged_at')->nullable()->after('due_amount');
            $table->foreignId('due_acknowledged_by')->nullable()->after('due_acknowledged_at')
                ->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropConstrainedForeignId('due_acknowledged_by');
            $table->dropColumn('due_acknowledged_at');
        });
    }
};
