<?php

namespace Database\Seeders;

use App\Models\Shifts;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            PlatformRolesSeeder::class,
            CategoriesSeeder::class,
            EmployeesAlertaMovilSeeder::class,
            EmployeesFiscaMotosSeeder::class,
            EmployeesAmzomaSeeder::class,
        ]);
    }
}
