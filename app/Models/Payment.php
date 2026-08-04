<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'payment_request_id',
        'payment_method',
        'transaction_ref',
        'payment_date',
        'amount_paid',
        'receiver_name',
        'notes',
        'proof_path',
        'recorded_by',
    ];

    protected $casts = [
        'payment_date' => 'date:Y-m-d',
        'amount_paid' => 'decimal:2',
    ];

    public function paymentRequest()
    {
        return $this->belongsTo(PaymentRequest::class);
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
