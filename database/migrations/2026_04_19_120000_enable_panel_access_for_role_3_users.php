<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'panel_permission')) {
            DB::table('users')
                ->where('role_id', 3)
                ->update([
                    'panel_permission' => 1,
                    'updated_at' => now(),
                ]);
        }

        if (Schema::hasColumn('users', 'permission')) {
            DB::table('users')
                ->where('role_id', 3)
                ->update([
                    'permission' => 1,
                    'updated_at' => now(),
                ]);
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'panel_permission')) {
            DB::table('users')
                ->where('role_id', 3)
                ->update([
                    'panel_permission' => 0,
                    'updated_at' => now(),
                ]);
        }

        if (Schema::hasColumn('users', 'permission')) {
            DB::table('users')
                ->where('role_id', 3)
                ->update([
                    'permission' => 0,
                    'updated_at' => now(),
                ]);
        }
    }
};
