<?php

namespace App\Services;

use App\Models\Employees;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class EmployeeLinkingService
{
    /**
     * Vincular empleado con usuario
     */
    public function linkEmployeeToUser(int $employeeId, int $userId): array
    {
        $employee = Employees::findOrFail($employeeId);
        $user = User::findOrFail($userId);

        // Verificar que el usuario no esté ya vinculado
        if ($user->employee) {
            return [
                'success' => false,
                'message' => 'El usuario ya está vinculado a otro funcionario.',
                'status' => 400
            ];
        }

        // Verificar que el empleado no esté ya vinculado
        if ($employee->user_id) {
            return [
                'success' => false,
                'message' => 'El funcionario ya está vinculado a otro usuario.',
                'status' => 400
            ];
        }

        // Realizar la vinculación
        $employee->update(['user_id' => $user->id]);

        Log::info('Employee linked to user successfully', [
            'employee_id' => $employeeId,
            'user_id' => $userId,
            'linked_by' => auth()->id() ?? 'unknown'
        ]);

        return [
            'success' => true,
            'message' => 'Funcionario vinculado correctamente.',
            'status' => 200
        ];
    }

    /**
     * Desvincular empleado
     */
    public function unlinkEmployee(int $employeeId): array
    {
        $employee = Employees::findOrFail($employeeId);
        $oldUserId = $employee->user_id;

        $employee->update(['user_id' => null]);

        Log::info('Employee unlinked from user successfully', [
            'employee_id' => $employeeId,
            'old_user_id' => $oldUserId,
            'unlinked_by' => auth()->id() ?? 'unknown'
        ]);

        return [
            'success' => true,
            'message' => 'Funcionario desvinculado correctamente.',
            'status' => 200
        ];
    }

    /**
     * Crear usuario para un empleado
     */
    public function createUserForEmployee(int $employeeId, array $userData): array
    {
        $employee = Employees::findOrFail($employeeId);

        // Verificar que el empleado no tenga ya un usuario
        if ($employee->user_id) {
            return [
                'success' => false,
                'message' => 'El empleado ya tiene un usuario asociado',
                'status' => 400
            ];
        }

        // Crear el usuario
        $user = User::create([
            'name' => $userData['name'],
            'email' => $userData['email'],
            'password' => bcrypt($userData['password']),
        ]);

        // Asignar roles
        $user->assignRole($userData['roles']);

        // Vincular el usuario al empleado
        $employee->update(['user_id' => $user->id]);

        Log::info('User created for employee successfully', [
            'employee_id' => $employeeId,
            'user_id' => $user->id,
            'created_by' => auth()->id() ?? 'unknown'
        ]);

        return [
            'success' => true,
            'message' => 'Usuario creado y vinculado correctamente',
            'data' => $user,
            'status' => 200
        ];
    }

    /**
     * Actualizar usuario de un empleado
     */
    public function updateUserForEmployee(int $employeeId, array $userData): array
    {
        $employee = Employees::with('user')->findOrFail($employeeId);

        if (!$employee->user) {
            return [
                'success' => false,
                'message' => 'El empleado no tiene un usuario asociado',
                'status' => 400
            ];
        }

        $user = $employee->user;
        $changes = [];

        // Actualizar campos del usuario
        if (isset($userData['name']) && $userData['name'] !== $user->name) {
            $user->name = $userData['name'];
            $changes['name'] = $userData['name'];
        }

        if (isset($userData['email']) && $userData['email'] !== $user->email) {
            // Verificar que el email no esté en uso por otro usuario
            if (User::where('email', $userData['email'])->where('id', '!=', $user->id)->exists()) {
                return [
                    'success' => false,
                    'message' => 'El email ya está en uso por otro usuario',
                    'status' => 400
                ];
            }
            $user->email = $userData['email'];
            $changes['email'] = $userData['email'];
        }

        if (isset($userData['password'])) {
            $user->password = bcrypt($userData['password']);
            $changes['password'] = 'updated';
        }

        $user->save();

        // Actualizar roles si se proporcionan
        if (isset($userData['roles'])) {
            $user->syncRoles($userData['roles']);
            $changes['roles'] = $userData['roles'];
        }

        Log::info('User updated for employee successfully', [
            'employee_id' => $employeeId,
            'user_id' => $user->id,
            'updated_by' => auth()->id() ?? 'unknown',
            'changes' => $changes
        ]);

        return [
            'success' => true,
            'message' => 'Usuario actualizado correctamente',
            'data' => $user->load('roles'),
            'status' => 200
        ];
    }

    /**
     * Eliminar usuario de un empleado
     */
    public function deleteUserForEmployee(int $employeeId): array
    {
        $employee = Employees::with('user')->findOrFail($employeeId);

        if (!$employee->user) {
            return [
                'success' => false,
                'message' => 'El empleado no tiene un usuario asociado',
                'status' => 400
            ];
        }

        $userId = $employee->user->id;
        $userEmail = $employee->user->email;

        // Desvincular el usuario del empleado
        $employee->update(['user_id' => null]);

        // Eliminar el usuario
        $employee->user->delete();

        Log::info('User deleted for employee successfully', [
            'employee_id' => $employeeId,
            'user_id' => $userId,
            'user_email' => $userEmail,
            'deleted_by' => auth()->id() ?? 'unknown'
        ]);

        return [
            'success' => true,
            'message' => 'Usuario eliminado correctamente',
            'status' => 200
        ];
    }
}
