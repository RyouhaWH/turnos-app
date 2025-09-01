<?php

namespace App\Services;

use App\Models\Rol;
use Spatie\Permission\Models\Role as SpatieRole;

class RoleService
{
    /**
     * Obtener todos los roles transformados para la vista
     */
    public function getRolesForView(): array
    {
        return Rol::all()->map(function ($role) {
            return [
                'id'             => $role->id,
                'nombre'         => $role->nombre,
                'is_operational' => $role->is_operational,
                'color'          => $role->color,
                'created_at'     => $role->created_at,
                'updated_at'     => $role->updated_at,
            ];
        })->toArray();
    }

    /**
     * Obtener roles de Spatie disponibles
     */
    public function getSpatieRoles(): array
    {
        return SpatieRole::all()->pluck('name')->toArray();
    }
}
