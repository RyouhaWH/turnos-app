# Endpoint de Estado de Empleados con API Key

## 📋 Descripción

Este endpoint permite acceder a la información de turnos y estado de funcionarios del día (o de una fecha específica) sin necesidad de estar autenticado en la aplicación. En su lugar, utiliza una **API Key** para autenticación.

Es ideal para sistemas externos que necesiten consultar el estado de los empleados en tiempo real.

---

## 🔐 Autenticación

El endpoint utiliza **API Keys** para autenticación en lugar de sesiones de usuario o tokens JWT.

### Generar una API Key

**Solo los administradores del sistema pueden generar API Keys.**

Puedes generar una API Key desde Artisan usando:

```bash
php artisan api-key:create
```

O crear una directamente en la base de datos:

```bash
php artisan tinker

# Dentro de tinker:
$apiKey = \App\Models\ApiKey::create([
    'name' => 'Sistema Externo 1',
    'key' => \App\Models\ApiKey::generateKey(),
    'description' => 'Acceso desde sistema de recursos humanos',
    'is_active' => true,
    'expired_at' => null  // null para sin expiración
]);
```

---

## 📡 Endpoint

### URL
```
GET /api/v1/employee-status-external
```

### Parámetros de Query

| Parámetro | Tipo   | Requerido | Descripción                              |
|-----------|--------|-----------|------------------------------------------|
| `date`    | string | No        | Fecha en formato `YYYY-MM-DD` (por defecto: hoy) |
| `api_key` | string | No*       | API Key (alternativa: enviar en headers)  |

**Nota:** La API Key puede enviarse de dos formas:
1. En el header: `X-API-Key: <tu_api_key>`
2. Como parámetro de query: `?api_key=<tu_api_key>`

Se recomienda usar el header por seguridad.

---

## 📤 Ejemplos de Uso

### Usando cURL (Header)
```bash
curl -X GET "http://192.168.1.20:8000/api/v1/employee-status-external?date=2026-03-11" \
  -H "X-API-Key: turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890"
```

### Usando cURL (Query Parameter)
```bash
curl -X GET "http://192.168.1.20:8000/api/v1/employee-status-external?date=2026-03-11&api_key=turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890"
```

### Usando JavaScript/Fetch
```javascript
const apiKey = 'turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890';
const date = '2026-03-11';

fetch(`/api/v1/employee-status-external?date=${date}`, {
  method: 'GET',
  headers: {
    'X-API-Key': apiKey
  }
})
.then(response => response.json())
.then(data => {
  console.log('Estado de empleados:', data);
})
.catch(error => console.error('Error:', error));
```

### Usando Python
```python
import requests
from datetime import date

api_key = 'turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890'
current_date = date.today().isoformat()

headers = {
    'X-API-Key': api_key
}

params = {
    'date': current_date
}

response = requests.get(
    'http://192.168.1.20:8000/api/v1/employee-status-external',
    headers=headers,
    params=params
)

data = response.json()
print(f"Estado de empleados: {data}")
```

### Usando PHP
```php
<?php
$apiKey = 'turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890';
$date = '2026-03-11';
$url = "http://192.168.1.20:8000/api/v1/employee-status-external?date=$date";

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => "X-API-Key: $apiKey\r\n"
    ]
]);

$response = file_get_contents($url, false, $context);
$data = json_decode($response, true);

print_r($data);
?>
```

---

## ✅ Respuesta Exitosa (200 OK)

```json
{
  "success": true,
  "date": "2026-03-11",
  "data": {
    "status": {
      "trabajando": [
        {
          "id": 1,
          "name": "Juan",
          "paternal_lastname": "Pérez",
          "rol_id": 1,
          "amzoma": false,
          "shift": "M",
          "shift_label": "Mañana",
          "is_extra": false,
          "base_shift": "M"
        },
        {
          "id": 3,
          "name": "María",
          "paternal_lastname": "González",
          "rol_id": 2,
          "amzoma": true,
          "shift": "1e",
          "shift_label": "1er Turno (Extra)",
          "is_extra": true,
          "base_shift": "1"
        }
      ],
      "descanso": [
        {
          "id": 2,
          "name": "Carlos",
          "paternal_lastname": "López",
          "rol_id": 1,
          "amzoma": false,
          "shift": "F",
          "shift_label": "Franco"
        }
      ],
      "ausente": [
        {
          "id": 4,
          "name": "Ana",
          "paternal_lastname": "Martínez",
          "rol_id": 3,
          "amzoma": false,
          "shift": "V",
          "shift_label": "Vacaciones"
        }
      ],
      "sinTurno": []
    },
    "counts": {
      "trabajando": {
        "total": 2,
        "byRole": {
          "1": 1,
          "2": 1
        }
      },
      "descanso": {
        "total": 1,
        "byRole": {
          "1": 1
        }
      },
      "ausente": {
        "total": 1,
        "byRole": {
          "3": 1
        }
      },
      "sinTurno": {
        "total": 0,
        "byRole": {}
      }
    },
    "totalActivos": 4,
    "totalEmpleados": 4,
    "roles": {
      "1": "Alerta Móvil",
      "2": "Fiscalización",
      "3": "Motorizado"
    },
    "roleColors": {
      "1": "#3B82F6",
      "2": "#10B981",
      "3": "#F59E0B"
    }
  },
  "definitions": {
    "trabajando": "Turnos de trabajo: M, T, N, 1, 2, 3, 1e, 2e, 3e, 1E, 2E, 3E, Me, Te, Ne, ME, TE, NE",
    "descanso": "Descansos programados: F (Franco), L (Libre)",
    "ausente": "Ausencias programadas: V (Vacaciones), LM (Licencia Médica), S (Sindical), A (Día Administrativo)",
    "sinTurno": "Sin turno asignado = NO ACTIVOS hoy",
    "activos": "trabajando + descanso + ausente (tienen turno asignado)",
    "inactivos": "sinTurno (no tienen turno asignado)",
    "operational_roles": "Solo se cuentan roles operativos: Alerta Móvil (1), Fiscalización (2), Motorizado (3), Dron (5), Ciclopatrullaje (6), Despachadores (8)"
  }
}
```

---

## ❌ Respuestas de Error

### API Key no proporcionada (401)
```json
{
  "success": false,
  "message": "API Key no proporcionada",
  "error": "Se requiere X-API-Key en headers o api_key en query parameters"
}
```

### API Key inválida (401)
```json
{
  "success": false,
  "message": "API Key inválida"
}
```

### API Key no activa o expirada (401)
```json
{
  "success": false,
  "message": "API Key no activa o expirada"
}
```

### Error interno del servidor (500)
```json
{
  "success": false,
  "message": "Error obteniendo estado de empleados",
  "error": "Detalles del error..."
}
```

---

## 📊 Estructura de Datos

### Categorías de Empleados

| Categoría  | Descripción | Códigos Turno |
|-----------|------------|---------------|
| `trabajando` | Empleados en turno de trabajo | M, T, N, 1, 2, 3, 1e, 2e, 3e, 1E, 2E, 3E, Me, Te, Ne, ME, TE, NE |
| `descanso` | Empleados en descanso programado | F (Franco), L (Libre) |
| `ausente` | Empleados ausentes (justificadamente) | V (Vacaciones), LM (Licencia Médica), S (Sindical), A (Administrativo) |
| `sinTurno` | Empleados sin turno asignado | N/A |

### Roles Operativos

| ID | Rol |
|----|-----|
| 1  | Alerta Móvil |
| 2  | Fiscalización |
| 3  | Motorizado |
| 5  | Dron |
| 6  | Ciclopatrullaje |
| 8  | Despachadores |

---

## 🛠️ Gestión de API Keys

### Listar todas las API Keys
```bash
php artisan tinker

# Dentro de tinker:
\App\Models\ApiKey::all();
```

### Desactivar una API Key
```php
$apiKey = \App\Models\ApiKey::where('name', 'Sistema Externo 1')->first();
$apiKey->update(['is_active' => false]);
```

### Establecer expiración a una API Key
```php
$apiKey = \App\Models\ApiKey::where('name', 'Sistema Externo 1')->first();
$apiKey->update(['expired_at' => now()->addMonths(3)]);
```

### Ver última utilización
```php
$apiKey = \App\Models\ApiKey::where('name', 'Sistema Externo 1')->first();
echo $apiKey->last_used_at;
```

### Eliminar una API Key
```php
\App\Models\ApiKey::where('name', 'Sistema Externo 1')->delete();
```

---

## 🔄 Endpoint Original

Si necesitas información adicional o tienes autenticación activa en la aplicación, también existe el endpoint:

```
GET /api/dashboard/employee-status
```

Este endpoint requiere autenticación mediante sesión de usuario (Sanctum).

---

## 📝 Notas Importantes

1. **Seguridad**: Las API Keys se registran cada vez que se usan. Puedes monitorear el acceso consultando el campo `last_used_at`.

2. **Rate Limiting**: Se recomienda implementar rate limiting en sistemas externos que consuman este endpoint frecuentemente.

3. **Fecha por defecto**: Si no proporcionas la fecha, se asume la fecha actual.

4. **Roles operativos**: Solo se devuelve información de empleados en roles operativos (1, 2, 3, 5, 6, 8).

5. **Caché**: Considera cachear los resultados en sistemas externos para reducir la carga de consultas.

---

## 📞 Soporte

Para reportar problemas o solicitar cambios en este endpoint, contacta al equipo de desarrollo.

**Última actualización**: 11 de marzo de 2026
