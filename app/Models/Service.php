<?php

namespace App\Models;

use App\Models\ContractTemplate;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'receipt_description',
        'price',
    ];

    public function contractTemplates()
    {
        return $this->belongsToMany(ContractTemplate::class, 'contract_template_service');
    }
}
