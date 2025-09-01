<?php

namespace App\Services;

use App\Models\Employees;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class EmployeeDataService
{
    /**
     * Transformar empleado a array para la vista
     */
    public function transformEmployeeForView(Employees $employee): array
    {
        return [
            'id'         => $employee->id,
            'name'       => $employee->name,
            'first_name' => $employee->first_name,
            'paternal_lastname' => $employee->paternal_lastname,
            'maternal_lastname' => $employee->maternal_lastname,
            'rut'        => $employee->rut,
            'phone'      => $employee->phone,
            'email'      => $employee->user ? $employee->user->email : $employee->email,
            'rol_id'     => $employee->rol_id,
            'rol_nombre' => $employee->rol->nombre ?? 'Sin rol',
            'user_id'    => $employee->user_id,
            'user_name'  => $employee->user ? $employee->user->name : null,
            'user_roles' => $employee->user ? $employee->user->roles->pluck('name')->toArray() : [],
            'created_at' => $employee->created_at,
            'updated_at' => $employee->updated_at,
        ];
    }

    /**
     * Transformar empleado para datos faltantes
     */
    public function transformEmployeeForMissingData(Employees $employee): array
    {
        return [
            'id' => $employee->id,
            'name' => $employee->name,
            'first_name' => $employee->first_name,
            'paternal_lastname' => $employee->paternal_lastname,
            'maternal_lastname' => $employee->maternal_lastname,
            'rut' => $employee->rut,
            'phone' => $employee->phone,
            'email' => $employee->user ? $employee->user->email : null,
            'rol_nombre' => $employee->rol ? $employee->rol->nombre : 'Sin rol',
            'amzoma' => $employee->amzoma ?? false,
            'tipo_organizacion' => ($employee->amzoma ?? false) ? 'Amzoma' : 'Municipal',
            'user_id' => $employee->user_id,
            'user_name' => $employee->user ? $employee->user->name : null,
            'user_roles' => $employee->user ? $employee->user->roles->pluck('name')->toArray() : [],
            'user_has_password' => $employee->user ? true : false,
        ];
    }

    /**
     * Obtener campos faltantes de un empleado
     */
    public function getMissingFields(Employees $employee): array
    {
        $missing = [];

        $employeeEmail = $employee->user ? $employee->user->email : $employee->email;
        if (!$employeeEmail) {
            $missing[] = 'email';
        }
        if (!$employee->rut) {
            $missing[] = 'rut';
        }
        if (!$employee->phone) {
            $missing[] = 'phone';
        }

        return $missing;
    }

    /**
     * Categorizar empleados por datos faltantes
     */
    public function categorizeEmployeesByMissingData(Collection $employees): array
    {
        $missingData = [
            'missing_email' => [],
            'missing_rut' => [],
            'missing_phone' => [],
            'missing_multiple' => [],
            'complete_data' => [],
        ];

        foreach ($employees as $employee) {
            $employeeData = $this->transformEmployeeForMissingData($employee);
            $missing = $this->getMissingFields($employee);

            $employeeData['missing_fields'] = $missing;

            if (empty($missing)) {
                $missingData['complete_data'][] = $employeeData;
            } else {
                // Un empleado puede aparecer en múltiples categorías
                foreach ($missing as $field) {
                    $missingData["missing_{$field}"][] = $employeeData;
                }

                // También agregar a múltiples si tiene más de un campo faltante
                if (count($missing) > 1) {
                    $missingData['missing_multiple'][] = $employeeData;
                }
            }
        }

        return $missingData;
    }

    /**
     * Calcular estadísticas de datos faltantes
     */
    public function calculateMissingDataStats(Collection $employees, array $missingData): array
    {
        return [
            'total_employees' => $employees->count(),
            'complete_data' => count($missingData['complete_data']),
            'missing_email' => count($missingData['missing_email']),
            'missing_rut' => count($missingData['missing_rut']),
            'missing_phone' => count($missingData['missing_phone']),
            'missing_multiple' => count($missingData['missing_multiple']),
            'completion_percentage' => $employees->count() > 0
                ? round((count($missingData['complete_data']) / $employees->count()) * 100, 1)
                : 0,
        ];
    }

    /**
     * Obtener empleados sin vincular
     */
    public function getUnlinkedEmployees(): Collection
    {
        return Employees::with(['rol', 'user'])
            ->whereNull('user_id')
            ->get()
            ->map(function ($employee) {
                return $this->transformEmployeeForMissingData($employee);
            });
    }

    /**
     * Obtener usuarios disponibles para vincular
     */
    public function getAvailableUsers(): Collection
    {
        return User::whereDoesntHave('employee')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $user->roles->map(function ($role) {
                        return ['name' => $role->name];
                    })->toArray(),
                ];
            });
    }
}
