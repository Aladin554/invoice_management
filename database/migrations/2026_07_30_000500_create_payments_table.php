<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('payment_request_id')->unique()->constrained('payment_requests')->cascadeOnDelete();

            $table->string('payment_method'); // cash | bank | bkash | nagad | cheque
            $table->string('transaction_ref')->nullable();
            $table->date('payment_date');
            $table->decimal('amount_paid', 12, 2);
            $table->string('receiver_name')->nullable();
            $table->text('notes')->nullable();
            $table->string('proof_path')->nullable();

            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
