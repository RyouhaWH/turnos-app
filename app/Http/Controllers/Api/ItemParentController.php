<?php
// app/Http/Controllers/Api/ItemParentController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ItemParent;
use App\Models\Item;
use Illuminate\Support\Facades\DB;
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

    /**
     * Crear ItemParent y generar ítems hijos automáticamente
     */
    public function createWithItems(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'categoria' => 'nullable',
            'categoria_id' => 'nullable|exists:categories,id',
            'proveedor' => 'nullable',
            'proveedor_id' => 'nullable|exists:providers,id',
            'proveedor_nombre' => 'nullable|string|max:255',
            'fecha_ingreso' => 'required|date',
            'ubicacion' => 'required|string|max:255',
            'responsable' => 'nullable|string|max:255',
            'valor_unitario' => 'nullable|numeric|min:0',
            'atributos_comunes' => 'nullable|array',
            'desglose' => 'required|array|min:1',
            'desglose.*.variantes' => 'required|array',
            'desglose.*.cantidad' => 'required|integer|min:1',
            'documentos_lote' => 'nullable|array',
            'totales' => 'nullable|array',
            'generateItems' => 'boolean',
            'generate_items' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            // Obtener nombre de categoría
            $categoriaNombre = null;
            if (!empty($validated['categoria_id'])) {
                $categoria = \App\Models\Category::find($validated['categoria_id']);
                $categoriaNombre = $categoria ? $categoria->nombre : 'Sin categoría';
            } elseif (!empty($validated['categoria'])) {
                $categoriaNombre = is_string($validated['categoria']) ? $validated['categoria'] : 'Sin categoría';
            }

            // Obtener proveedor_id
            $proveedorId = $validated['proveedor_id'] ?? $validated['proveedor'] ?? null;

            // Crear el lote padre
            $itemParent = ItemParent::create([
                'nombre' => $validated['nombre'],
                'categoria' => $categoriaNombre,
                'proveedor_id' => $proveedorId,
                'valor_unitario' => $validated['valor_unitario'] ?? null,
                'ubicacion' => $validated['ubicacion'],
                'responsable' => $validated['responsable'] ?? null,
                'fecha_ingreso' => $validated['fecha_ingreso'],
                'cantidad' => $validated['totales']['cantidad'] ?? 0,
                'totales' => [
                    'cantidad' => $validated['totales']['cantidad'] ?? 0,
                    'asignados' => 0,
                    'disponibles' => $validated['totales']['cantidad'] ?? 0,
                    'baja' => 0,
                ],
            ]);

            $createdItems = [];
            $itemCounter = 0;

            $generateItems = $validated['generateItems'] ?? $validated['generate_items'] ?? true;
            if (!empty($validated['desglose']) && $generateItems) {
                foreach ($validated['desglose'] as $desgloseItem) {
                    $cantidad = $desgloseItem['cantidad'];
                    $variantes = $desgloseItem['variantes'];

                    // Construir atributos específicos de la variante
                    $atributosVariante = [];
                    foreach ($variantes as $variante) {
                        if (!empty($variante['atributo']) && !empty($variante['valor'])) {
                            $atributosVariante[strtolower($variante['atributo'])] = $variante['valor'];
                        }
                    }

                    for ($i = 0; $i < $cantidad; $i++) {
                        $itemCounter++;

                        // Nombre
                        $varianteText = trim(implode(' ', array_values($atributosVariante)));
                        $nombreItem = $validated['nombre'] . ($varianteText ? ' - ' . $varianteText : '') . ' #' . $itemCounter;

                        // Atributos combinados
                        $atributosCompletos = [];
                        if (!empty($validated['atributos_comunes'])) {
                            foreach ($validated['atributos_comunes'] as $attr) {
                                if (!empty($attr['nombre']) && isset($attr['valor'])) {
                                    $atributosCompletos[$attr['nombre']] = $attr['valor'];
                                }
                            }
                        }
                        $atributosCompletos = array_merge($atributosCompletos, $atributosVariante);

                        // Crear ítem (SKU autogenerado por modelo)
                        $item = Item::create([
                            'parent_id' => $itemParent->id,
                            'parent_batch_id' => $itemParent->id,
                            'nombre' => $nombreItem,
                            'categoria' => $categoriaNombre,
                            'estado' => 'Disponible',
                            'ubicacion' => $validated['ubicacion'],
                            'responsable' => $validated['responsable'] ?? null,
                            'valor_unitario' => $validated['valor_unitario'] ?? null,
                            'atributos' => !empty($atributosCompletos) ? $atributosCompletos : null,
                            'proveedor_id' => $proveedorId,
                            'proveedor_nombre' => $validated['proveedor_nombre'] ?? null,
                            'fecha_ingreso' => $validated['fecha_ingreso'],
                        ]);

                        $item->addHistorialEntry(
                            'Generado desde lote padre',
                            $validated['responsable'] ?? 'Sistema',
                            'Lote #' . $itemParent->id
                        );

                        $createdItems[] = $item->load(['parent', 'parentBatch']);
                    }
                }
            }

            // Recalcular totales
            $itemParent->update([
                'cantidad' => count($createdItems),
            ]);
            $itemParent->updateTotales();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Lote padre e ítems hijos creados exitosamente',
                'data' => [
                    'lote' => $itemParent,
                    'items_created' => count($createdItems),
                    'items' => $createdItems,
                ]
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error al crear lote padre e ítems: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generar ítems hijos para un lote específico
     */
    public function generateItems(Request $request, $id): JsonResponse
    {
        $lote = ItemParent::find($id);

        if (!$lote) {
            return response()->json([
                'success' => false,
                'message' => 'Lote no encontrado'
            ], 404);
        }

        $createdItems = [];

        $validated = $request->validate([
            'extra_count' => 'nullable|integer|min:0',
        ]);

        DB::transaction(function () use ($lote, &$createdItems, $validated) {
            $requestedExtra = $validated['extra_count'] ?? null;
            $extra = is_null($requestedExtra) ? 0 : max(0, intval($requestedExtra));
            $existingCount = $lote->items()->count();
            $baseToCreate = max(0, ($lote->cantidad ?? 0) - $existingCount);
            $toCreate = $baseToCreate + $extra;

            for ($i = 0; $i < $toCreate; $i++) {
                $item = Item::create([
                    'parent_id' => $lote->id,
                    'parent_batch_id' => $lote->id,
                    'purchase_id' => $lote->purchase_id,
                    'nombre' => $lote->nombre . ' #' . ($existingCount + $i + 1),
                    'categoria' => $lote->categoria,
                    // SKU se genera automáticamente en el modelo Item::boot()
                    'estado' => 'Disponible',
                    'ubicacion' => $lote->ubicacion ?? 'Almacén',
                    'responsable' => $lote->responsable,
                    'valor_unitario' => $lote->valor_unitario,
                    'fecha_ingreso' => now(),
                ]);

                $item->addHistorialEntry(
                    'Generado desde lote',
                    'Sistema',
                    'Lote #' . $lote->id
                );

                // Cargar relación parent y parentBatch para que el front lo detecte
                $createdItems[] = $item->load(['parent', 'parentBatch']);
            }

            // Recalcular totales del lote
            $lote->updateTotales();
        });

        return response()->json([
            'success' => true,
            'data' => [
                'count' => count($createdItems),
                'items' => $createdItems,
            ],
            'message' => (count($createdItems) > 0)
                ? (count($createdItems) . ' ítems generados para el lote')
                : 'No se generaron ítems (ya existen suficientes hijos y no se solicitó extra_count)'
        ]);
    }
}
