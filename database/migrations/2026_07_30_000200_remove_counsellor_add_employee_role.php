<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Counsellor (role_id 4) was referenced in code but never actually
        // seeded/usable. Reassign any such users to subadmin before removing it.
        DB::table('users')
            ->where('role_id', 4)
            ->update(['role_id' => 3, 'updated_at' => now()]);

        DB::table('roles')->where('id', 4)->delete();

        DB::table('roles')->updateOrInsert(
            ['id' => 5],
            ['name' => 'employee', 'guard_name' => null, 'created_at' => now(), 'updated_at' => now()]
        );
    }

    public function down(): void
    {
        DB::table('roles')->where('id', 5)->delete();

        DB::table('roles')->updateOrInsert(
            ['id' => 4],
            ['name' => 'counsellor', 'guard_name' => null, 'created_at' => now(), 'updated_at' => now()]
        );
    }
};
