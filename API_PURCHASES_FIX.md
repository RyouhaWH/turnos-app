# 🔧 Fix: Endpoint de Purchases (Compras)

## Problema Resuelto

El endpoint `GET /api/v1/purchases/{id}` estaba devolviendo un error genérico:

```json
{
  "success": false,
  "message": "Server Error",
  "error": "HTTP_ERROR"
}
```

## Solución Implementada

Se mejoró el `PurchaseController` con:
1. ✅ Manejo de errores robusto con try-catch
2. ✅ Formato de respuesta consistente
3. ✅ Carga correcta de relaciones (provider, itemParents)
4. ✅ Mensajes de error descriptivos

---

## Endpoints de Purchases Actualizados

### 1️⃣ Listar Todas las Compras

**GET** `/api/v1/purchases`

#### Respuesta (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "proveedor_id": 2,
      "proveedor_nombre": "Proveedor XYZ",
      "fecha_compra": "2024-01-15",
      "tipo_documento": "Factura",
      "numero_documento": "F-001234",
      "tipo_compra": "Inventario",
      "responsable": "Juan Pérez",
      "monto_total": "150000.00",
      "observaciones": "Compra de equipos",
      "created_at": "2024-01-15 10:30:00",
      "provider": {
        "id": 2,
        "nombre": "Proveedor XYZ",
        "rut": "12345678-9"
      }
    }
  ]
}
```

#### Error (500)
```json
{
  "success": false,
  "message": "Error al obtener las compras",
  "error": "Descripción del error específico"
}
```

---

### 2️⃣ Obtener Compra por ID

**GET** `/api/v1/purchases/{id}`

#### Respuesta Exitosa (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "proveedor_id": 2,
    "proveedor_nombre": "Proveedor XYZ",
    "fecha_compra": "2024-01-15",
    "tipo_documento": "Factura",
    "numero_documento": "F-001234",
    "tipo_compra": "Inventario",
    "responsable": "Juan Pérez",
    "ubicacion_destino": "Bodega Principal",
    "monto_total": "150000.00",
    "observaciones": "Compra de equipos de oficina",
    "documentos": ["factura.pdf", "guia.pdf"],
    "lotes": [1, 2, 3],
    "created_at": "2024-01-15 10:30:00",
    "updated_at": "2024-01-15 10:30:00",
    "provider": {
      "id": 2,
      "nombre": "Proveedor XYZ",
      "rut": "12345678-9",
      "contacto": "+56912345678"
    },
    "item_parents": [
      {
        "id": 1,
        "nombre": "Notebook HP",
        "categoria": "Computación",
        "cantidad": 10,
        "unidad": "unidades",
        "valor_unitario": "500000.00",
        "valor_total": "5000000.00",
        "totales": {
          "cantidad": 10,
          "asignados": 3,
          "disponibles": 7,
          "baja": 0
        }
      }
    ]
  }
}
```

#### Compra No Encontrada (404)
```json
{
  "success": false,
  "message": "Compra no encontrada"
}
```

#### Error del Servidor (500)
```json
{
  "success": false,
  "message": "Error al obtener la compra",
  "error": "Descripción detallada del error"
}
```

---

### 3️⃣ Crear Nueva Compra

**POST** `/api/v1/purchases`

#### Request Body
```json
{
  "proveedor_id": 2,
  "proveedor_nombre": "Proveedor XYZ",
  "fecha_compra": "2024-01-15",
  "tipo_documento": "Factura",
  "numero_documento": "F-001234",
  "tipo_compra": "Inventario",
  "responsable": "Juan Pérez",
  "ubicacion_destino": "Bodega Principal",
  "monto_total": 150000.00,
  "observaciones": "Compra urgente",
  "documentos": ["factura.pdf"],
  "lotes": [1, 2]
}
```

#### Respuesta (201)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "proveedor_id": 2,
    "proveedor_nombre": "Proveedor XYZ",
    ...
  },
  "message": "Compra creada exitosamente"
}
```

---

### 4️⃣ Actualizar Compra

**PUT/PATCH** `/api/v1/purchases/{id}`

#### Request Body
```json
{
  "observaciones": "Nueva observación",
  "monto_total": 175000.00
}
```

#### Respuesta (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    ...
  },
  "message": "Compra actualizada exitosamente"
}
```

---

### 5️⃣ Eliminar Compra

**DELETE** `/api/v1/purchases/{id}`

#### Respuesta (200)
```json
{
  "success": true,
  "message": "Compra eliminada exitosamente"
}
```

---

### 6️⃣ Generar Items desde Compra

**POST** `/api/v1/purchases/{id}/generate-items`

Este endpoint genera items individuales desde los lotes asociados a una compra.

#### Respuesta (200)
```json
{
  "success": true,
  "data": {
    "count": 15,
    "items": [
      {
        "id": 101,
        "parent_id": 1,
        "nombre": "Notebook HP #1",
        "sku": "COM-1-1-0001",
        "estado": "Disponible",
        ...
      },
      ...
    ]
  },
  "message": "15 ítems generados exitosamente"
}
```

#### Error (400)
```json
{
  "success": false,
  "message": "Descripción del error específico"
}
```

---

## Ejemplos de Uso

### JavaScript/Fetch

```javascript
const API_BASE = 'http://localhost:8000/api/v1';
const token = 'tu-token-aqui';

// Obtener todas las compras
async function getPurchases() {
    try {
        const response = await fetch(`${API_BASE}/purchases`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('Compras:', result.data);
            return result.data;
        } else {
            console.error('Error:', result.message);
            return [];
        }
    } catch (error) {
        console.error('Error de red:', error);
        return [];
    }
}

// Obtener compra por ID
async function getPurchaseById(id) {
    try {
        const response = await fetch(`${API_BASE}/purchases/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('Compra:', result.data);
            return result.data;
        } else if (response.status === 404) {
            console.error('Compra no encontrada');
            return null;
        } else {
            console.error('Error:', result.message);
            console.error('Detalle:', result.error);
            return null;
        }
    } catch (error) {
        console.error('Error de red:', error);
        return null;
    }
}

// Crear nueva compra
async function createPurchase(purchaseData) {
    try {
        const response = await fetch(`${API_BASE}/purchases`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(purchaseData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('Compra creada:', result.data);
            return result.data;
        } else {
            console.error('Error:', result.message);
            return null;
        }
    } catch (error) {
        console.error('Error de red:', error);
        return null;
    }
}

// Generar items desde compra
async function generateItems(purchaseId) {
    try {
        const response = await fetch(`${API_BASE}/purchases/${purchaseId}/generate-items`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log(`${result.data.count} items generados`);
            return result.data.items;
        } else {
            console.error('Error:', result.message);
            return [];
        }
    } catch (error) {
        console.error('Error de red:', error);
        return [];
    }
}
```

### React con Axios

```javascript
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
    }
});

// Hook para obtener compras
function usePurchases() {
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        async function fetchPurchases() {
            try {
                const { data } = await api.get('/purchases');
                if (data.success) {
                    setPurchases(data.data);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Error al cargar compras');
            } finally {
                setLoading(false);
            }
        }
        fetchPurchases();
    }, []);
    
    return { purchases, loading, error };
}

// Hook para obtener una compra por ID
function usePurchase(id) {
    const [purchase, setPurchase] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        async function fetchPurchase() {
            try {
                const { data } = await api.get(`/purchases/${id}`);
                if (data.success) {
                    setPurchase(data.data);
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Error al cargar compra');
            } finally {
                setLoading(false);
            }
        }
        
        if (id) {
            fetchPurchase();
        }
    }, [id]);
    
    return { purchase, loading, error };
}
```

---

## Campos de la Compra

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | integer | ID único de la compra |
| `proveedor_id` | integer | ID del proveedor |
| `proveedor_nombre` | string | Nombre del proveedor |
| `fecha_compra` | date | Fecha de la compra (YYYY-MM-DD) |
| `tipo_documento` | string | Tipo de documento (Factura, Boleta, etc) |
| `numero_documento` | string | Número del documento |
| `tipo_compra` | string | Tipo de compra |
| `responsable` | string | Persona responsable |
| `ubicacion_destino` | string | Ubicación de destino |
| `monto_total` | decimal | Monto total de la compra |
| `observaciones` | text | Observaciones adicionales |
| `documentos` | array | Array de archivos adjuntos |
| `lotes` | array | Array de IDs de lotes asociados |

---

## Testing con cURL

```bash
# Obtener todas las compras
curl "http://localhost:8000/api/v1/purchases" \
  -H "Authorization: Bearer TOKEN"

# Obtener compra por ID
curl "http://localhost:8000/api/v1/purchases/1" \
  -H "Authorization: Bearer TOKEN"

# Crear compra
curl -X POST "http://localhost:8000/api/v1/purchases" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proveedor_id": 1,
    "fecha_compra": "2024-01-15",
    "tipo_documento": "Factura",
    "numero_documento": "F-001",
    "monto_total": 100000
  }'

# Generar items
curl -X POST "http://localhost:8000/api/v1/purchases/1/generate-items" \
  -H "Authorization: Bearer TOKEN"
```

---

## Notas Importantes

1. ✅ Ahora el endpoint **siempre devuelve un objeto con `success`** para indicar el estado
2. ✅ Los **errores son descriptivos** y muestran el mensaje real del problema
3. ✅ Las **fechas están formateadas** correctamente (YYYY-MM-DD)
4. ✅ Se **cargan las relaciones** (provider, itemParents) automáticamente
5. ✅ Los **item_parents incluyen totales** de asignación

---

**Fix implementado**: Octubre 2025



