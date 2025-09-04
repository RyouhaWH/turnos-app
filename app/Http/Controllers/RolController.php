<?php

namespace App\Http\Controllers;

use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RolController extends Controller
{
    /**
     * Obtener todos los roles
     */
    public function index()
    {
        try {
            $roles = Rol::all();
            return response()->json([
                'success' => true,
                'data' => $roles
            ]);
        } catch (\Exception $e) {
            Log::error('Error obteniendo roles: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener roles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar configuración de rol operativo
     */
    public function updateOperationalStatus(Request $request, $id)
    {
        try {
            $request->validate([
                'is_operational' => 'required|boolean'
            ]);

            $rol = Rol::findOrFail($id);
            $rol->is_operational = $request->is_operational;
            $rol->save();

            return response()->json([
                'success' => true,
                'message' => 'Configuración actualizada correctamente',
                'data' => $rol
            ]);
        } catch (\Exception $e) {
            Log::error('Error actualizando estado operativo de rol: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar configuración',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar múltiples roles a la vez
     */
    public function updateMultiple(Request $request)
    {
        try {
            $request->validate([
                'roles' => 'required|array',
                'roles.*.id' => 'required|integer|exists:rols,id',
                'roles.*.is_operational' => 'required|boolean'
            ]);

            foreach ($request->roles as $roleData) {
                $rol = Rol::find($roleData['id']);
                $rol->is_operational = $roleData['is_operational'];
                $rol->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Configuraciones actualizadas correctamente'
            ]);
        } catch (\Exception $e) {
            Log::error('Error actualizando múltiples roles: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar configuraciones',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear un nuevo rol
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'nombre' => 'required|string|max:255|unique:rols,nombre',
                'is_operational' => 'boolean',
                'color' => 'nullable|string|max:7'
            ]);

            $rol = Rol::create([
                'nombre' => $request->nombre,
                'is_operational' => $request->is_operational ?? false,
                'color' => $request->color
            ]);

            return redirect()->back()->with('success', 'Rol creado correctamente');
        } catch (\Exception $e) {
            Log::error('Error creando rol: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Error al crear rol: ' . $e->getMessage()]);
        }
    }

    /**
     * Actualizar un rol existente
     */
    public function update(Request $request, $id)
    {
        try {
            $request->validate([
                'nombre' => 'required|string|max:255|unique:rols,nombre,' . $id,
                'is_operational' => 'boolean',
                'color' => 'nullable|string|max:7'
            ]);

            $rol = Rol::findOrFail($id);
            $rol->update([
                'nombre' => $request->nombre,
                'is_operational' => $request->is_operational ?? $rol->is_operational,
                'color' => $request->color
            ]);

            return redirect()->back()->with('success', 'Rol actualizado correctamente');
        } catch (\Exception $e) {
            Log::error('Error actualizando rol: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Error al actualizar rol: ' . $e->getMessage()]);
        }
    }

    /**
     * Eliminar un rol
     */
    public function destroy($id)
    {
        try {
            $rol = Rol::findOrFail($id);

            // Verificar si el rol está siendo usado por empleados
            $employeesCount = $rol->employees()->count();
            if ($employeesCount > 0) {
                return redirect()->back()->withErrors([
                    'error' => "No se puede eliminar el rol. Está siendo usado por {$employeesCount} empleado(s)."
                ]);
            }

            $rol->delete();

            return redirect()->back()->with('success', 'Rol eliminado correctamente');
        } catch (\Exception $e) {
            Log::error('Error eliminando rol: ' . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Error al eliminar rol: ' . $e->getMessage()]);
        }
    }
}
