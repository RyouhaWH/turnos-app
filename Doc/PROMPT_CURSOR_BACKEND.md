# 🚀 Implementar Endpoints para Generación de Items desde Lotes

Necesito implementar un endpoint en Laravel que evite que el frontend genere items duplicados. El frontend envía IDs de lotes específicos y el backend debe generar todos los items de una vez.

## 📋 ENDPOINT REQUERIDO

**Ruta:** `POST /api/v1/purchases/generate-items-from-batches`

**Payload que envía el frontend:**
```json
{
  "purchase_id": 5,
  "batch_ids": [1, 2, 3],
  "force_regenerate": false
}
```

## 🔧 IMPLEMENTACIÓN

### 1. Agregar ruta en `routes/api.php`:

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/purchases/generate-items-from-batches', [PurchaseController::class, 'generateItemsFromBatches']);
    Route::get('/purchases/{id}/items-status', [PurchaseController::class, 'getItemsStatus']);
});
```

### 2. Agregar métodos en `PurchaseController.php`:

```php
/**
 * Generar items individuales desde lotes específicos
 */
public function generateItemsFromBatches(Request $request)
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
        $purchase = Purchase::findOrFail($purchaseId);
        
        // Verificar si ya hay items generados
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

        DB::beginTransaction();

        foreach ($batches as $batch) {
            // Verificar si ya tiene items generados
            if (!$forceRegenerate) {
                $existingBatchItems = Item::where('parent_batch_id', $batch->id)->count();
                if ($existingBatchItems > 0) {
                    continue;
                }
            }

            // Generar items para este lote
            $batchItems = $this->generateItemsForBatch($batch, $purchase);
            $createdItems = array_merge($createdItems, $batchItems);
            $totalItemsCreated += count($batchItems);
        }

        // Marcar la compra como procesada
        $purchase->update([
            'items_generados' => true,
            'updated_at' => now()
        ]);

        DB::commit();

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
        DB::rollBack();
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
    // Generar SKU único
    $sku = $this->generateSku($batch->categoria, $purchase->id, $batch->id, $itemNumber);
    
    // Crear el item
    $item = Item::create([
        'parent_batch_id' => $batch->id,
        'purchase_id' => $purchase->id,
        'nombre' => $batch->nombre . ($varianteNombre ? " - {$varianteNombre}" : '') . " #{$itemNumber}",
        'categoria' => $batch->categoria,
        'sku' => $sku,
        'codigo' => $batch->codigo ?? '',
        'estado' => 'Disponible',
        'ubicacion' => $batch->ubicacion ?? $purchase->ubicacion_destino ?? 'Almacén',
        'responsable' => null,
        'unidad' => $batch->unidad ?? 'unidades',
        'valor_unitario' => $batch->valor_unitario ?? 0,
        'atributos' => $batch->atributos ?? [],
        'proveedor_id' => $purchase->proveedor_id,
        'proveedor_nombre' => $purchase->proveedor_nombre,
        'fecha_ingreso' => $batch->fecha_ingreso ?? $purchase->fecha_compra,
        'historial' => [
            [
                'fecha' => now()->format('Y-m-d'),
                'evento' => 'Generado desde lote de compra',
                'responsable' => 'Sistema',
                'detalles' => "Lote: {$batch->nombre}, Cantidad: {$batch->cantidad}"
            ]
        ]
    ]);
    
    return $item->toArray();
}

/**
 * Generar SKU único para un item
 */
private function generateSku($categoria, $purchaseId, $batchId, $itemNumber)
{
    $categoriaPrefix = strtoupper(substr($categoria, 0, 3));
    return sprintf('%s-%d-%d-%04d', $categoriaPrefix, $purchaseId, $batchId, $itemNumber);
}

/**
 * Obtener estado de generación de items para una compra
 */
public function getItemsStatus($purchaseId)
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
```

## 📊 MODELO ITEM REQUERIDO

Asegúrate de que el modelo `Item` tenga el campo `parent_batch_id`:

```php
// En app/Models/Item.php
protected $fillable = [
    'parent_batch_id',     // Campo para vincular con lote padre
    'purchase_id',
    'nombre',
    'categoria',
    'sku',
    'estado',
    'ubicacion',
    'responsable',
    'valor_unitario',
    'atributos',
    'historial',
    // ... otros campos
];

protected $casts = [
    'atributos' => 'array',
    'historial' => 'array',
    'valor_unitario' => 'decimal:2'
];

// Relación con lote padre
public function parentBatch()
{
    return $this->belongsTo(ItemParent::class, 'parent_batch_id');
}
```

## 🗄️ MIGRACIÓN REQUERIDA

Si no existe el campo `parent_batch_id` en la tabla `items`:

```bash
php artisan make:migration add_parent_batch_id_to_items_table
```

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('items', function (Blueprint $table) {
            if (!Schema::hasColumn('items', 'parent_batch_id')) {
                $table->unsignedBigInteger('parent_batch_id')->nullable()->after('id');
                $table->foreign('parent_batch_id')->references('id')->on('items_parents')->onDelete('set null');
                $table->index(['parent_batch_id', 'purchase_id']);
            }
        });
    }

    public function down()
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropForeign(['parent_batch_id']);
            $table->dropIndex(['parent_batch_id', 'purchase_id']);
            $table->dropColumn('parent_batch_id');
        });
    }
};
```

## 🧪 TESTING

```bash
# Probar endpoint
curl -X POST "http://localhost:8000/api/v1/purchases/generate-items-from-batches" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purchase_id": 1,
    "batch_ids": [1, 2, 3],
    "force_regenerate": false
  }'

# Verificar estado
curl "http://localhost:8000/api/v1/purchases/1/items-status" \
  -H "Authorization: Bearer TU_TOKEN"
```

## ✅ RESULTADO ESPERADO

- **Previene duplicados:** No genera items si ya existen
- **Genera SKUs únicos:** Formato `CAT-PURCHASE-BATCH-NUMBER`
- **Vinculación correcta:** Items vinculados con `parent_batch_id`
- **Transacciones:** Operación atómica (todo o nada)
- **Respuesta detallada:** Información completa del resultado

**¡Esto resolverá el problema de duplicados en el frontend!**
