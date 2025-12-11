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
     * Crear empleado
     */
    public function createEmployee(array $data): array
    {
        try {
            // Construir el nombre completo si se proporcionan los componentes
            if (isset($data['first_name']) || isset($data['paternal_lastname']) || isset($data['maternal_lastname'])) {
                $nameParts = array_filter([
                    $data['first_name'] ?? '',
                    $data['paternal_lastname'] ?? '',
                    $data['maternal_lastname'] ?? ''
                ]);
                $data['name'] = implode(' ', $nameParts);
            }

            // Si no se proporciona nombre completo ni componentes, usar un valor por defecto
            if (empty($data['name'])) {
                $data['name'] = 'Sin nombre';
            }

            // Establecer amzoma en true por defecto si no se proporciona
            if (!isset($data['amzoma'])) {
                $data['amzoma'] = true;
            }

            $employee = Employees::create($data);

            Log::info('Employee created successfully', [
                'employee_id' => $employee->id,
                'created_by' => auth()->id() ?? 'unknown',
                'data' => $data
            ]);

            return [
                'success' => true,
                'message' => 'Empleado creado correctamente',
                'data' => $employee->load('rol'),
                'status' => 201
            ];

        } catch (\Exception $e) {
            Log::error('Error creating employee: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Error al crear empleado: ' . $e->getMessage(),
                'status' => 500
            ];
        }
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
    public function validateEmployeeData(array $data, bool $isCreate = false): array
    {
        $rules = [
            'name'              => 'nullable|string|max:255',
            'first_name'        => 'nullable|string|max:255',
            'paternal_lastname' => 'nullable|string|max:255',
            'maternal_lastname' => 'nullable|string|max:255',
            'rut'               => 'nullable|string|max:20' . ($isCreate ? '|unique:employees,rut' : ''),
            'phone'             => 'nullable|string|max:20',
            'email'             => 'nullable|email|max:255',
            'address'           => 'nullable|string',
            'position'          => 'nullable|string|max:255',
            'department'        => 'nullable|string|max:255',
            'start_date'        => 'nullable|date',
            'status'            => 'nullable|in:activo,inactivo,vacaciones,licencia',
            'amzoma'            => 'nullable|boolean',
            'rol_id'            => ($isCreate ? 'required' : 'nullable') . '|integer|exists:rols,id',
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
