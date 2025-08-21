<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Rol;

class UpdateRolesDashboardVisibilitySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Roles que deben mostrarse en el dashboard por defecto
        $dashboardRoles = [
            'Alerta Móvil',
            'Fiscalización',
            'Motorizado',
            'Dron',
            'Ciclopatrullaje',
            'Coordinador Despacho'
        ];

        // Roles que NO deben mostrarse en el dashboard por defecto
        $nonDashboardRoles = [
            'Administrativo',
            'Personal de Servicio'
        ];

        // Actualizar roles que deben mostrarse
        foreach ($dashboardRoles as $roleName) {
            Rol::where('nombre', $roleName)->update(['show_in_dashboard' => true]);
        }

        // Actualizar roles que NO deben mostrarse
        foreach ($nonDashboardRoles as $roleName) {
            Rol::where('nombre', $roleName)->update(['show_in_dashboard' => false]);
        }

        // Para roles que no están en ninguna lista, establecer como true por defecto
        Rol::whereNotIn('nombre', array_merge($dashboardRoles, $nonDashboardRoles))
           ->update(['show_in_dashboard' => true]);

        $this->command->info('Configuración de visibilidad en dashboard actualizada para todos los roles.');
    }
}
