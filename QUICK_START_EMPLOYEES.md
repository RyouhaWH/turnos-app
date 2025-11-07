# 🚀 Inicio Rápido - Endpoints de Empleados

## Configuración

Todos los endpoints requieren autenticación con token Bearer:

```bash
Authorization: Bearer TU_TOKEN
```

---

## 📋 Endpoints Principales

### 1️⃣ Lista Simple (Para Dropdowns)
**Ideal para selectores y autocompletes**

```bash
GET /api/v1/employees/lista-simple
```

**Respuesta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "first_name": "Juan",
      "paternal_lastname": "Pérez",
      "formatted_name": "Juan Pérez"
    }
  ]
}
```

**JavaScript:**
```javascript
const response = await fetch('/api/v1/employees/lista-simple', {
    headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();

// Usar en un select
data.data.forEach(emp => {
    console.log(emp.formatted_name); // "Juan Pérez"
});
```

---

### 2️⃣ Empleados Activos
**Solo empleados con status "activo"**

```bash
GET /api/v1/employees/activos
```

---

### 3️⃣ Buscar Empleados
**Búsqueda por nombre, apellido, RUT o email**

```bash
GET /api/v1/employees/buscar?q=juan
```

**JavaScript con debounce:**
```javascript
let timeout;
function searchEmployees(term) {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
        const response = await fetch(`/api/v1/employees/buscar?q=${term}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const { data } = await response.json();
        console.log('Resultados:', data.data);
    }, 300);
}
```

---

### 4️⃣ Empleados por Departamento

```bash
GET /api/v1/employees/departamento/ventas
```

---

### 5️⃣ Empleados de Amzoma

```bash
GET /api/v1/employees/amzoma
```

---

### 6️⃣ Todos los Empleados (con filtros)

```bash
# Todos
GET /api/v1/employees

# Con filtros
GET /api/v1/employees?department=ventas&status=activo&amzoma=true
```

---

### 7️⃣ Obtener Empleado por ID

```bash
GET /api/v1/employees/1
```

---

### 8️⃣ Crear Empleado

```bash
POST /api/v1/employees
Content-Type: application/json

{
  "first_name": "Juan Carlos",
  "paternal_lastname": "Pérez",
  "maternal_lastname": "González",
  "rut": "12345678-9",
  "email": "juan@example.com",
  "department": "ventas",
  "position": "Vendedor",
  "status": "activo"
}
```

---

## 🎯 Formatos de Nombres

El sistema devuelve **3 formatos** de nombres:

| Campo | Input: "Juan Carlos Eduardo" | Output |
|-------|------------------------------|--------|
| `only_first_name` | "Juan Carlos Eduardo" | **"Juan"** |
| `formatted_name` | + "Pérez" (apellido) | **"Juan Pérez"** |
| `full_name` | + todos los apellidos | **"Juan Carlos Eduardo Pérez González"** |

---

## 💡 Casos de Uso

### Caso 1: Dropdown de Empleados
```javascript
// Obtener lista simple
const response = await fetch('/api/v1/employees/lista-simple', {
    headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();

// Renderizar en select
const select = document.getElementById('employee-select');
data.data.forEach(emp => {
    const option = new Option(emp.formatted_name, emp.id);
    select.add(option);
});
```

### Caso 2: Búsqueda con Autocompletar
```javascript
async function autocomplete(input) {
    if (input.length < 2) return [];
    
    const response = await fetch(`/api/v1/employees/buscar?q=${input}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const { data } = await response.json();
    
    return data.data.map(emp => ({
        value: emp.id,
        label: emp.formatted_name,
        subtitle: emp.department
    }));
}
```

### Caso 3: Filtrar por Departamento
```javascript
async function loadDepartmentEmployees(department) {
    const response = await fetch(`/api/v1/employees/departamento/${department}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const { data } = await response.json();
    
    console.log(`${data.count} empleados en ${data.department}`);
    return data.data;
}
```

---

## 🔧 Ejemplo Completo React

```jsx
import { useState, useEffect } from 'react';

function EmployeeSelector() {
    const [employees, setEmployees] = useState([]);
    const [selected, setSelected] = useState('');

    useEffect(() => {
        async function loadEmployees() {
            const response = await fetch('/api/v1/employees/lista-simple', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const { data } = await response.json();
            setEmployees(data.data);
        }
        loadEmployees();
    }, []);

    return (
        <select 
            value={selected} 
            onChange={(e) => setSelected(e.target.value)}
        >
            <option value="">Seleccione un empleado</option>
            {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                    {emp.formatted_name}
                </option>
            ))}
        </select>
    );
}
```

---

## 📝 Notas Importantes

1. **Nombres Múltiples**: Si un empleado tiene "Juan Carlos Eduardo" en `first_name`, el sistema automáticamente extrae solo "Juan" en `only_first_name`.

2. **Lista Simple**: Para dropdowns/selects, siempre usa `/lista-simple` - es más rápida y devuelve solo lo necesario.

3. **Búsqueda**: Implementa un debounce de al menos 300ms en búsquedas en tiempo real.

4. **Activos por Defecto**: `/lista-simple` solo devuelve activos por defecto. Usa `?incluir_inactivos=true` para ver todos.

5. **Soft Delete**: El DELETE marca como inactivo, no elimina físicamente.

---

## 🧪 Probar con cURL

```bash
# Lista simple
curl "http://localhost:8000/api/v1/employees/lista-simple" \
  -H "Authorization: Bearer TU_TOKEN"

# Buscar
curl "http://localhost:8000/api/v1/employees/buscar?q=juan" \
  -H "Authorization: Bearer TU_TOKEN"

# Por departamento
curl "http://localhost:8000/api/v1/employees/departamento/ventas" \
  -H "Authorization: Bearer TU_TOKEN"

# Crear empleado
curl -X POST "http://localhost:8000/api/v1/employees" \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Juan Carlos",
    "paternal_lastname": "Pérez",
    "rut": "12345678-9"
  }'
```

---

## ✅ Checklist de Implementación

- [ ] Implementar dropdown con `/lista-simple`
- [ ] Agregar búsqueda con debounce
- [ ] Filtrar por departamento si es necesario
- [ ] Manejar empleados inactivos
- [ ] Mostrar `formatted_name` en la UI
- [ ] Validar RUT único al crear

---

**¡Listo para usar! 🎉**

Para más detalles, consulta `API_EMPLOYEES_ENDPOINTS.md`



