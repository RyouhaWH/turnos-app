<?php

namespace App\Http\Controllers;

use App\Models\Rol;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RoleController extends Controller
{
    /**
     * Crear nuevo rol
     */
    public function store(Request $request)
    {
        try {
            $request->validate([
                'nombre' => 'required|string|max:255|unique:rols,nombre',
                'is_operational' => 'boolean',
                'color' => 'string|max:7',
            ]);

            $role = Rol::create([
                'nombre'         => $request->nombre,
                'is_operational' => $request->input('is_operational', true),
                'color'          => $request->input('color', '#3B82F6'),
            ]);

            Log::info('Role created successfully', [
                'role_id' => $role->id,
                'role_name' => $role->nombre,
                'created_by' => auth()->id() ?? 'unknown'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Rol creado correctamente',
                'data' => $role
            ]);

        } catch (\Exception $e) {
            Log::error('Error creating role: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al crear rol: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar rol
     */
    public function update(Request $request, $id)
    {
        try {
            $role = Rol::findOrFail($id);

            $request->validate([
                'nombre' => 'required|string|max:255|unique:rols,nombre,' . $id,
                'is_operational' => 'boolean',
                'color' => 'string|max:7',
            ]);

            $role->update([
                'nombre'         => $request->nombre,
                'is_operational' => $request->input('is_operational', $role->is_operational),
                'color'          => $request->input('color', $role->color),
            ]);

            Log::info('Role updated successfully', [
                'role_id' => $id,
                'role_name' => $role->nombre,
                'updated_by' => auth()->id() ?? 'unknown'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Rol actualizado correctamente',
                'data' => $role
            ]);

        } catch (\Exception $e) {
            Log::error('Error updating role: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al actualizar rol: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar rol
     */
    public function destroy($id)
    {
        try {
            $role = Rol::findOrFail($id);

            // Verificar si hay empleados usando este rol
            $employeesCount = $role->employees()->count();
            if ($employeesCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar el rol porque hay ' . $employeesCount . ' empleado(s) asignado(s) a él.'
                ], 400);
            }

            $role->delete();

            Log::info('Role deleted successfully', [
                'role_id' => $id,
                'role_name' => $role->nombre,
                'deleted_by' => auth()->id() ?? 'unknown'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Rol eliminado correctamente'
            ]);

        } catch (\Exception $e) {
            Log::error('Error deleting role: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar rol: ' . $e->getMessage()
            ], 500);
        }
    }
}
