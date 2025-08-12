<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;


class PlatformRolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        Role::firstOrCreate(['name' => 'Administrador']);
        Role::firstOrCreate(['name' => 'Supervisor']);
        Role::firstOrCreate(['name' => 'Usuario']);

    }
}
