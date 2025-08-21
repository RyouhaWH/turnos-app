<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Rol;

class UpdateRolesOperationalStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Roles que son operativos (desempeñan funciones de prevención de delito)
        $operationalRoles = [
            'Alerta Móvil',
            'Fiscalización',
            'Motorizado',
            'Dron',
            'Ciclopatrullaje',
            'Coordinador Despacho'
        ];

        // Roles que NO son operativos
        $nonOperationalRoles = [
            'Administrativo',
            'Personal de Servicio'
        ];

        // Actualizar roles operativos
        foreach ($operationalRoles as $roleName) {
            Rol::where('nombre', $roleName)->update(['is_operational' => true]);
        }

        // Actualizar roles no operativos
        foreach ($nonOperationalRoles as $roleName) {
            Rol::where('nombre', $roleName)->update(['is_operational' => false]);
        }

        // Para roles que no están en ninguna lista, establecer como operativo por defecto
        Rol::whereNotIn('nombre', array_merge($operationalRoles, $nonOperationalRoles))
           ->update(['is_operational' => true]);

        $this->command->info('Configuración de roles operativos actualizada para todos los roles.');
    }
}
