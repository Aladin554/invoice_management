<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DuePayment extends Model
{
    protected $fillable = [
        'invoice_id',
        'amount',
        'payment_method',
        'proof_path',
        'note',
        'recorded_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
