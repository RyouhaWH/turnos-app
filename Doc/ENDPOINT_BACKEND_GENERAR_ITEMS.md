# 🚀 Endpoint Backend: Generar Items desde Lotes

## 🎯 Problema Identificado

**Frontend actual:** Genera items uno por uno llamando `api.createItem()` para cada item, lo que puede crear duplicados si el usuario presiona el botón varias veces.

**Solución:** Crear endpoint específico en Laravel que procese lotes completos y evite duplicados.

## 📋 Endpoint Requerido

### Ruta: `POST /api/v1/purchases/generate-items-from-batches`

### Payload Enviado:
```json
{
  "purchase_id": 5,
  "batch_ids": [1, 2, 3],
  "force_regenerate": false
}
```

### Respuesta Esperada:
```json
{
  "success": true,
  "message": "Ítems generados exitosamente",
  "data": {
    "items_created": 15,
    "batches_processed": 3,
    "batch_ids": [1, 2, 3],
    "items": [
      {
        "id": 101,
        "sku": "PANT-5-1-0001",
        "nombre": "Pantalón Corporate Fit #1",
        "parent_batch_id": 1,
        "purchase_id": 5
      }
      // ... más items
    ]
  }
}
```

## 🔧 Implementación en Laravel

### 1. Controlador: `PurchaseController.php`

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

        foreach ($batches as $batch) {
            // Verificar si ya tiene items generados (si no se fuerza regeneración)
            if (!$forceRegenerate) {
                $existingBatchItems = Item::where('parent_batch_id', $batch->id)->count();
                if ($existingBatchItems > 0) {
                    continue; // Saltar este lote
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
```

### 2. Ruta en `routes/api.php`

```php
Route::post('/purchases/generate-items-from-batches', [PurchaseController::class, 'generateItemsFromBatches']);
```

### 3. Middleware de Autenticación

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/purchases/generate-items-from-batches', [PurchaseController::class, 'generateItemsFromBatches']);
});
```

## 🔍 Validaciones Implementadas

### 1. **Verificación de Duplicados:**
- Verifica si ya existen items para la compra
- Verifica si ya existen items para cada lote específico
- Solo procesa lotes que no tengan items generados

### 2. **Validación de Datos:**
- `purchase_id`: Debe existir en la tabla `purchases`
- `batch_ids`: Array de IDs que deben existir en `items_parents`
- `force_regenerate`: Boolean para forzar regeneración

### 3. **Integridad de Datos:**
- Solo procesa lotes que pertenezcan a la compra especificada
- Genera SKUs únicos para cada item
- Mantiene relación con lote padre y compra

## 🎯 Beneficios de Esta Implementación

### ✅ Para el Frontend:
- **Una sola llamada** en lugar de múltiples `createItem()`
- **Información específica** de qué lotes procesar
- **Prevención de duplicados** automática
- **Respuesta detallada** del resultado

### ✅ Para el Backend:
- **Control total** sobre la generación de items
- **Validaciones robustas** de duplicados
- **Generación atómica** (todo o nada)
- **Logs centralizados** de la operación

### ✅ Para el Sistema:
- **Consistencia** en SKUs generados
- **Integridad** de datos
- **Performance** mejorada
- **Escalabilidad** para múltiples usuarios

## 🧪 Casos de Prueba

### Caso 1: Primera Generación
```json
POST /api/v1/purchases/generate-items-from-batches
{
  "purchase_id": 5,
  "batch_ids": [1, 2, 3],
  "force_regenerate": false
}
```
**Resultado:** Genera todos los items de los lotes 1, 2, 3

### Caso 2: Segunda Generación (Sin Force)
```json
POST /api/v1/purchases/generate-items-from-batches
{
  "purchase_id": 5,
  "batch_ids": [1, 2, 3],
  "force_regenerate": false
}
```
**Resultado:** Error - "Ya existen items generados"

### Caso 3: Regeneración Forzada
```json
POST /api/v1/purchases/generate-items-from-batches
{
  "purchase_id": 5,
  "batch_ids": [1, 2, 3],
  "force_regenerate": true
}
```
**Resultado:** Regenera todos los items (elimina anteriores)

### Caso 4: Lotes Específicos
```json
POST /api/v1/purchases/generate-items-from-batches
{
  "purchase_id": 5,
  "batch_ids": [2, 3],
  "force_regenerate": false
}
```
**Resultado:** Solo procesa lotes 2 y 3 (si no tienen items)

## 📊 Migración del Frontend

### Antes (Problemático):
```typescript
// Generaba items uno por uno
for (const batch of batches) {
  for (let i = 0; i < cantidad; i++) {
    await api.createItem(newItem); // ❌ Múltiples llamadas
  }
}
```

### Después (Mejorado):
```typescript
// Una sola llamada con IDs específicos
const payload = {
  purchase_id: purchaseId,
  batch_ids: batchIds,
  force_regenerate: false
};

const response = await apiClient.post('/purchases/generate-items-from-batches', payload);
```

## 🚀 Implementación Inmediata

### Paso 1: Crear el Endpoint
1. Agregar método en `PurchaseController`
2. Agregar ruta en `routes/api.php`
3. Probar con Postman/Insomnia

### Paso 2: Actualizar Frontend
1. ✅ Ya implementado: `generateItemsFromBatchesV2()`
2. ✅ Ya actualizado: `PurchaseDetail.tsx`

### Paso 3: Testing
1. Crear compra con lotes
2. Generar items (primera vez)
3. Intentar generar otra vez (debe fallar)
4. Verificar en BD que no hay duplicados

## 📝 Notas Importantes

1. **Campo `items_generados`:** Marcar en la tabla `purchases` cuando se complete la generación
2. **SKUs únicos:** El backend debe garantizar unicidad
3. **Transacciones:** Usar DB transactions para operaciones atómicas
4. **Logs:** Registrar todas las operaciones para auditoría

---

## ✅ Checklist de Implementación

- [ ] Crear método `generateItemsFromBatches()` en `PurchaseController`
- [ ] Agregar ruta `/purchases/generate-items-from-batches`
- [ ] Implementar validaciones de duplicados
- [ ] Crear métodos helper para generar items
- [ ] Implementar generación de SKUs únicos
- [ ] Agregar middleware de autenticación
- [ ] Probar con datos reales
- [ ] Verificar que no se generen duplicados

**¡Una vez implementado este endpoint, el frontend dejará de generar duplicados!** 🎉
