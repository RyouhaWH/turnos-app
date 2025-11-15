<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            PlatformRolesSeeder::class,
            AssignColorsToRolesSeeder::class,
            UpdateRolesDashboardVisibilitySeeder::class,
            UpdateRolesOperationalStatusSeeder::class,
            EmployeesAlertaMovilSeeder::class,
            EmployeesFiscaMotosSeeder::class,
            EmployeesAmzomaSeeder::class,
            FuncionariosFiscalizacionSeeder::class,
            FuncionariosPatrullajeSeeder::class,
        ]);
    }
}
