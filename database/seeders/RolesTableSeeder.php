<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesTableSeeder extends Seeder
{
    /**
     * Canonical role IDs relied on throughout the app (hardcoded role_id
     * checks in controllers, ProtectedRoute.tsx, etc). Seeding must be
     * idempotent and must always land on these exact IDs — re-running this
     * seeder (e.g. via migrate:fresh --seed) must never create duplicates
     * or shift IDs.
     */
    private const ROLES = [
        1 => 'superadmin',
        2 => 'admin',
        3 => 'subadmin',
        4 => 'employee',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::ROLES as $id => $name) {
            DB::table('roles')->updateOrInsert(
                ['id' => $id],
                ['name' => $name, 'guard_name' => null, 'updated_at' => now(), 'created_at' => now()]
            );
        }

        // Defensive cleanup: remove any stray/duplicate role rows outside the
        // canonical set (e.g. left over from a past non-idempotent seed run).
        DB::table('roles')->whereNotIn('id', array_keys(self::ROLES))->delete();
    }
}
