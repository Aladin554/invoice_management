<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique()->nullable();
            $table->date('invoice_date')->nullable();
            $table->string('status')->default('draft');

            $table->foreignId('branch_id')
                ->nullable()
                ->constrained('branches')
                ->nullOnDelete();
            $table->foreignId('customer_id')
                ->nullable()
                ->constrained('customers')
                ->nullOnDelete();
            $table->foreignId('sales_person_id')
                ->nullable()
                ->constrained('sales_people')
                ->nullOnDelete();
            $table->foreignId('assistant_sales_person_id')
                ->nullable()
                ->constrained('assistant_sales_people')
                ->nullOnDelete();

            $table->foreignId('contract_template_id')
                ->nullable()
                ->constrained('contract_templates')
                ->nullOnDelete();

            $table->string('payment_method')->nullable();
            $table->string('payment_evidence_path')->nullable();

            $table->string('discount_type')->nullable(); // amount | percent
            $table->decimal('discount_value', 12, 2)->default(0);
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);

            $table->timestamp('preview_sent_at')->nullable();
            $table->string('public_token')->unique()->nullable();

            $table->timestamp('cash_manager_approved_at')->nullable();
            $table->foreignId('cash_manager_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('super_admin_approved_at')->nullable();
            $table->foreignId('super_admin_approved_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamp('student_signed_at')->nullable();
            $table->string('student_signature_name')->nullable();
            $table->string('student_signature_ip')->nullable();
            $table->boolean('student_signed_by_admin')->default(false);
            $table->foreignId('student_signed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('student_photo_path')->nullable();

            $table->foreignId('edit_override_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('locked_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
