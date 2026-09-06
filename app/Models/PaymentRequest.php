<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentRequest extends Model
{
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_FINANCE_APPROVED = 'finance_approved';
    public const STATUS_FINANCE_REJECTED = 'finance_rejected';
    public const STATUS_OWNER_REJECTED = 'owner_rejected';
    public const STATUS_MONEY_PROVIDED = 'money_provided';
    public const STATUS_PAYMENT_REJECTED = 'payment_rejected';
    public const STATUS_PAID = 'paid';

    protected $fillable = [
        'employee_id',
        'branch_id',
        'category_id',
        'amount',
        'purpose',
        'expense_date',
        'payment_preference',
        'receipt_path',
        'status',
        'finance_reviewed_at',
        'finance_reviewed_by',
        'finance_note',
        'finance_batch_id',
        'money_provided_paths',
        'owner_reviewed_at',
        'owner_reviewed_by',
        'owner_note',
        'used_receipt_paths',
        'settled_at',
        'settled_by',
        'amount_used',
        'amount_returned',
        'settlement_note',
        'payment_rejected_at',
        'payment_rejected_by',
        'payment_note',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expense_date' => 'date:Y-m-d',
        'finance_reviewed_at' => 'datetime',
        'owner_reviewed_at' => 'datetime',
        'settled_at' => 'datetime',
        'amount_used' => 'decimal:2',
        'amount_returned' => 'decimal:2',
        'payment_rejected_at' => 'datetime',
        'money_provided_paths' => 'array',
        'used_receipt_paths' => 'array',
    ];

    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function category()
    {
        return $this->belongsTo(ExpenseCategory::class, 'category_id');
    }

    public function financeReviewer()
    {
        return $this->belongsTo(User::class, 'finance_reviewed_by');
    }

    public function ownerReviewer()
    {
        return $this->belongsTo(User::class, 'owner_reviewed_by');
    }

    public function settledBy()
    {
        return $this->belongsTo(User::class, 'settled_by');
    }

    public function paymentRejecter()
    {
        return $this->belongsTo(User::class, 'payment_rejected_by');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }
}
