<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->where('role_id', 5)
            ->update(['role_id' => 4, 'updated_at' => now()]);

        DB::table('roles')->where('id', 5)->delete();

        DB::table('roles')->updateOrInsert(
            ['id' => 4],
            ['name' => 'employee', 'guard_name' => null, 'created_at' => now(), 'updated_at' => now()]
        );
    }

    public function down(): void
    {
        DB::table('users')
            ->where('role_id', 4)
            ->update(['role_id' => 5, 'updated_at' => now()]);

        DB::table('roles')->where('id', 4)->delete();

        DB::table('roles')->updateOrInsert(
            ['id' => 5],
            ['name' => 'employee', 'guard_name' => null, 'created_at' => now(), 'updated_at' => now()]
        );
    }
};
