<?php

namespace App\Http\Controllers;

use App\Mail\NewUserCredentialsMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

class UserController extends Controller
{
    private function authUser(): User
    {
        return Auth::user();
    }

    private function baseRelations(): array
    {
        return ['role', 'branch:id,name'];
    }

    private function isAdmin(): bool
    {
        return $this->authUser()->role->name === 'admin';
    }

    private function isSuperAdmin(): bool
    {
        return $this->authUser()->role->name === 'superadmin';
    }

    private function canCreateUsers(): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        if ($this->isAdmin()) {
            return (int) ($this->authUser()->can_create_users ?? 0) === 1;
        }

        return false;
    }

    private function canManage(User $user): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        if ($this->isAdmin() && in_array((int) $user->role_id, [3, 4], true)) {
            return true;
        }

        return false;
    }

    private function filterUsersForAuth()
    {
        $authUser = $this->authUser();
        $authRoleId = (int) ($authUser->role_id ?? 0);

        $query = User::with($this->baseRelations());

        if ($this->isSuperAdmin()) {
            return $query;
        }

        if ($this->isAdmin()) {
            return $query->where(function ($builder) use ($authUser) {
                $builder->whereIn('role_id', [3, 4])
                    ->orWhere('users.id', $authUser->id);
            });
        }

        if ($authRoleId === 3) {
            return $query->whereIn('role_id', [3, 4]);
        }

        if ($authRoleId === 4) {
            return $query->whereKey($authUser->id);
        }

        return $query->whereRaw('0 = 1');
    }

    private function validationRules(bool $isUpdate = false, int $userId = 0): array
    {
        return [
            'first_name' => $isUpdate ? 'sometimes|string|max:255' : 'required|string|max:255',
            'last_name' => $isUpdate ? 'sometimes|string|max:255' : 'required|string|max:255',
            'email' => $isUpdate
                ? 'sometimes|email|unique:users,email,' . $userId
                : 'required|email|unique:users,email',
            'password' => $isUpdate ? 'sometimes|min:6' : 'required|min:6',
            'role_id' => $isUpdate ? 'sometimes|exists:roles,id' : 'required|exists:roles,id',
            'branch_id' => $isUpdate ? 'sometimes|nullable|exists:branches,id' : 'nullable|exists:branches,id',
            'allowed_ips' => $isUpdate ? 'sometimes|array' : 'nullable|array',
            'allowed_ips.*' => 'nullable|ip',
        ];
    }

    private function sanitizeAllowedIps($value): array
    {
        if (!is_array($value)) {
            return [];
        }

        return array_values(array_unique(array_filter(array_map(static function ($ip) {
            return trim((string) $ip);
        }, $value))));
    }

    public function index(): JsonResponse
    {
        $users = $this->filterUsersForAuth()
            ->get()
            ->map(function (User $user) {
                $payload = $user->toArray();
                $payload['can_create_users'] = (int) ($user->can_create_users ?? 0);
                $payload['panel_permission'] = (int) ($user->panel_permission ?? 0);

                return $payload;
            });

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        if (!$this->canCreateUsers()) {
            return response()->json(['message' => 'Add user permission is inactive'], 403);
        }

        if (!$this->isSuperAdmin() && $request->has('allowed_ips')) {
            return response()->json(['message' => 'Only superadmin can assign IP allowlist'], 403);
        }

        $request->validate($this->validationRules());

        if ($this->isAdmin() && !in_array((int) $request->role_id, [3, 4], true)) {
            return response()->json(['message' => 'Admins can only create roles 3 and 4 users'], 403);
        }

        try {
            $plainPassword = (string) $request->password;

            $user = User::create([
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'role_id' => $request->role_id,
                'branch_id' => $this->isSuperAdmin()
                    ? $request->input('branch_id')
                    : $this->authUser()->branch_id,
                'password' => Hash::make($plainPassword),
                'allowed_ips' => $this->isSuperAdmin()
                    ? $this->sanitizeAllowedIps($request->input('allowed_ips', []))
                    : [],
            ]);

            $token = app('auth.password.broker')->createToken($user);
            $resetUrl = env('FRONTEND_URL') . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);

            Mail::to($user->email)->send(new NewUserCredentialsMail($user, $plainPassword, $resetUrl));

            return response()->json([
                'message' => 'User created & email sent successfully',
                'user' => $user->load($this->baseRelations()),
            ], 201);
        } catch (\Exception $e) {
            Log::error('User creation failed: ' . $e->getMessage());

            return response()->json(['message' => 'Server Error', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        $user = User::with($this->baseRelations())->find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        if ((int) $user->id !== (int) $this->authUser()->id && !$this->canManage($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($user);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $isSelf = (int) $user->id === (int) $this->authUser()->id;

        if (!$isSelf && !$this->canManage($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if (!$this->isSuperAdmin() && $request->has('allowed_ips')) {
            return response()->json(['message' => 'Only superadmin can assign IP allowlist'], 403);
        }

        if ($isSelf && !$this->isSuperAdmin() && $request->has('role_id') && (int) $request->role_id !== (int) $user->role_id) {
            return response()->json(['message' => 'You cannot change your own role'], 403);
        }

        $request->validate($this->validationRules(true, $id));

        if (!$isSelf && $request->role_id && $this->isAdmin() && !in_array((int) $request->role_id, [3, 4], true)) {
            return response()->json(['message' => 'Admins can only assign roles 3 and 4'], 403);
        }

        $user->fill([
            'first_name' => $request->first_name ?? $user->first_name,
            'last_name' => $request->last_name ?? $user->last_name,
            'email' => $request->email ?? $user->email,
            'role_id' => (!$isSelf && $request->has('role_id')) ? (int) $request->role_id : $user->role_id,
        ]);

        if ($this->isSuperAdmin() && $request->has('branch_id')) {
            $user->branch_id = $request->input('branch_id');
        }

        if ($request->password) {
            $user->password = Hash::make($request->password);
        }

        if ($this->isSuperAdmin() && $request->has('allowed_ips')) {
            $user->allowed_ips = $this->sanitizeAllowedIps($request->input('allowed_ips', []));
        }

        try {
            $user->save();

            return response()->json([
                'message' => 'User updated successfully',
                'user' => $user->load($this->baseRelations()),
            ]);
        } catch (\Exception $e) {
            Log::error('User update failed: ' . $e->getMessage());

            return response()->json(['message' => 'Server Error', 'error' => $e->getMessage()], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        if ((int) $user->id === (int) $this->authUser()->id) {
            return response()->json(['message' => 'You cannot delete your own account'], 403);
        }

        if (!$this->canManage($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        try {
            $user->delete();

            return response()->json(['message' => 'User deleted successfully']);
        } catch (\Exception $e) {
            Log::error('User deletion failed: ' . $e->getMessage());

            return response()->json(['message' => 'Server Error', 'error' => $e->getMessage()], 500);
        }
    }

    public function me(): JsonResponse
    {
        $user = $this->authUser();
        $panelPermission = $user->panel_permission ?? $user->permission ?? 0;

        return response()->json([
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'role_id' => (int) $user->role_id,
            'branch_id' => $user->branch_id,
            'branch' => $user->branch ? [
                'id' => $user->branch->id,
                'name' => $user->branch->name,
            ] : null,
            'can_create_users' => (int) ($user->can_create_users ?? 0),
            'panel_permission' => (int) $panelPermission,
            'report_status' => (int) ($user->report_status ?? 0),
            'report_notification' => (int) ($user->report_notification ?? 0),
            'max_cards' => $user->max_cards ?? null,
            'data_range' => $user->data_range ?? null,
            'video_status' => $user->video_status ?? null,
            'last_login_at' => $user->last_login_at?->toDateTimeString(),
            'account_expires_at' => $user->account_expires_at?->toDateTimeString(),
        ]);
    }

    public function showProfile(): JsonResponse
    {
        return response()->json($this->authUser()->load($this->baseRelations()));
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $this->authUser();

        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'password' => 'nullable|string|min:6',
        ]);

        $user->fill([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'email' => $request->email,
        ]);

        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->load($this->baseRelations()),
        ]);
    }

    public function togglePermission(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        if ((int) $user->id === (int) $this->authUser()->id) {
            return response()->json(['message' => 'You cannot change your own permissions'], 403);
        }

        if (!$this->canManage($user)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $field = $request->input('field', 'can_create_users');
        if (!in_array($field, ['can_create_users', 'panel_permission'], true)) {
            return response()->json(['message' => 'Invalid permission field'], 400);
        }

        $dbField = $field;
        if ($field === 'panel_permission') {
            $dbField = Schema::hasColumn('users', 'panel_permission') ? 'panel_permission' : 'permission';
        }

        $user->$dbField = $user->$dbField ? 0 : 1;
        $user->save();

        return response()->json([
            'message' => 'Permission updated',
            'can_create_users' => (int) ($user->can_create_users ?? 0),
            'panel_permission' => (int) ($user->panel_permission ?? 0),
        ]);
    }
}
