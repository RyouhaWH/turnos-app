<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Rol;

class AssignColorsToRolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roleColors = [
            'Alerta Móvil' => '#3B82F6',      // Azul
            'Fiscalización' => '#EF4444',      // Rojo
            'Motorizado' => '#10B981',         // Verde
            'Dron' => '#F59E0B',               // Amarillo
            'Ciclopatrullaje' => '#8B5CF6',    // Púrpura
            'Coordinador Despacho' => '#06B6D4', // Cian
            'Administrativo' => '#6B7280',     // Gris
            'Personal de Servicio' => '#F97316', // Naranja
        ];

        foreach ($roleColors as $roleName => $color) {
            Rol::where('nombre', $roleName)->update(['color' => $color]);
        }

        // Para roles que no están en la lista, asignar un color por defecto
        Rol::whereNull('color')->update(['color' => '#3B82F6']);

        $this->command->info('Colores asignados a todos los roles.');
    }
}
