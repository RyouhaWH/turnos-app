# Funcionalidad de Orden Personalizado de Filas

## 📋 Descripción

Esta funcionalidad permite a los usuarios arrastrar y reordenar las filas de empleados en la grid de turnos, manteniendo el orden personalizado incluso después de aplicar filtros, mostrar totales, o actualizar la página.

## 🔧 Implementación

### 1. Hook personalizado: `useCustomOrder`

```typescript
const { customOrder, updateCustomOrder, clearCustomOrder } = useCustomOrder({
    storageKey: `custom-order-${year}-${month}`,
});
```

**Características:**
- ✅ Persistencia en localStorage
- ✅ Clave única por mes/año
- ✅ Manejo de errores
- ✅ API simple y limpia

### 2. Props del OptimizedExcelGrid

```typescript
interface OptimizedExcelGridProps {
    // ... otras props
    onCustomOrderChanged?: (customOrder: string[]) => void; // Callback para guardar orden
    customOrder?: string[]; // Orden personalizado actual
}
```

### 3. Funcionalidad de arrastre

- **Habilitado**: `rowDrag: true` en columna de nombre
- **Configuración**: `rowDragManaged={true}` y `rowDragMultiRow={false}`
- **Evento**: `onRowDragEnd` maneja el reordenamiento
- **Filtrado**: Solo empleados (excluye separadores y totales)

## 🎯 Cómo usar

### En el componente padre:

```typescript
import { useCustomOrder } from '@/hooks/useCustomOrder';

function MyComponent() {
    const { customOrder, updateCustomOrder } = useCustomOrder({
        storageKey: `custom-order-${selectedDate.getFullYear()}-${selectedDate.getMonth()}`,
    });

    const gridProps = {
        // ... otras props
        onCustomOrderChanged: updateCustomOrder,
        customOrder,
    };

    return <OptimizedExcelGrid {...gridProps} />;
}
```

### Comportamiento:

1. **Arrastrar filas**: Haz clic y arrastra desde la columna "Nombre"
2. **Orden persistente**: Se mantiene entre sesiones
3. **Filtros**: El orden se preserva al aplicar filtros
4. **Totales**: El orden se mantiene al mostrar/ocultar totales
5. **Nuevos empleados**: Se agregan al final del orden personalizado

## 🔄 Flujo de datos

```
Usuario arrastra fila
        ↓
onRowDragEnd se ejecuta
        ↓
Se extrae nuevo orden de IDs
        ↓
updateCustomOrder(newOrder)
        ↓
Se guarda en localStorage
        ↓
Se aplica en siguiente render
        ↓
Grid muestra nuevo orden
```

## 🎨 Estilos visuales

- **Indicador de arrastre**: ⋮⋮ aparece en hover
- **Fila siendo arrastrada**: Borde azul y sombra
- **Cursor**: grab/grabbing según estado
- **Feedback visual**: Resaltado durante arrastre

## 📱 Compatibilidad

- ✅ Desktop: Funcionalidad completa
- ✅ Mobile: Soporte táctil
- ✅ Persistencia: localStorage
- ✅ Performance: Optimizado con useMemo

## 🚀 Beneficios

1. **UX mejorada**: Los usuarios pueden organizar empleados según su preferencia
2. **Persistencia**: El orden se mantiene entre sesiones
3. **Flexibilidad**: Funciona con filtros y totales
4. **Performance**: Optimizado para grandes cantidades de datos
5. **Accesibilidad**: Indicadores visuales claros

## 🔧 Mantenimiento

- El orden se limpia automáticamente al cambiar de mes
- Los empleados nuevos se agregan al final
- Los empleados eliminados se quitan del orden
- Compatible con cambios de estructura de datos
