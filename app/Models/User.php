<?php

namespace App\Models;

use App\Notifications\CustomResetPassword;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Sanctum\NewAccessToken;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'password',
        'role_id',
        'branch_id',
        'report_status',
        'report_notification',
        'last_login_at',
        'can_create_users',
        'allowed_ips',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $appends = [
        'panel_permission',
    ];

    protected $casts = [
        'last_login_at' => 'datetime',
        'account_expires_at' => 'datetime',
        'email_verified_at' => 'datetime',
        'role_id' => 'integer',
        'can_create_users' => 'integer',
        'branch_id' => 'integer',
        'permission' => 'integer',
        'report_notification' => 'integer',
        'allowed_ips' => 'array',
    ];

    public function getPanelPermissionAttribute(): int
    {
        if ((int) ($this->attributes['role_id'] ?? 0) === 3) {
            return 1;
        }

        if (array_key_exists('panel_permission', $this->attributes)) {
            return (int) $this->attributes['panel_permission'];
        }

        return (int) ($this->attributes['permission'] ?? 0);
    }

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function createToken(string $name = 'auth_token', array $abilities = ['*']): NewAccessToken
    {
        $plainTextToken = Str::random(40);

        $token = $this->tokens()->create([
            'name' => $name,
            'token' => hash('sha256', $plainTextToken),
            'abilities' => $abilities,
        ]);

        return new NewAccessToken($token, $token->id . '|' . $plainTextToken);
    }

    public function sendPasswordResetNotification($token)
    {
        $this->notify(new CustomResetPassword($token));
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
