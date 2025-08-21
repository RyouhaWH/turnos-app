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
}
