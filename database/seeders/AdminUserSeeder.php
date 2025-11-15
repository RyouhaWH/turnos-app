<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'jorge.waltemath@amzoma.cl'],
            [
                'name' => 'Jorge Waltemath',
                'password' => Hash::make('1Q2w3e4r!*'),
            ]
        );
    }
}

