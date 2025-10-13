# 👥 Documentación de Endpoints de Empleados

## Índice
1. [Introducción](#introducción)
2. [Endpoints Disponibles](#endpoints-disponibles)
3. [Ejemplos de Uso](#ejemplos-de-uso)
4. [Formatos de Nombres](#formatos-de-nombres)

---

## Introducción

Los endpoints de empleados están diseñados para trabajar con los datos de los funcionarios, **formateando automáticamente los nombres** para extraer solo el primer nombre cuando un empleado tiene múltiples nombres.

### URL Base
```
http://tu-dominio.com/api/v1/employees
```

### Autenticación
Todos los endpoints requieren autenticación con token Bearer.

```
Authorization: Bearer {token}
```

---

## Formatos de Nombres

El sistema maneja tres formatos de nombres diferentes:

| Campo | Descripción | Ejemplo |
|-------|-------------|---------|
| `only_first_name` | Solo el primer nombre (útil cuando hay múltiples) | "Juan" |
| `formatted_name` | Primer nombre + Apellido paterno | "Juan Pérez" |
| `full_name` | Nombre completo con todos los apellidos | "Juan Carlos Pérez González" |

### Ejemplo de Procesamiento

Si un empleado tiene:
- `first_name`: "Juan Carlos Eduardo"
- `paternal_lastname`: "Pérez"
- `maternal_lastname`: "González"

El sistema devuelve:
- `only_first_name`: **"Juan"**
- `formatted_name`: **"Juan Pérez"**
- `full_name`: **"Juan Carlos Eduardo Pérez González"**

---

## Endpoints Disponibles

### 📋 1. Listar Todos los Empleados

**GET** `/api/v1/employees`

Lista todos los empleados con nombres formateados.

#### Query Parameters (Filtros opcionales)
- `status` - Filtrar por estado (activo, inactivo, licencia, vacaciones)
- `department` - Filtrar por departamento
- `amzoma` - Filtrar empleados de Amzoma (true/false)

#### Respuesta (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "only_first_name": "Juan",
      "formatted_name": "Juan Pérez",
      "full_name": "Juan Carlos Pérez González",
      "first_name": "Juan Carlos",
      "paternal_lastname": "Pérez",
      "maternal_lastname": "González",
      "rut": "12345678-9",
      "email": "juan.perez@example.com",
      "phone": "+56912345678",
      "position": "Desarrollador",
      "department": "TI",
      "status": "activo",
      "amzoma": true,
      "start_date": "2024-01-15"
    }
  ]
}
```

#### Ejemplo de Uso
```bash
# Todos los empleados
curl -X GET "http://localhost:8000/api/v1/employees" \
  -H "Authorization: Bearer {token}"

# Filtrar por departamento
curl -X GET "http://localhost:8000/api/v1/employees?department=ventas" \
  -H "Authorization: Bearer {token}"

# Filtrar empleados de Amzoma
curl -X GET "http://localhost:8000/api/v1/employees?amzoma=true" \
  -H "Authorization: Bearer {token}"
```

---

### 📋 2. Lista Simple (Para Dropdowns/Selects)

**GET** `/api/v1/employees/lista-simple`

Devuelve una lista simplificada con solo ID y nombres formateados. Ideal para dropdowns o selectores.

#### Query Parameters
- `incluir_inactivos` - Si se incluye este parámetro, muestra también inactivos
- `department` - Filtrar por departamento
- `amzoma` - Filtrar empleados de Amzoma

#### Respuesta (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "first_name": "Juan",
      "paternal_lastname": "Pérez",
      "formatted_name": "Juan Pérez"
    },
    {
      "id": 2,
      "first_name": "María",
      "paternal_lastname": "González",
      "formatted_name": "María González"
    }
  ]
}
```

#### Ejemplo de Uso
```bash
# Solo empleados activos (por defecto)
curl -X GET "http://localhost:8000/api/v1/employees/lista-simple" \
  -H "Authorization: Bearer {token}"

# Incluir empleados inactivos
curl -X GET "http://localhost:8000/api/v1/employees/lista-simple?incluir_inactivos=true" \
  -H "Authorization: Bearer {token}"
```

---

### ✅ 3. Empleados Activos

**GET** `/api/v1/employees/activos`

Devuelve solo empleados con status "activo".

#### Respuesta (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "only_first_name": "Juan",
      "formatted_name": "Juan Pérez",
      "full_name": "Juan Carlos Pérez González",
      "email": "juan.perez@example.com",
      "phone": "+56912345678",
      "position": "Desarrollador",
      "department": "TI",
      "amzoma": true
    }
  ]
}
```

---

### 🏢 4. Empleados de Amzoma

**GET** `/api/v1/employees/amzoma`

Devuelve empleados que pertenecen a Amzoma (campo `amzoma = true`).

#### Respuesta (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "only_first_name": "Juan",
      "formatted_name": "Juan Pérez",
      "full_name": "Juan Carlos Pérez González",
      "email": "juan.perez@example.com",
      "position": "Desarrollador",
      "department": "TI"
    }
  ]
}
```

---

### 👤 5. Obtener Empleado por ID

**GET** `/api/v1/employees/{id}`

Obtiene los detalles completos de un empleado específico, incluyendo relaciones con rol y usuario.

#### Respuesta (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "only_first_name": "Juan",
    "formatted_name": "Juan Pérez",
    "full_name": "Juan Carlos Pérez González",
    "first_name": "Juan Carlos",
    "paternal_lastname": "Pérez",
    "maternal_lastname": "González",
    "rut": "12345678-9",
    "email": "juan.perez@example.com",
    "phone": "+56912345678",
    "address": "Av. Principal 123",
    "position": "Desarrollador",
    "department": "TI",
    "status": "activo",
    "amzoma": true,
    "start_date": "2024-01-15",
    "rol": {
      "id": 1,
      "name": "Desarrollador"
    },
    "user": {
      "id": 5,
      "name": "Juan Pérez",
      "email": "juan.perez@example.com"
    }
  }
}
```

#### Error (404)
```json
{
  "success": false,
  "message": "Empleado no encontrado"
}
```

---

### 🏢 6. Empleados por Departamento

**GET** `/api/v1/employees/departamento/{department}`

Obtiene todos los empleados activos de un departamento específico.

#### Respuesta (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "only_first_name": "Juan",
      "formatted_name": "Juan Pérez",
      "position": "Desarrollador",
      "email": "juan.perez@example.com",
      "phone": "+56912345678"
    }
  ],
  "department": "TI",
  "count": 1
}
```

#### Ejemplo de Uso
```bash
curl -X GET "http://localhost:8000/api/v1/employees/departamento/ventas" \
  -H "Authorization: Bearer {token}"
```

---

### 🔍 7. Buscar Empleados

**GET** `/api/v1/employees/buscar?q={término}`

Busca empleados por nombre, apellidos, RUT o email. Retorna máximo 20 resultados.

#### Query Parameters (Requeridos)
- `q` - Término de búsqueda (mínimo 2 caracteres)

#### Respuesta (200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "only_first_name": "Juan",
      "formatted_name": "Juan Pérez",
      "full_name": "Juan Carlos Pérez González",
      "email": "juan.perez@example.com",
      "rut": "12345678-9",
      "department": "TI"
    }
  ],
  "count": 1
}
```

#### Error (400)
```json
{
  "success": false,
  "message": "El término de búsqueda debe tener al menos 2 caracteres"
}
```

#### Ejemplo de Uso
```bash
# Buscar por nombre
curl -X GET "http://localhost:8000/api/v1/employees/buscar?q=juan" \
  -H "Authorization: Bearer {token}"

# Buscar por RUT
curl -X GET "http://localhost:8000/api/v1/employees/buscar?q=12345678" \
  -H "Authorization: Bearer {token}"
```

---

### ➕ 8. Crear Empleado

**POST** `/api/v1/employees`

Crea un nuevo empleado.

#### Request Body
```json
{
  "first_name": "Juan Carlos",
  "paternal_lastname": "Pérez",
  "maternal_lastname": "González",
  "rut": "12345678-9",
  "email": "juan.perez@example.com",
  "phone": "+56912345678",
  "address": "Av. Principal 123",
  "position": "Desarrollador",
  "department": "TI",
  "start_date": "2024-01-15",
  "status": "activo",
  "amzoma": true,
  "rol_id": 1,
  "user_id": 5
}
```

#### Validaciones
- `first_name`: **requerido**, string, máx 255 caracteres
- `paternal_lastname`: **requerido**, string, máx 255 caracteres
- `maternal_lastname`: opcional, string, máx 255 caracteres
- `rut`: **requerido**, string, único en la base de datos
- `email`: opcional, email válido, único
- `phone`: opcional, string, máx 20 caracteres
- `address`: opcional, string, máx 500 caracteres
- `position`: opcional, string, máx 255 caracteres
- `department`: opcional, string, máx 255 caracteres
- `start_date`: opcional, formato fecha (YYYY-MM-DD)
- `status`: opcional, uno de: activo, inactivo, licencia, vacaciones
- `amzoma`: opcional, booleano
- `rol_id`: opcional, debe existir en tabla rols
- `user_id`: opcional, debe existir en tabla users

#### Respuesta (201)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "only_first_name": "Juan",
    "formatted_name": "Juan Pérez",
    "full_name": "Juan Carlos Pérez González"
  },
  "message": "Empleado creado exitosamente"
}
```

---

### ✏️ 9. Actualizar Empleado

**PUT/PATCH** `/api/v1/employees/{id}`

Actualiza los datos de un empleado existente.

#### Request Body
```json
{
  "first_name": "Juan Carlos Eduardo",
  "paternal_lastname": "Pérez",
  "status": "activo"
}
```

#### Respuesta (200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "only_first_name": "Juan",
    "formatted_name": "Juan Pérez",
    "full_name": "Juan Carlos Eduardo Pérez González"
  },
  "message": "Empleado actualizado exitosamente"
}
```

---

### 🗑️ 10. Eliminar Empleado

**DELETE** `/api/v1/employees/{id}`

Marca un empleado como inactivo (soft delete). No elimina físicamente el registro.

#### Respuesta (200)
```json
{
  "success": true,
  "message": "Empleado marcado como inactivo"
}
```

---

## Ejemplos de Uso

### JavaScript (Fetch)

```javascript
// Obtener lista simple para un dropdown
async function getEmployeesForDropdown() {
    const response = await fetch('http://localhost:8000/api/v1/employees/lista-simple', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    const data = await response.json();
    
    // Usar en un select
    const select = document.getElementById('employee-select');
    data.data.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = emp.formatted_name; // "Juan Pérez"
        select.appendChild(option);
    });
}

// Buscar empleados
async function searchEmployees(searchTerm) {
    const response = await fetch(`http://localhost:8000/api/v1/employees/buscar?q=${searchTerm}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    const data = await response.json();
    console.log('Resultados:', data.data);
}

// Obtener empleados de un departamento
async function getEmployeesByDepartment(dept) {
    const response = await fetch(`http://localhost:8000/api/v1/employees/departamento/${dept}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });
    
    const data = await response.json();
    console.log(`Empleados en ${dept}:`, data.data);
}
```

### React con Axios

```javascript
import axios from 'axios';

// Configuración del cliente
const api = axios.create({
    baseURL: 'http://localhost:8000/api/v1',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
    }
});

// Hook para obtener empleados
function useEmployees() {
    const [employees, setEmployees] = useState([]);
    
    useEffect(() => {
        async function fetchEmployees() {
            const { data } = await api.get('/employees/lista-simple');
            setEmployees(data.data);
        }
        fetchEmployees();
    }, []);
    
    return employees;
}

// Componente de búsqueda
function EmployeeSearch() {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    
    const handleSearch = async (term) => {
        if (term.length < 2) return;
        
        const { data } = await api.get(`/employees/buscar?q=${term}`);
        setResults(data.data);
    };
    
    return (
        <div>
            <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleSearch(e.target.value);
                }}
                placeholder="Buscar empleado..."
            />
            <ul>
                {results.map(emp => (
                    <li key={emp.id}>
                        {emp.formatted_name} - {emp.department}
                    </li>
                ))}
            </ul>
        </div>
    );
}
```

---

## Casos de Uso Comunes

### 1. Dropdown de Empleados
Usa `/api/v1/employees/lista-simple` para obtener solo ID y nombres formateados.

### 2. Filtrar por Departamento
Usa `/api/v1/employees/departamento/{dept}` para obtener empleados de un departamento específico.

### 3. Búsqueda en Tiempo Real
Usa `/api/v1/employees/buscar?q={term}` con un debounce para búsqueda mientras el usuario escribe.

### 4. Solo Empleados de Amzoma
Usa `/api/v1/employees/amzoma` para obtener solo empleados de Amzoma.

### 5. Lista Completa con Filtros
Usa `/api/v1/employees` con query parameters para aplicar múltiples filtros.

---

## Resumen de URLs

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/v1/employees` | GET | Todos los empleados con filtros |
| `/api/v1/employees/lista-simple` | GET | Lista simple (dropdown) |
| `/api/v1/employees/activos` | GET | Solo empleados activos |
| `/api/v1/employees/amzoma` | GET | Solo empleados de Amzoma |
| `/api/v1/employees/buscar` | GET | Buscar empleados |
| `/api/v1/employees/departamento/{dept}` | GET | Empleados por departamento |
| `/api/v1/employees/{id}` | GET | Detalles de un empleado |
| `/api/v1/employees` | POST | Crear empleado |
| `/api/v1/employees/{id}` | PUT/PATCH | Actualizar empleado |
| `/api/v1/employees/{id}` | DELETE | Marcar como inactivo |

---

**Última actualización**: Octubre 2025


