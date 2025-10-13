<?php
// app/Http/Controllers/Api/ItemParentController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItemParent;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ItemParentController extends Controller
{
    /**
     * Listar todos los lotes
     */
    public function index(): JsonResponse
    {
        $itemParents = ItemParent::with('items', 'purchase')
                                 ->orderBy('created_at', 'desc')
                                 ->get();

        return response()->json([
            'success' => true,
            'data' => $itemParents
        ]);
    }

    /**
     * Obtener lote por ID
     */
    public function show($id): JsonResponse
    {
        $itemParent = ItemParent::with('items', 'purchase')->find($id);

        if (!$itemParent) {
            return response()->json([
                'success' => false,
                'message' => 'Lote no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $itemParent
        ]);
    }

    /**
     * Crear nuevo lote
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'purchase_id' => 'nullable|exists:purchases,id',
            'nombre' => 'required|string|max:255',
            'categoria' => 'required|string|max:255',
            'cantidad' => 'required|integer|min:1',
            'unidad' => 'nullable|string|max:255',
            'valor_unitario' => 'nullable|numeric|min:0',
            'valor_total' => 'nullable|numeric|min:0',
            'atributos_comunes' => 'nullable|array',
            'fecha_ingreso' => 'nullable|date',
        ]);

        // Calcular valor_total si no se proporciona
        if (!isset($validated['valor_total']) && isset($validated['valor_unitario'])) {
            $validated['valor_total'] = $validated['valor_unitario'] * $validated['cantidad'];
        }

        // Inicializar totales
        $validated['totales'] = [
            'cantidad' => $validated['cantidad'],
            'asignados' => 0,
            'disponibles' => $validated['cantidad'],
            'baja' => 0,
        ];

        $itemParent = ItemParent::create($validated);

        return response()->json([
            'success' => true,
            'data' => $itemParent,
            'message' => 'Lote creado exitosamente'
        ], 201);
    }

    /**
     * Actualizar lote
     */
    public function update(Request $request, $id): JsonResponse
    {
        $itemParent = ItemParent::find($id);

        if (!$itemParent) {
            return response()->json([
                'success' => false,
                'message' => 'Lote no encontrado'
            ], 404);
        }

        $itemParent->update($request->all());

        // Recalcular totales si es necesario
        if ($request->has('recalcular_totales')) {
            $itemParent->updateTotales();
        }

        return response()->json([
            'success' => true,
            'data' => $itemParent,
            'message' => 'Lote actualizado exitosamente'
        ]);
    }

    /**
     * Eliminar lote (soft delete)
     */
    public function destroy($id): JsonResponse
    {
        $itemParent = ItemParent::find($id);

        if (!$itemParent) {
            return response()->json([
                'success' => false,
                'message' => 'Lote no encontrado'
            ], 404);
        }

        // Verificar que no tenga items
        if ($itemParent->items()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar un lote con ítems asociados'
            ], 400);
        }

        $itemParent->delete();

        return response()->json([
            'success' => true,
            'message' => 'Lote eliminado exitosamente'
        ]);
    }
}
