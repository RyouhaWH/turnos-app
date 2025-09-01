<?php

namespace App\Http\Controllers;

use App\Models\Employees;
use App\Models\Rol;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PlatformDataController extends Controller
{
    /**
     * Show the main platform data view
     */
    public function index()
    {
        $roles = Rol::all()->map(function ($role) {
            return [
                'id'             => $role->id,
                'nombre'         => $role->nombre,
                'is_operational' => $role->is_operational,
                'color'          => $role->color,
                'created_at'     => $role->created_at,
                'updated_at'     => $role->updated_at,
            ];
        });

        $empleados = Employees::with('rol')->get()->map(function ($empleado) {
            return [
                'id'         => $empleado->id,
                'name'       => $empleado->name,
                'rut'        => $empleado->rut,
                'phone'      => $empleado->phone,
                'rol_id'     => $empleado->rol_id,
                'rol_nombre' => $empleado->rol->nombre ?? 'Sin rol',
                'created_at' => $empleado->created_at,
                'updated_at' => $empleado->updated_at,
            ];
        });

        return Inertia::render('settings/platform-data', [
            'roles'     => $roles,
            'empleados' => $empleados,
        ]);
    }

    /**
     * Get employee data by ID
     */
    public function showEmployee($id)
    {
        $empleado = Employees::with('rol')->findOrFail($id);
        return response()->json(['success' => true, 'data' => $empleado]);
    }

    /**
     * Update employee data
     */
    public function updateEmployee(Request $request, $id)
    {
        $empleado = Employees::findOrFail($id);

        $request->validate([
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
        ]);

        $empleado->update($request->only([
            'name', 'first_name', 'paternal_lastname', 'maternal_lastname',
            'rut', 'phone', 'email', 'address', 'position', 'department',
            'start_date', 'status', 'rol_id',
        ]));

        return redirect()->back()->with('success', 'Empleado actualizado correctamente');
    }

    /**
     * Get unlinked employees and available users
     */
    public function getUnlinkedEmployees()
    {
        $unlinkedEmployees = Employees::with('rol')
            ->whereNull('user_id')
            ->get()
            ->map(function ($employee) {
                return [
                    'id'                => $employee->id,
                    'name'              => $employee->name,
                    'first_name'        => $employee->first_name,
                    'paternal_lastname' => $employee->paternal_lastname,
                    'maternal_lastname' => $employee->maternal_lastname,
                    'rut'               => $employee->rut,
                    'phone'             => $employee->phone,
                    'email'             => $employee->email,
                    'rol_nombre'        => $employee->rol ? $employee->rol->nombre : 'Sin rol',
                    'amzoma'            => $employee->amzoma ?? false,
                ];
            });

        $availableUsers = User::whereDoesntHave('employee')
            ->get()
            ->map(function ($user) {
                return [
                    'id'    => $user->id,
                    'name'  => $user->name,
                    'email' => $user->email,
                    'roles' => $user->roles->map(function ($role) {
                        return ['name' => $role->name];
                    })->toArray(),
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => [
                'unlinked_employees' => $unlinkedEmployees,
                'available_users'    => $availableUsers,
            ],
        ]);
    }

    /**
     * Link employee with user
     */
    public function linkEmployeeWithUser(Request $request, $employeeId)
    {
        $request->validate(['user_id' => 'required|exists:users,id']);

        $employee = Employees::findOrFail($employeeId);
        $user     = User::findOrFail($request->user_id);

        if ($user->employee) {
            return response()->json([
                'success' => false,
                'message' => 'El usuario ya está vinculado a otro funcionario.',
            ], 400);
        }

        if ($employee->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'El funcionario ya está vinculado a otro usuario.',
            ], 400);
        }

        $employee->update(['user_id' => $user->id]);

        return response()->json([
            'success' => true,
            'message' => 'Funcionario vinculado correctamente.',
        ]);
    }

    /**
     * Unlink employee from user
     */
    public function unlinkEmployeeFromUser($employeeId)
    {
        $employee = Employees::findOrFail($employeeId);
        $employee->update(['user_id' => null]);

        return response()->json([
            'success' => true,
            'message' => 'Funcionario desvinculado correctamente.',
        ]);
    }

    /**
     * Get employee user link information
     */
    public function getEmployeeUserLink($employeeId)
    {
        $employee = Employees::with('user')->findOrFail($employeeId);

        return response()->json([
            'success' => true,
            'data'    => [
                'employee' => [
                    'id'   => $employee->id,
                    'name' => $employee->name,
                ],
                'user'     => $employee->user ? [
                    'id'    => $employee->user->id,
                    'name'  => $employee->user->name,
                    'email' => $employee->user->email,
                    'roles' => $employee->user->roles->map(function ($role) {
                        return ['name' => $role->name];
                    })->toArray(),
                ] : null,
            ],
        ]);
    }

    /**
     * Create new role
     */
    public function storeRole(Request $request)
    {
        $request->validate(['nombre' => 'required|string|max:255|unique:rols,nombre']);

        Rol::create([
            'nombre'         => $request->nombre,
            'is_operational' => $request->input('is_operational', true),
            'color'          => $request->input('color', '#3B82F6'),
        ]);

        return redirect()->back()->with('success', 'Rol creado correctamente');
    }

    /**
     * Update role
     */
    public function updateRole(Request $request, $id)
    {
        $role = Rol::findOrFail($id);

        $request->validate(['nombre' => 'required|string|max:255|unique:rols,nombre,' . $id]);

        $role->update([
            'nombre'         => $request->nombre,
            'is_operational' => $request->input('is_operational', $role->is_operational),
            'color'          => $request->input('color', $role->color),
        ]);

        return redirect()->back()->with('success', 'Rol actualizado correctamente');
    }

    /**
     * Delete role
     */
    public function destroyRole($id)
    {
        $role = Rol::findOrFail($id);

        $employeesCount = $role->employees()->count();
        if ($employeesCount > 0) {
            return redirect()->back()->with('error', 
                'No se puede eliminar el rol porque hay ' . $employeesCount . ' empleado(s) asignado(s) a él.'
            );
        }

        $role->delete();
        return redirect()->back()->with('success', 'Rol eliminado correctamente');
    }

    /**
     * Get missing data analysis
     */
    public function getMissingDataAnalysis()
    {
        return response()->json(['success' => true]);
        
        // TODO: Implementar lógica de análisis de datos faltantes
        // Este código está comentado temporalmente
    }
}
