<?php
// app/Http/Controllers/Api/PurchaseController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Purchase;
use App\Models\ItemParent;
use App\Models\Item;
use App\Http\Requests\StorePurchaseRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PurchaseController extends Controller
{
    /**
     * Listar todas las compras
     */
    public function index(): JsonResponse
    {
        try {
            $purchases = Purchase::with('provider')
                                ->orderBy('fecha_compra', 'desc')
                                ->get();

            $formattedPurchases = $purchases->map(function ($purchase) {
                return [
                    'id' => $purchase->id,
                    'proveedor_id' => $purchase->proveedor_id,
                    'proveedor_nombre' => $purchase->proveedor_nombre,
                    'fecha_compra' => $purchase->fecha_compra?->format('Y-m-d'),
                    'tipo_documento' => $purchase->tipo_documento,
                    'numero_documento' => $purchase->numero_documento,
                    'tipo_compra' => $purchase->tipo_compra,
                    'responsable' => $purchase->responsable,
                    'monto_total' => $purchase->monto_total,
                    'observaciones' => $purchase->observaciones,
                    'created_at' => $purchase->created_at?->format('Y-m-d H:i:s'),
                    'provider' => $purchase->provider ? [
                        'id' => $purchase->provider->id,
                        'nombre' => $purchase->provider->nombre,
                        'rut' => $purchase->provider->rut,
                    ] : null,
                ];
            });

            return response()->json($formattedPurchases);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las compras',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener compra por ID
     */
    public function show($id): JsonResponse
    {
        try {
            $purchase = Purchase::with(['provider', 'itemParents'])->find($id);

            if (!$purchase) {
                return response()->json([
                    'success' => false,
                    'message' => 'Compra no encontrada'
                ], 404);
            }

            // Formatear la respuesta
            $purchaseData = [
                'id' => $purchase->id,
                'proveedor_id' => $purchase->proveedor_id,
                'proveedor_nombre' => $purchase->proveedor_nombre,
                'fecha_compra' => $purchase->fecha_compra?->format('Y-m-d'),
                'tipo_documento' => $purchase->tipo_documento,
                'numero_documento' => $purchase->numero_documento,
                'tipo_compra' => $purchase->tipo_compra,
                'responsable' => $purchase->responsable,
                'ubicacion_destino' => $purchase->ubicacion_destino,
                'monto_total' => $purchase->monto_total,
                'observaciones' => $purchase->observaciones,
                'documentos' => $purchase->documentos,
                'lotes' => $purchase->lotes,
                'created_at' => $purchase->created_at?->format('Y-m-d H:i:s'),
                'updated_at' => $purchase->updated_at?->format('Y-m-d H:i:s'),
                'provider' => $purchase->provider ? [
                    'id' => $purchase->provider->id,
                    'nombre' => $purchase->provider->nombre,
                    'rut' => $purchase->provider->rut,
                    'contacto' => $purchase->provider->contacto,
                ] : null,
                'item_parents' => $purchase->itemParents->map(function ($itemParent) {
                    return [
                        'id' => $itemParent->id,
                        'nombre' => $itemParent->nombre,
                        'categoria' => $itemParent->categoria,
                        'cantidad' => $itemParent->cantidad,
                        'unidad' => $itemParent->unidad,
                        'valor_unitario' => $itemParent->valor_unitario,
                        'valor_total' => $itemParent->valor_total,
                        'codigo' => $itemParent->codigo,
                        'descripcion' => $itemParent->descripcion,
                        'variantes' => $itemParent->variantes,
                        'atributos_comunes' => $itemParent->atributos_comunes,
                        'fecha_ingreso' => $itemParent->fecha_ingreso?->format('Y-m-d'),
                        'estado' => $itemParent->estado,
                        'ubicacion' => $itemParent->ubicacion,
                        'responsable' => $itemParent->responsable,
                        'totales' => $itemParent->totales,
                    ];
                }),
            ];

            return response()->json($purchaseData);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener la compra',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crear nueva compra
     */
    public function store(StorePurchaseRequest $request): JsonResponse
    {
        DB::beginTransaction();

        try {
            $validated = $request->validated();

            // 1. Crear la compra (sin items)
            $purchaseData = collect($validated)->except(['items'])->toArray();
            $purchase = Purchase::create($purchaseData);

            // 2. Procesar items si existen
            $itemParentIds = [];
            if (isset($validated['items']) && is_array($validated['items'])) {
                foreach ($validated['items'] as $itemData) {
                    // Crear ItemParent con TODOS los campos mapeados correctamente
                    $itemParent = ItemParent::create([
                        'purchase_id' => $purchase->id,
                        'nombre' => $itemData['nombre'],
                        'categoria' => $itemData['categoria'],
                        'cantidad' => $itemData['cantidad'],
                        'unidad' => $itemData['unidad'] ?? 'unidades',
                        'valor_unitario' => $itemData['precioUnitario'] ?? 0,
                        'valor_total' => $itemData['precioTotal'] ?? 0,

                        // Campos específicos (ahora en columnas propias)
                        'codigo' => $itemData['codigo'] ?? null,
                        'descripcion' => $itemData['descripcion'] ?? null,
                        'variantes' => $itemData['variantes'] ?? [],
                        'atributos_comunes' => $itemData['atributos'] ?? [],
                        'fecha_ingreso' => $itemData['fechaIngreso'] ?? now(),
                        'estado' => $itemData['estado'] ?? 'Pendiente',
                        'ubicacion' => $itemData['ubicacion'] ?? null,
                        'responsable' => $itemData['responsable'] ?? null,
                    ]);

                    $itemParentIds[] = $itemParent->id;
                }

                // Actualizar el array de lotes en la compra
                $allLotes = array_merge($purchase->lotes ?? [], $itemParentIds);
                $purchase->update(['lotes' => $allLotes]);
            }

            DB::commit();

            // Recargar con relaciones
            $purchase->load('itemParents');

            return response()->json([
                'success' => true,
                'data' => $purchase,
                'message' => 'Compra creada exitosamente' . (count($itemParentIds) > 0 ? ' con ' . count($itemParentIds) . ' lote(s)' : '')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Error al crear la compra',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar compra
     */
    public function update(Request $request, $id): JsonResponse
    {
        $purchase = Purchase::find($id);

        if (!$purchase) {
            return response()->json([
                'success' => false,
                'message' => 'Compra no encontrada'
            ], 404);
        }

        $purchase->update($request->all());

        return response()->json([
            'success' => true,
            'data' => $purchase,
            'message' => 'Compra actualizada exitosamente'
        ]);
    }

    /**
     * Eliminar compra (soft delete)
     */
    public function destroy($id): JsonResponse
    {
        $purchase = Purchase::find($id);

        if (!$purchase) {
            return response()->json([
                'success' => false,
                'message' => 'Compra no encontrada'
            ], 404);
        }

        $purchase->delete();

        return response()->json([
            'success' => true,
            'message' => 'Compra eliminada exitosamente'
        ]);
    }

    /**
     * Generar items desde los lotes de una compra
     */
    public function generateItems($id): JsonResponse
    {
        try {
            $purchase = Purchase::find($id);

            if (!$purchase) {
                return response()->json([
                    'success' => false,
                    'message' => 'Compra no encontrada'
                ], 404);
            }

            $createdItems = [];
            $loteIds = $purchase->lotes ?? [];

            DB::transaction(function () use ($loteIds, $purchase, &$createdItems) {
                foreach ($loteIds as $loteId) {
                    $lote = ItemParent::find($loteId);
                    if (!$lote) continue;

                    // Generar items individuales
                    for ($i = 0; $i < $lote->cantidad; $i++) {
                        $item = Item::create([
                            'parent_id' => $lote->id,
                            'parent_batch_id' => $lote->id,
                            'purchase_id' => $purchase->id,
                            'nombre' => $lote->nombre . ' #' . ($i + 1),
                            'categoria' => $lote->categoria,
                            // SKU se genera automáticamente en el modelo Item::boot()
                            'estado' => 'Disponible',
                            'ubicacion' => $purchase->ubicacion_destino ?? 'Almacén',
                            'responsable' => null,
                            'valor_unitario' => $lote->valor_unitario,
                            'proveedor_id' => $purchase->proveedor_id,
                            'proveedor_nombre' => $purchase->proveedor_nombre,
                            'fecha_ingreso' => now(),
                        ]);

                        $item->addHistorialEntry(
                            'Generado desde compra',
                            'Sistema',
                            'Compra #' . $purchase->id
                        );

                        // Incluir la relación parent y parentBatch cargada
                        $createdItems[] = $item->load(['parent', 'parentBatch']);
                    }

                    // Actualizar totales del lote
                    $lote->updateTotales();
                }
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'count' => count($createdItems),
                    'items' => $createdItems
                ],
                'message' => count($createdItems) . ' ítems generados exitosamente'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Generar items individuales desde lotes específicos
     */
    public function generateItemsFromBatches(Request $request): JsonResponse
    {
        $request->validate([
            'purchase_id' => 'required|exists:purchases,id',
            'batch_ids' => 'required|array',
            'batch_ids.*' => 'exists:items_parents,id',
            'force_regenerate' => 'boolean'
        ]);

        $purchaseId = $request->purchase_id;
        $batchIds = $request->batch_ids;
        $forceRegenerate = $request->force_regenerate ?? false;

        try {
            // Verificar si la compra existe
            $purchase = Purchase::findOrFail($purchaseId);

            // Verificar si ya hay items generados (si no se fuerza regeneración)
            if (!$forceRegenerate) {
                $existingItems = Item::where('purchase_id', $purchaseId)->count();
                if ($existingItems > 0) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Ya existen items generados para esta compra. Use force_regenerate=true para regenerar.'
                    ], 400);
                }
            }

            // Obtener los lotes específicos
            $batches = ItemParent::whereIn('id', $batchIds)
                ->where('purchase_id', $purchaseId)
                ->get();

            if ($batches->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se encontraron lotes válidos para procesar'
                ], 400);
            }

            $createdItems = [];
            $totalItemsCreated = 0;

            DB::transaction(function () use ($batches, $purchase, $forceRegenerate, &$createdItems, &$totalItemsCreated) {
                foreach ($batches as $batch) {
                    // Verificar si ya tiene items generados (si no se fuerza regeneración)
                    if (!$forceRegenerate) {
                        $existingBatchItems = Item::where('parent_batch_id', $batch->id)->count();
                        if ($existingBatchItems > 0) {
                            continue; // Saltar este lote
                        }
                    } else {
                        // Si se fuerza regeneración, eliminar items existentes del lote
                        Item::where('parent_batch_id', $batch->id)->delete();
                    }

                    // Generar items para este lote
                    $batchItems = $this->generateItemsForBatch($batch, $purchase);
                    $createdItems = array_merge($createdItems, $batchItems);
                    $totalItemsCreated += count($batchItems);

                    // Actualizar totales del lote
                    $batch->updateTotales();
                }
            });

            return response()->json([
                'success' => true,
                'message' => "Ítems generados exitosamente: {$totalItemsCreated} items desde " . count($batches) . " lotes",
                'data' => [
                    'items_created' => $totalItemsCreated,
                    'batches_processed' => count($batches),
                    'batch_ids' => $batchIds,
                    'items' => $createdItems
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al generar items: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generar items para un lote específico
     */
    private function generateItemsForBatch($batch, $purchase)
    {
        $createdItems = [];

        // Procesar variantes si existen
        if ($batch->variantes && is_array($batch->variantes)) {
            foreach ($batch->variantes as $variante) {
                $cantidad = $variante['cantidad'] ?? 1;
                $nombreVariante = $variante['nombre'] ?? '';

                for ($i = 0; $i < $cantidad; $i++) {
                    $item = $this->createItemFromBatch($batch, $purchase, $i + 1, $nombreVariante);
                    $createdItems[] = $item;
                }
            }
        } else {
            // Sin variantes, generar por cantidad del lote
            $cantidad = $batch->cantidad ?? 1;

            for ($i = 0; $i < $cantidad; $i++) {
                $item = $this->createItemFromBatch($batch, $purchase, $i + 1);
                $createdItems[] = $item;
            }
        }

        return $createdItems;
    }

    /**
     * Crear un item individual desde un lote
     */
    private function createItemFromBatch($batch, $purchase, $itemNumber, $varianteNombre = '')
    {
        // Crear el item (SKU se genera automáticamente en el modelo Item::boot())
        $item = Item::create([
            'parent_id' => $batch->id,
            'parent_batch_id' => $batch->id,
            'purchase_id' => $purchase->id,
            'nombre' => $batch->nombre . ($varianteNombre ? " - {$varianteNombre}" : '') . " #{$itemNumber}",
            'categoria' => $batch->categoria,
            'codigo' => $batch->codigo ?? '',
            'estado' => 'Disponible',
            'ubicacion' => $batch->ubicacion ?? $purchase->ubicacion_destino ?? 'Almacén',
            'responsable' => null,
            'unidad' => $batch->unidad ?? 'unidades',
            'valor_unitario' => $batch->valor_unitario ?? 0,
            'atributos' => $batch->atributos_comunes ?? [],
            'proveedor_id' => $purchase->proveedor_id,
            'proveedor_nombre' => $purchase->proveedor_nombre,
            'fecha_ingreso' => $batch->fecha_ingreso ?? $purchase->fecha_compra ?? now(),
            'historial' => [
                [
                    'fecha' => now()->format('Y-m-d'),
                    'evento' => 'Generado desde lote de compra',
                    'responsable' => 'Sistema',
                    'detalles' => "Lote: {$batch->nombre}, Cantidad: {$batch->cantidad}"
                ]
            ]
        ]);

        // Devolver con relaciones parent y parentBatch
        return $item->load(['parent', 'parentBatch'])->toArray();
    }



    /**
     * Obtener estado de generación de items para una compra
     */
    public function getItemsStatus($purchaseId): JsonResponse
    {
        try {
            $purchase = Purchase::with('itemParents')->findOrFail($purchaseId);

            $batches = $purchase->itemParents;
            $expectedItems = 0;
            $generatedItems = 0;

            foreach ($batches as $batch) {
                // Calcular items esperados
                if ($batch->variantes && is_array($batch->variantes)) {
                    $expectedItems += collect($batch->variantes)->sum('cantidad');
                } else {
                    $expectedItems += $batch->cantidad;
                }

                // Contar items generados
                $generatedItems += Item::where('parent_batch_id', $batch->id)->count();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'purchase_id' => $purchase->id,
                    'total_batches' => $batches->count(),
                    'total_items_expected' => $expectedItems,
                    'items_generated' => $generatedItems,
                    'items_pending' => $expectedItems - $generatedItems,
                    'is_complete' => $generatedItems >= $expectedItems,
                    'message' => $generatedItems >= $expectedItems
                        ? "Todos los items fueron generados ({$generatedItems}/{$expectedItems})"
                        : "Items pendientes: " . ($expectedItems - $generatedItems) . " de {$expectedItems}"
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estado: ' . $e->getMessage()
            ], 500);
        }
    }
}
