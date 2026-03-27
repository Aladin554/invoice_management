<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesPerson extends Model
{
    use HasFactory;

    protected $table = 'sales_people';

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
    ];
}
