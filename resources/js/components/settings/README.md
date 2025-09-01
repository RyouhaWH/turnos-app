# Componentes de Configuración

Esta carpeta contiene los componentes separados para cada pestaña de la página de configuración de datos de plataforma.

## Componentes Disponibles

### RolesTab
- **Responsabilidad**: Gestión de roles operativos
- **Funcionalidades**:
  - Crear nuevos roles
  - Editar roles existentes
  - Configurar colores personalizados
  - Marcar roles como operativos
- **Props**:
  - `roles`: Array de roles existentes
  - `onRoleUpdate`: Función para actualizar un rol
  - `onRoleCreate`: Función para crear un nuevo rol

### EmployeesTab
- **Responsabilidad**: Gestión de empleados y sus cuentas de usuario
- **Funcionalidades**:
  - Ver lista de empleados
  - Editar información de empleados
  - Crear cuentas de usuario
  - Editar cuentas de usuario existentes
  - Eliminar cuentas de usuario
- **Props**:
  - `empleados`: Array de empleados
  - `roles`: Array de roles disponibles
  - `onEmployeeUpdate`: Función para actualizar empleado
  - `onUserCreate`: Función para crear usuario
  - `onUserUpdate`: Función para actualizar usuario
  - `onUserDelete`: Función para eliminar usuario
  - `availableRoles`: Array de roles disponibles para usuarios

### MissingDataTab
- **Responsabilidad**: Análisis de datos faltantes de empleados
- **Funcionalidades**:
  - Mostrar estadísticas de completitud
  - Filtrar por categorías de datos faltantes
  - Búsqueda de empleados
  - Visualización de campos faltantes
- **Props**:
  - `onLoadMissingData`: Función para cargar datos faltantes
  - `missingDataResponse`: Datos de empleados con campos faltantes
  - `stats`: Estadísticas de completitud
  - `loading`: Estado de carga

### UserLinkingTab
- **Responsabilidad**: Vinculación de empleados con usuarios del sistema
- **Funcionalidades**:
  - Mostrar empleados sin vincular
  - Mostrar usuarios disponibles
  - Vincular empleados con usuarios
  - Búsqueda en ambas listas
- **Props**:
  - `onLoadLinkingData`: Función para cargar datos de vinculación
  - `linkingData`: Datos de empleados y usuarios para vincular
  - `loading`: Estado de carga
  - `onLinkEmployee`: Función para vincular empleado
  - `onUnlinkEmployee`: Función para desvincular empleado

### DepartmentsTab
- **Responsabilidad**: Gestión de departamentos de la organización
- **Funcionalidades**:
  - Crear nuevos departamentos
  - Editar departamentos existentes
  - Eliminar departamentos
  - Ver estadísticas de empleados por departamento
- **Props**:
  - `departments`: Array de departamentos
  - `onDepartmentCreate`: Función para crear departamento
  - `onDepartmentUpdate`: Función para actualizar departamento
  - `onDepartmentDelete`: Función para eliminar departamento

## Uso de los Componentes

### Importación
```tsx
import { 
    RolesTab, 
    EmployeesTab, 
    MissingDataTab, 
    UserLinkingTab, 
    DepartmentsTab 
} from '@/components/settings';
```

### Implementación en la Página Principal
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PlatformData() {
    // ... estados y funciones ...

    return (
        <Tabs defaultValue="roles" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="roles">Roles</TabsTrigger>
                <TabsTrigger value="employees">Empleados</TabsTrigger>
                <TabsTrigger value="missing-data">Datos Faltantes</TabsTrigger>
                <TabsTrigger value="user-linking">Vinculación</TabsTrigger>
                <TabsTrigger value="departments">Departamentos</TabsTrigger>
            </TabsList>

            <TabsContent value="roles">
                <RolesTab 
                    roles={roles}
                    onRoleUpdate={handleRoleUpdate}
                    onRoleCreate={handleRoleCreate}
                />
            </TabsContent>

            <TabsContent value="employees">
                <EmployeesTab 
                    empleados={empleados}
                    roles={roles}
                    onEmployeeUpdate={handleEmployeeUpdate}
                    onUserCreate={handleUserCreate}
                    onUserUpdate={handleUserUpdate}
                    onUserDelete={handleUserDelete}
                    availableRoles={availableRoles}
                />
            </TabsContent>

            <TabsContent value="missing-data">
                <MissingDataTab 
                    onLoadMissingData={loadMissingData}
                    missingDataResponse={missingDataResponse}
                    stats={stats}
                    loading={loadingMissingData}
                />
            </TabsContent>

            <TabsContent value="user-linking">
                <UserLinkingTab 
                    onLoadLinkingData={loadLinkingData}
                    linkingData={linkingData}
                    loading={loadingLinking}
                    onLinkEmployee={handleLinkEmployee}
                    onUnlinkEmployee={handleUnlinkEmployee}
                />
            </TabsContent>

            <TabsContent value="departments">
                <DepartmentsTab 
                    departments={departments}
                    onDepartmentCreate={handleDepartmentCreate}
                    onDepartmentUpdate={handleDepartmentUpdate}
                    onDepartmentDelete={handleDepartmentDelete}
                />
            </TabsContent>
        </Tabs>
    );
}
```

## Beneficios de la Separación

### 1. **Mantenibilidad**
- Cada componente tiene una responsabilidad específica
- Cambios en una pestaña no afectan a las otras
- Código más fácil de entender y mantener

### 2. **Reutilización**
- Los componentes pueden ser usados en otras páginas
- Fácil de testear de forma independiente
- Lógica encapsulada en cada componente

### 3. **Escalabilidad**
- Fácil agregar nuevas pestañas
- Nuevas funcionalidades se pueden agregar sin afectar el código existente
- Estructura clara para el crecimiento

### 4. **Legibilidad**
- El archivo principal es mucho más limpio
- Cada pestaña es fácil de entender por separado
- Mejor organización del código

## Estructura de Archivos

```
resources/js/components/settings/
├── index.ts              # Exportaciones
├── README.md             # Esta documentación
├── RolesTab.tsx          # Pestaña de Roles
├── EmployeesTab.tsx      # Pestaña de Empleados
├── MissingDataTab.tsx    # Pestaña de Datos Faltantes
├── UserLinkingTab.tsx    # Pestaña de Vinculación
└── DepartmentsTab.tsx    # Pestaña de Departamentos
```

## Próximos Pasos

1. **Crear pruebas unitarias** para cada componente
2. **Implementar lazy loading** para las pestañas
3. **Agregar más validaciones** en los formularios
4. **Mejorar la accesibilidad** con ARIA labels
5. **Implementar drag & drop** para reordenar elementos
6. **Agregar confirmaciones** para acciones destructivas
