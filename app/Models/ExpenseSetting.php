<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExpenseSetting extends Model
{
    protected $table = 'expense_settings';

    protected $fillable = [
        'owner_approval_required',
        'updated_by',
    ];

    protected $casts = [
        'owner_approval_required' => 'boolean',
    ];

    public static function current(): self
    {
        return static::query()->orderByDesc('id')->first() ?? static::create(['owner_approval_required' => false]);
    }

    public static function ownerApprovalRequired(): bool
    {
        return static::current()->owner_approval_required;
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
