<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employee_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('category_id')->constrained('expense_categories')->restrictOnDelete();

            $table->decimal('amount', 12, 2);
            $table->text('purpose');
            $table->date('expense_date');
            $table->string('payment_preference'); // cash | bank | bkash | nagad
            $table->string('receipt_path')->nullable();

            $table->string('status')->default('submitted');
            // submitted -> finance_approved -> owner_approved -> payment_pending -> paid
            //           -> finance_rejected
            //                                -> owner_rejected

            $table->timestamp('finance_reviewed_at')->nullable();
            $table->foreignId('finance_reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('finance_note')->nullable();

            $table->timestamp('owner_reviewed_at')->nullable();
            $table->foreignId('owner_reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('owner_note')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_requests');
    }
};
