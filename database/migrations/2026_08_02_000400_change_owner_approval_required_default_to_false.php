<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Raw SQL (not ->change()) since doctrine/dbal isn't installed. The
        // `ALTER ... SET DEFAULT` syntax is MySQL-only, so skip it on other
        // drivers (e.g. sqlite used by the test suite).
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE expense_settings ALTER owner_approval_required SET DEFAULT 0');
        }

        // Approval Workflow now defaults to OFF (Finance Manager approval is
        // sufficient on its own unless Owner explicitly turns this back on).
        DB::table('expense_settings')->update(['owner_approval_required' => false]);
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE expense_settings ALTER owner_approval_required SET DEFAULT 1');
        }
        DB::table('expense_settings')->update(['owner_approval_required' => true]);
    }
};
