<?php
// app/Http/Controllers/Api/ItemController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Http\Requests\StoreItemRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ItemController extends Controller
{
    /**
     * Listar todos los items
     */
    public function index(Request $request): JsonResponse
    {
        $query = Item::query();

        // Filtros opcionales
        if ($request->has('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->has('categoria')) {
            $query->where('categoria', $request->categoria);
        }

        if ($request->has('responsable')) {
            $query->where('responsable', $request->responsable);
        }

        $items = $query->orderBy('created_at', 'desc')->get();

        return response()->json($items);
    }

    /**
     * Obtener item por ID (incluye ítems eliminados)
     */
    public function show($id): JsonResponse
    {
        $item = Item::withTrashed()->with('movements', 'parent')->find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Ítem no encontrado'
            ], 404);
        }

        // Agregar información sobre el estado de eliminación
        $itemData = $item->toArray();
        $itemData['is_deleted'] = $item->trashed();
        $itemData['deleted_at'] = $item->deleted_at;

        return response()->json([
            'success' => true,
            'data' => $itemData
        ]);
    }

    /**
     * Crear nuevo item
     */
    public function store(StoreItemRequest $request): JsonResponse
    {
        $item = Item::create($request->validated());

        // Agregar historial inicial
        $item->addHistorialEntry(
            'Creación del ítem',
            'Sistema',
            'Ítem registrado en el inventario'
        );

        return response()->json([
            'success' => true,
            'data' => $item,
            'message' => 'Ítem creado exitosamente'
        ], 201);
    }

    /**
     * Actualizar item
     */
    public function update(Request $request, $id): JsonResponse
    {
        $item = Item::find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Ítem no encontrado'
            ], 404);
        }

        $item->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $item,
            'message' => 'Ítem actualizado exitosamente'
        ]);
    }

    /**
     * Eliminar item (soft delete)
     */
    public function destroy($id): JsonResponse
    {
        $item = Item::find($id);

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Ítem no encontrado'
            ], 404);
        }

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Ítem eliminado exitosamente'
        ]);
    }

    /**
     * Obtener item por SKU
     */
    public function getBySku($sku): JsonResponse
    {
        $item = Item::with('movements', 'parent')->bySku($sku)->first();

        if (!$item) {
            return response()->json([
                'success' => false,
                'message' => 'Ítem no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $item
        ]);
    }

    /**
     * Obtener items disponibles
     */
    public function disponibles(): JsonResponse
    {
        $items = Item::disponible()->get();

        return response()->json([
            'success' => true,
            'data' => $items
        ]);
    }
}
