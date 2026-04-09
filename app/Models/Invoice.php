<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'invoice_date',
        'status',
        'branch_id',
        'customer_id',
        'sales_person_id',
        'assistant_sales_person_id',
        'contract_template_id',
        'payment_method',
        'payment_evidence_path',
        'discount_type',
        'discount_value',
        'subtotal',
        'total',
        'preview_sent_at',
        'public_token',
        'cash_manager_approved_at',
        'cash_manager_approved_by',
        'super_admin_approved_at',
        'super_admin_approved_by',
        'student_signed_at',
        'student_signature_name',
        'student_signature_ip',
        'student_signed_by_admin',
        'student_signed_by_user_id',
        'student_photo_path',
        'show_student_information',
        'show_no_refund_contract',
        'customer_profile_submitted_at',
        'edit_override_user_id',
        'locked_at',
    ];

    protected $casts = [
        'invoice_date' => 'date',
        'preview_sent_at' => 'datetime',
        'cash_manager_approved_at' => 'datetime',
        'super_admin_approved_at' => 'datetime',
        'student_signed_at' => 'datetime',
        'customer_profile_submitted_at' => 'datetime',
        'locked_at' => 'datetime',
        'student_signed_by_admin' => 'boolean',
        'show_student_information' => 'boolean',
        'show_no_refund_contract' => 'boolean',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function salesPerson()
    {
        return $this->belongsTo(SalesPerson::class);
    }

    public function assistantSalesPerson()
    {
        return $this->belongsTo(AssistantSalesPerson::class);
    }

    public function contractTemplate()
    {
        return $this->belongsTo(ContractTemplate::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function cashManager()
    {
        return $this->belongsTo(User::class, 'cash_manager_approved_by');
    }

    public function superAdmin()
    {
        return $this->belongsTo(User::class, 'super_admin_approved_by');
    }

    public function studentSignedBy()
    {
        return $this->belongsTo(User::class, 'student_signed_by_user_id');
    }

    public function editOverrideUser()
    {
        return $this->belongsTo(User::class, 'edit_override_user_id');
    }
}
