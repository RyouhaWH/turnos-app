<?php

namespace App\Services;

use App\Models\Employees;
use Illuminate\Support\Facades\Log;

class EmployeeCrudService
{
    /**
     * Obtener empleado por ID
     */
    public function getEmployee(int $id): ?Employees
    {
        return Employees::with('rol')->find($id);
    }

    /**
     * Actualizar empleado
     */
    public function updateEmployee(int $id, array $data): array
    {
        try {
            $employee = Employees::findOrFail($id);

            $employee->update($data);

            Log::info('Employee updated successfully', [
                'employee_id' => $id,
                'updated_by' => auth()->id() ?? 'unknown',
                'changes' => $data
            ]);

            return [
                'success' => true,
                'message' => 'Empleado actualizado correctamente',
                'status' => 200
            ];

        } catch (\Exception $e) {
            Log::error('Error updating employee: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al actualizar empleado: ' . $e->getMessage(),
                'status' => 500
            ];
        }
    }

    /**
     * Validar datos de empleado
     */
    public function validateEmployeeData(array $data): array
    {
        $rules = [
            'name'              => 'nullable|string|max:255',
            'first_name'        => 'nullable|string|max:255',
            'paternal_lastname' => 'nullable|string|max:255',
            'maternal_lastname' => 'nullable|string|max:255',
            'rut'               => 'nullable|string|max:20',
            'phone'             => 'nullable|string|max:20',
            'email'             => 'nullable|email|max:255',
            'address'           => 'nullable|string',
            'position'          => 'nullable|string|max:255',
            'department'        => 'nullable|string|max:255',
            'start_date'        => 'nullable|date',
            'status'            => 'nullable|in:activo,inactivo,vacaciones,licencia',
            'rol_id'            => 'nullable|integer|exists:rols,id',
        ];

        $validator = validator($data, $rules);

        if ($validator->fails()) {
            return [
                'success' => false,
                'message' => 'Datos de validación incorrectos',
                'errors' => $validator->errors(),
                'status' => 422
            ];
        }

        return [
            'success' => true,
            'data' => $validator->validated(),
            'status' => 200
        ];
    }
}
