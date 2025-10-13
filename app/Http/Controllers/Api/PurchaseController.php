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
        $purchase = Purchase::create($request->validated());

        return response()->json([
            'success' => true,
            'data' => $purchase,
            'message' => 'Compra creada exitosamente'
        ], 201);
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
                            'sku' => strtoupper(substr($lote->categoria, 0, 3)) . '-' . $purchase->id . '-' . $lote->id . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
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

                        $createdItems[] = $item;
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
}
