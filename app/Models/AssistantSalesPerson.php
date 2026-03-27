<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AssistantSalesPerson extends Model
{
    use HasFactory;

    protected $table = 'assistant_sales_people';

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
    ];
}
