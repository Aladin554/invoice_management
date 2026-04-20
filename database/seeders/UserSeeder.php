<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'email' => 'superadmin@gmail.com',
                'password' => Hash::make('12345678'),
                'role_id' => 1,
                'permission' => 0,
                'report_notification' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'first_name' => 'Admin',
                'last_name' => 'User',
                'email' => 'admin@gmail.com',
                'password' => Hash::make('12345678'),
                'role_id' => 2,
                'permission' => 0,
                'report_notification' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'first_name' => 'SubAdmin',
                'last_name' => 'User',
                'email' => 'subadmin@gmail.com',
                'password' => Hash::make('12345678'),
                'role_id' => 3,
                'permission' => 1,
                'report_notification' => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('users')->upsert(
            $users,
            ['email'],
            ['first_name', 'last_name', 'password', 'role_id', 'permission', 'report_notification', 'updated_at']
        );
    }
}
