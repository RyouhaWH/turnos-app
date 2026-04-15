# Asignaciones: Sectores y Vehículos

Documentación del módulo de asignación diaria de sector y vehículo (móvil) por funcionario.

---

## Base de datos

### `sectors`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint PK | |
| `name` | string | Nombre del sector (único) |
| `description` | string nullable | Descripción libre |
| `color` | string(7) nullable | Color hex para UI, ej. `#3B82F6` |
| `is_active` | boolean | Default `true` |
| `created_at` / `updated_at` | timestamps | |

### `vehicles`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint PK | |
| `name` | string | Nombre del vehículo, ej. "Móvil 01" |
| `plate_number` | string nullable | Patente |
| `type` | enum | `patrol`, `motorcycle`, `bicycle`, `drone`, `van`, `other` |
| `status` | enum | `available`, `in_use`, `maintenance`, `inactive` |
| `notes` | string nullable | |
| `is_active` | boolean | Default `true` |
| `created_at` / `updated_at` | timestamps | |

### `employee_assignments`

Registro diario: un funcionario → un sector + vehículo por fecha. Restricción `UNIQUE(employee_id, date)`.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint PK | |
| `employee_id` | FK → employees | |
| `date` | date | Fecha de la asignación |
| `sector_id` | FK → sectors nullable | Sector asignado |
| `vehicle_id` | FK → vehicles nullable | Vehículo asignado |
| `assigned_by` | FK → users nullable | Quién hizo la asignación |
| `notes` | string nullable | |
| `created_at` / `updated_at` | timestamps | |

**Índices adicionales:** `(date, sector_id)`, `(date, vehicle_id)`

### `assignment_logs`

Auditoría de cambios en asignaciones.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | bigint PK | |
| `employee_id` | FK → employees | |
| `assignment_id` | FK → employee_assignments nullable | Puede ser null si se eliminó |
| `changed_by` | FK → users nullable | |
| `assignment_date` | date | Fecha de la asignación modificada |
| `old_sector_id` | bigint nullable | Sector anterior |
| `new_sector_id` | bigint nullable | Sector nuevo |
| `old_vehicle_id` | bigint nullable | Vehículo anterior |
| `new_vehicle_id` | bigint nullable | Vehículo nuevo |
| `comment` | string nullable | |
| `changed_at` | timestamp | Default `CURRENT_TIMESTAMP` |
| `created_at` / `updated_at` | timestamps | |

---

## Endpoints

### Autenticación requerida

Todos los endpoints requieren sesión web activa (`auth` middleware). Los roles necesarios se indican por endpoint.

---

### Sectores

> Requiere rol **Administrador**. Prefijo: `/platform-data/sectors`

#### `GET /platform-data/sectors`
Renderiza la vista Inertia de gestión de sectores.

**Props Inertia:**
```json
{
  "sectors": [
    {
      "id": 1,
      "name": "Centro",
      "description": "Sector centro de la ciudad",
      "color": "#3B82F6",
      "is_active": true,
      "created_at": "2026-04-13T10:00:00.000000Z",
      "updated_at": "2026-04-13T10:00:00.000000Z"
    }
  ]
}
```

---

#### `POST /platform-data/sectors`
Crea un nuevo sector.

**Body:**
```json
{
  "name": "Centro",
  "description": "Opcional",
  "color": "#3B82F6",
  "is_active": true
}
```

**Validaciones:**
- `name`: requerido, string, max 255, único en tabla `sectors`
- `description`: opcional, string, max 500
- `color`: opcional, regex `^#[0-9A-Fa-f]{6}$`
- `is_active`: boolean

**Respuesta exitosa:** redirect back con flash `success`.

---

#### `PUT /platform-data/sectors/{id}`
Actualiza un sector existente.

**Body:** igual que POST. El `name` único excluye el propio registro.

**Respuesta exitosa:** redirect back con flash `success`.

---

#### `DELETE /platform-data/sectors/{id}`
Elimina un sector. Las asignaciones que lo referencian pasan a `sector_id = null` (cascade nullOnDelete).

**Respuesta exitosa:** redirect back con flash `success`.

---

### Vehículos

> Requiere rol **Administrador**. Prefijo: `/platform-data/vehicles`

#### `GET /platform-data/vehicles`
Renderiza la vista Inertia de gestión de vehículos.

**Props Inertia:**
```json
{
  "vehicles": [
    {
      "id": 1,
      "name": "Móvil 01",
      "plate_number": "ABCD-12",
      "type": "patrol",
      "status": "available",
      "notes": null,
      "is_active": true
    }
  ],
  "types": ["patrol", "motorcycle", "bicycle", "drone", "van", "other"],
  "statuses": ["available", "in_use", "maintenance", "inactive"]
}
```

**Labels de `type`:**
| Valor | Etiqueta |
|---|---|
| `patrol` | Patrullaje |
| `motorcycle` | Motorizado |
| `bicycle` | Ciclopatrullaje |
| `drone` | Dron |
| `van` | Furgón |
| `other` | Otro |

**Labels de `status`:**
| Valor | Etiqueta |
|---|---|
| `available` | Disponible |
| `in_use` | En uso |
| `maintenance` | En mantención |
| `inactive` | Inactivo |

---

#### `POST /platform-data/vehicles`
Crea un nuevo vehículo.

**Body:**
```json
{
  "name": "Móvil 01",
  "plate_number": "ABCD-12",
  "type": "patrol",
  "status": "available",
  "notes": null,
  "is_active": true
}
```

**Validaciones:**
- `name`: requerido, string, max 255
- `plate_number`: opcional, string, max 20
- `type`: requerido, uno de los valores del enum
- `status`: requerido, uno de los valores del enum
- `notes`: opcional, string, max 500
- `is_active`: boolean

---

#### `PUT /platform-data/vehicles/{id}`
Actualiza un vehículo existente. Body idéntico a POST.

---

#### `DELETE /platform-data/vehicles/{id}`
Elimina un vehículo. Las asignaciones que lo referencian pasan a `vehicle_id = null`.

---

### Asignaciones

> Requiere rol **Supervisor** o **Administrador**.

---

#### `GET /assignments?date=YYYY-MM-DD`
Renderiza la vista Inertia de gestión de asignaciones del día.

**Query params:**
| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `date` | string (YYYY-MM-DD) | hoy (America/Santiago) | Fecha a gestionar |

**Props Inertia:**
```json
{
  "date": "2026-04-13",
  "employees": [
    {
      "id": 42,
      "name": "PÉREZ",
      "paternal_lastname": "PÉREZ",
      "rol_id": 1,
      "rol_name": "Patrullaje y Proximidad",
      "amzoma": false,
      "assignment": {
        "id": 7,
        "sector_id": 2,
        "vehicle_id": 3,
        "notes": null
      }
    }
  ],
  "sectors": [
    { "id": 1, "name": "Centro", "color": "#3B82F6", "is_active": true }
  ],
  "vehicles": [
    { "id": 1, "name": "Móvil 01", "type": "patrol", "is_active": true }
  ],
  "roles": [
    { "id": 1, "nombre": "Patrullaje y Proximidad" }
  ]
}
```

**Notas:**
- `employees` incluye solo roles con `is_operational = true`.
- `assignment` es `null` si el funcionario no tiene asignación para esa fecha.
- `sectors` y `vehicles` solo incluyen los activos (`is_active = true`).

---

#### `POST /assignments/upsert`
Crea o actualiza la asignación de **un solo funcionario** en una fecha. Si ya existe un registro para `(employee_id, date)` lo reemplaza.

**Body:**
```json
{
  "employee_id": 42,
  "date": "2026-04-13",
  "sector_id": 2,
  "vehicle_id": 3,
  "notes": "Opcional"
}
```

**Validaciones:**
- `employee_id`: requerido, existe en tabla `employees`
- `date`: requerido, fecha válida
- `sector_id`: opcional (nullable), existe en tabla `sectors`
- `vehicle_id`: opcional (nullable), existe en tabla `vehicles`
- `notes`: opcional, string, max 500

**Respuesta exitosa `200`:**
```json
{
  "success": true,
  "assignment": {
    "id": 7,
    "employee_id": 42,
    "date": "2026-04-13",
    "sector_id": 2,
    "vehicle_id": 3,
    "assigned_by": 1,
    "notes": null,
    "sector": { "id": 2, "name": "Norte", "color": "#10B981" },
    "vehicle": { "id": 3, "name": "Móvil 03", "type": "patrol" },
    "employee": { "id": 42, "name": "PÉREZ" }
  }
}
```

---

#### `POST /assignments/bulk`
Crea o actualiza asignaciones de **múltiples funcionarios** en la misma fecha. Operación atómica por funcionario (upsert individual dentro de una transacción).

**Body:**
```json
{
  "date": "2026-04-13",
  "assignments": [
    { "employee_id": 42, "sector_id": 2, "vehicle_id": 3, "notes": null },
    { "employee_id": 43, "sector_id": 1, "vehicle_id": null },
    { "employee_id": 44, "sector_id": null, "vehicle_id": null }
  ]
}
```

**Validaciones:**
- `date`: requerido, fecha válida
- `assignments`: array, mínimo 1 elemento
- `assignments.*.employee_id`: requerido, existe en tabla `employees`
- `assignments.*.sector_id`: nullable, existe en tabla `sectors`
- `assignments.*.vehicle_id`: nullable, existe en tabla `vehicles`
- `assignments.*.notes`: nullable, string, max 500

**Respuesta exitosa `200`:**
```json
{
  "success": true,
  "count": 3
}
```

**Comportamiento del log de auditoría:** solo genera un `assignment_log` si el sector o vehículo efectivamente cambia respecto al valor anterior.

---

#### `GET /api/assignments/grouped?date=YYYY-MM-DD`
Devuelve los funcionarios agrupados por **rol → sector** para una fecha. Endpoint pensado para consumo del dashboard.

> Requiere solo **autenticación** (cualquier rol).

**Query params:**
| Param | Tipo | Default |
|---|---|---|
| `date` | string (YYYY-MM-DD) | hoy (America/Santiago) |

**Respuesta exitosa `200`:**
```json
{
  "success": true,
  "date": "2026-04-13",
  "data": [
    {
      "rol_id": 2,
      "rol_name": "Fiscalización",
      "color": "#F59E0B",
      "sectors": [
        {
          "sector_id": null,
          "sector_name": "Sin sector",
          "sector_color": null,
          "employees": [
            {
              "id": 10,
              "name": "GÓMEZ",
              "paternal_lastname": "GÓMEZ",
              "amzoma": false,
              "shift": "T",
              "sector_id": null,
              "sector_name": null,
              "sector_color": null,
              "vehicle_id": null,
              "vehicle_name": null,
              "vehicle_type": null
            }
          ]
        },
        {
          "sector_id": 1,
          "sector_name": "Centro",
          "sector_color": "#3B82F6",
          "employees": [
            {
              "id": 15,
              "name": "MARTÍNEZ",
              "paternal_lastname": "MARTÍNEZ",
              "amzoma": false,
              "shift": "M",
              "sector_id": 1,
              "sector_name": "Centro",
              "sector_color": "#3B82F6",
              "vehicle_id": 2,
              "vehicle_name": "Móvil 02",
              "vehicle_type": "patrol"
            }
          ]
        }
      ]
    }
  ]
}
```

**Notas:**
- Solo incluye roles con `is_operational = true`.
- El `shift` viene de `employee_shifts` para esa fecha (`null` si no tiene turno asignado).
- Funcionarios sin sector asignado quedan bajo `sector_id: null` con nombre "Sin sector".

---

### Dashboard enriquecido

#### `GET /api/dashboard/employee-status?date=YYYY-MM-DD`

El endpoint existente ahora incluye datos de asignación en cada funcionario de los 4 grupos (`trabajando`, `descanso`, `ausente`, `sinTurno`).

**Campos nuevos por funcionario:**
```json
{
  "id": 42,
  "name": "PÉREZ",
  "shift": "M",
  "sector_id": 2,
  "sector_name": "Norte",
  "sector_color": "#10B981",
  "vehicle_id": 3,
  "vehicle_name": "Móvil 03",
  "vehicle_type": "patrol"
}
```

Los campos son `null` cuando el funcionario no tiene asignación para esa fecha. No hay impacto en rendimiento: el mapa se carga con una sola query antes del loop.

---

## Permisos

| Endpoint | Administrador | Supervisor | Usuario base |
|---|:---:|:---:|:---:|
| `GET/POST/PUT/DELETE /platform-data/sectors` | ✓ | — | — |
| `GET/POST/PUT/DELETE /platform-data/vehicles` | ✓ | — | — |
| `GET /assignments` | ✓ | ✓ | — |
| `POST /assignments/upsert` | ✓ | ✓ | — |
| `POST /assignments/bulk` | ✓ | ✓ | — |
| `GET /api/assignments/grouped` | ✓ | ✓ | ✓ |
| `GET /api/dashboard/employee-status` | ✓ | ✓ | ✓ |

---

## Sidebar

| Enlace | Ícono | Sección | Rol mínimo |
|---|---|---|---|
| Asignaciones → `/assignments` | `ClipboardList` | Nav principal | Supervisor |
| Sectores → `/platform-data/sectors` | `MapPin` | Footer | Administrador |
| Vehículos → `/platform-data/vehicles` | `Truck` | Footer | Administrador |

---

## Flujo típico de uso

```
1. Admin crea sectores en /platform-data/sectors
2. Admin crea vehículos en /platform-data/vehicles
3. Supervisor entra a /assignments?date=HOY
4. Por cada funcionario selecciona sector y vehículo
5. Presiona "Guardar cambios" → POST /assignments/bulk
6. Dashboard en /api/dashboard/employee-status ya muestra
   sector y vehículo junto al turno de cada funcionario
7. Vista futura puede usar /api/assignments/grouped
   para agrupar visualmente por sector dentro de cada rol
```
