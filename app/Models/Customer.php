<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'phone',
        'academic_profile_ssc',
        'academic_profile_hsc',
        'academic_profile_bachelor',
        'academic_profile_masters',
        'study_gap',
        'total_funds_for_applicant',
        'total_funds_for_accompanying_members',
        'moving_abroad_member_count',
        'available_documents',
        'english_language_proficiencies',
    ];

    protected $casts = [
        'moving_abroad_member_count' => 'integer',
        'available_documents' => 'array',
        'english_language_proficiencies' => 'array',
    ];
}
