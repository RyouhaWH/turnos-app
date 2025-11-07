# 🚀 Endpoint Backend: Crear ItemParent con Ítems Hijos Automáticos

## 🎯 Objetivo

Crear un endpoint que permita crear un lote padre (`ItemParent`) y generar automáticamente todos los ítems hijos individuales en una sola transacción atómica.

## 📋 Endpoint Requerido

### Ruta: `POST /api/v1/items-parents/with-items`

### Payload Enviado:
```json
{
  "nombre": "Pantalón Corporate Fit 2025",
  "categoriaId": 1,
  "proveedorId": 2,
  "fechaIngreso": "2025-01-15",
  "valorUnitario": 25000,
  "ubicacion": "Almacén Central",
  "responsable": "Juan Pérez",
  "atributosComunes": [
    {"nombre": "marca", "valor": "Nike"},
    {"nombre": "material", "valor": "Algodón"}
  ],
  "desglose": [
    {
      "variantes": [
        {"atributo": "talla", "valor": "S"},
        {"atributo": "color", "valor": "Azul"}
      ],
      "cantidad": 5
    },
    {
      "variantes": [
        {"atributo": "talla", "valor": "M"},
        {"atributo": "color", "valor": "Rojo"}
      ],
      "cantidad": 3
    }
  ],
  "documentosLote": [],
  "totales": {
    "cantidad": 8,
    "asignados": 0,
    "disponibles": 8,
    "baja": 0
  },
  "generateItems": true
}
```

### Respuesta Esperada:
```json
{
  "success": true,
  "message": "Lote padre e ítems hijos creados exitosamente",
  "data": {
    "lote": {
      "id": 123,
      "nombre": "Pantalón Corporate Fit 2025",
      "categoria": "Ropa",
      "proveedor_id": 2,
      "cantidad": 8,
      "fecha_ingreso": "2025-01-15",
      "responsable": "Juan Pérez",
      "valor_unitario": 25000,
      "ubicacion": "Almacén Central",
      "created_at": "2025-01-15T10:30:00Z"
    },
    "items_created": 8,
    "items": [
      {
        "id": 1001,
        "sku": "ROP-123-001",
        "nombre": "Pantalón Corporate Fit 2025 - S Azul #1",
        "parent_batch_id": 123,
        "categoria": "Ropa",
        "estado": "Disponible",
        "ubicacion": "Almacén Central",
        "valor_unitario": 25000,
        "atributos": {
          "marca": "Nike",
          "material": "Algodón",
          "talla": "S",
          "color": "Azul"
        }
      },
      {
        "id": 1002,
        "sku": "ROP-123-002",
        "nombre": "Pantalón Corporate Fit 2025 - S Azul #2",
        "parent_batch_id": 123,
        "categoria": "Ropa",
        "estado": "Disponible",
        "ubicacion": "Almacén Central",
        "valor_unitario": 25000,
        "atributos": {
          "marca": "Nike",
          "material": "Algodón",
          "talla": "S",
          "color": "Azul"
        }
      }
      // ... más ítems hasta llegar a 8
    ]
  }
}
```

## 🔧 Implementación en Laravel

### 1. Agregar ruta en `routes/api.php`:

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/items-parents/with-items', [ItemParentController::class, 'createWithItems']);
});
```

### 2. Método en `ItemParentController.php`:

```php
/**
 * Crear ItemParent y generar ítems hijos automáticamente
 */
public function createWithItems(Request $request)
{
    $request->validate([
        'nombre' => 'required|string|max:255',
        'categoriaId' => 'required|exists:categories,id',
        'proveedorId' => 'required|exists:providers,id',
        'fechaIngreso' => 'required|date',
        'ubicacion' => 'required|string|max:255',
        'responsable' => 'nullable|string|max:255',
        'valorUnitario' => 'nullable|numeric|min:0',
        'atributosComunes' => 'nullable|array',
        'desglose' => 'required|array|min:1',
        'desglose.*.variantes' => 'required|array',
        'desglose.*.cantidad' => 'required|integer|min:1',
        'generateItems' => 'boolean'
    ]);

    try {
        DB::beginTransaction();

        // Obtener información de categoría y proveedor
        $categoria = Category::findOrFail($request->categoriaId);
        $proveedor = Provider::findOrFail($request->proveedorId);

        // Crear el lote padre
        $itemParent = ItemParent::create([
            'nombre' => $request->nombre,
            'categoria' => $categoria->nombre,
            'categoria_id' => $categoria->id,
            'proveedor' => $proveedor->nombre,
            'proveedor_id' => $proveedor->id,
            'fecha_ingreso' => $request->fechaIngreso,
            'responsable' => $request->responsable,
            'valor_unitario' => $request->valorUnitario,
            'ubicacion' => $request->ubicacion,
            'cantidad' => $request->totales['cantidad'] ?? 0,
            'estado' => 'Procesado'
        ]);

        $createdItems = [];
        $itemCounter = 0;

        // Generar ítems individuales desde el desglose
        foreach ($request->desglose as $desgloseItem) {
            $cantidad = $desgloseItem['cantidad'];
            $variantes = $desgloseItem['variantes'];

            // Construir atributos específicos de la variante
            $atributosVariante = [];
            foreach ($variantes as $variante) {
                if (!empty($variante['atributo']) && !empty($variante['valor'])) {
                    $atributosVariante[strtolower($variante['atributo'])] = $variante['valor'];
                }
            }

            // Crear cada ítem individual
            for ($i = 0; $i < $cantidad; $i++) {
                $itemCounter++;
                
                // Generar SKU único
                $categoriaPrefix = strtoupper(substr($categoria->nombre, 0, 3));
                $sku = "{$categoriaPrefix}-{$itemParent->id}-" . str_pad($itemCounter, 3, '0', STR_PAD_LEFT);
                
                // Generar nombre específico del ítem
                $varianteText = implode(' ', $atributosVariante);
                $nombreItem = $request->nombre . ($varianteText ? " - {$varianteText}" : '') . " #{$itemCounter}";

                // Combinar atributos comunes con atributos específicos de la variante
                $atributosCompletos = [];
                
                // Agregar atributos comunes
                if ($request->has('atributosComunes')) {
                    foreach ($request->atributosComunes as $attr) {
                        if (!empty($attr['nombre']) && !empty($attr['valor'])) {
                            $atributosCompletos[$attr['nombre']] = $attr['valor'];
                        }
                    }
                }
                
                // Agregar atributos de variante
                $atributosCompletos = array_merge($atributosCompletos, $atributosVariante);

                // Crear el ítem
                $item = Item::create([
                    'parent_batch_id' => $itemParent->id,
                    'nombre' => $nombreItem,
                    'categoria' => $categoria->nombre,
                    'sku' => $sku,
                    'estado' => 'Disponible',
                    'ubicacion' => $request->ubicacion,
                    'responsable' => $request->responsable,
                    'valor_unitario' => $request->valorUnitario,
                    'atributos' => !empty($atributosCompletos) ? json_encode($atributosCompletos) : null,
                    'proveedor_id' => $proveedor->id,
                    'proveedor_nombre' => $proveedor->nombre,
                    'fecha_ingreso' => $request->fechaIngreso
                ]);

                // Agregar entrada al historial
                $item->addHistorialEntry(
                    'Generado desde lote padre',
                    $request->responsable ?? 'Sistema',
                    'Lote #' . $itemParent->id
                );

                $createdItems[] = $item;
            }
        }

        // Actualizar totales del lote padre
        $itemParent->update([
            'cantidad' => count($createdItems),
            'valor_total' => $request->valorUnitario ? $request->valorUnitario * count($createdItems) : null
        ]);

        DB::commit();

        return response()->json([
            'success' => true,
            'message' => "Lote padre e ítems hijos creados exitosamente: {$itemParent->id}",
            'data' => [
                'lote' => $itemParent,
                'items_created' => count($createdItems),
                'items' => $createdItems
            ]
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        
        return response()->json([
            'success' => false,
            'message' => 'Error al crear lote padre e ítems: ' . $e->getMessage()
        ], 500);
    }
}
```

### 3. Método helper en el modelo `Item`:

```php
// En app/Models/Item.php
public function addHistorialEntry($evento, $responsable, $observaciones = null)
{
    $historial = $this->historial ?? [];
    
    $historial[] = [
        'fecha' => now()->toISOString(),
        'evento' => $evento,
        'responsable' => $responsable,
        'observaciones' => $observaciones
    ];
    
    $this->update(['historial' => $historial]);
}
```

## ✅ Ventajas de esta Implementación

1. **🔄 Transacción Atómica**: Todo o nada - si falla algo, se hace rollback completo
2. **⚡ Una sola llamada**: El frontend hace una sola petición HTTP
3. **🛡️ Consistencia**: Garantiza que no queden datos parciales
4. **📊 Performance**: El backend procesa todo en memoria
5. **🔒 Seguridad**: Validación completa en el backend
6. **📝 Logging**: Historial completo de cada ítem creado

## 🎯 Flujo Completo

1. **Frontend envía** el payload completo con `generateItems: true`
2. **Backend valida** todos los datos
3. **Crea el lote padre** en la base de datos
4. **Genera todos los ítems hijos** según el desglose
5. **Asigna SKUs únicos** automáticamente
6. **Combina atributos** comunes + específicos de variante
7. **Actualiza totales** del lote padre
8. **Retorna información completa** del lote y ítems creados

¡Esta implementación es mucho más robusta, eficiente y segura que hacerlo en el frontend! 🚀
