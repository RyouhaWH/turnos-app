<?php
// app/Http/Controllers/Api/ProviderController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Provider;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ProviderController extends Controller
{
    /**
     * Listar todos los proveedores
     */
    public function index(): JsonResponse
    {
        $providers = Provider::orderBy('nombre')->get();

        return response()->json($providers);
    }

    /**
     * Obtener proveedor por ID
     */
    public function show($id): JsonResponse
    {
        $provider = Provider::with('purchases')->find($id);

        if (!$provider) {
            return response()->json([
                'success' => false,
                'message' => 'Proveedor no encontrado'
            ], 404);
        }

        return response()->json($provider);
    }

    /**
     * Crear nuevo proveedor
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'email' => 'required|email|unique:providers,email',
            'telefono' => 'required|string|max:255',
            'direccion' => 'required|string',
            'contacto' => 'required|string|max:255',
        ]);

        $provider = Provider::create($validated);

        return response()->json([
            'success' => true,
            'data' => $provider,
            'message' => 'Proveedor creado exitosamente'
        ], 201);
    }

    /**
     * Actualizar proveedor
     */
    public function update(Request $request, $id): JsonResponse
    {
        $provider = Provider::find($id);

        if (!$provider) {
            return response()->json([
                'success' => false,
                'message' => 'Proveedor no encontrado'
            ], 404);
        }

        $validated = $request->validate([
            'nombre' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:providers,email,' . $id,
            'telefono' => 'nullable|string|max:255',
            'direccion' => 'nullable|string',
            'contacto' => 'nullable|string|max:255',
        ]);

        $provider->update($validated);

        return response()->json([
            'success' => true,
            'data' => $provider,
            'message' => 'Proveedor actualizado exitosamente'
        ]);
    }

    /**
     * Eliminar proveedor (soft delete)
     */
    public function destroy($id): JsonResponse
    {
        $provider = Provider::find($id);

        if (!$provider) {
            return response()->json([
                'success' => false,
                'message' => 'Proveedor no encontrado'
            ], 404);
        }

        // Verificar que no tenga compras
        if ($provider->purchases()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar un proveedor con compras asociadas'
            ], 400);
        }

        $provider->delete();

        return response()->json([
            'success' => true,
            'message' => 'Proveedor eliminado exitosamente'
        ]);
    }
}
