import { useCallback, useState, useRef } from 'react';
import { toast } from 'sonner';

interface SimpleChange {
    id: string;
    employeeId: string;
    employeeName: string;
    day: string;
    oldValue: string;
    newValue: string;
    timestamp: number;
}

// Hook ultra simple para manejo de undo que funciona directamente con el grid
export const useSimpleUndo = () => {
    const [changes, setChanges] = useState<SimpleChange[]>([]);
    const gridApiRef = useRef<any>(null);

    // Registrar un cambio
    const recordChange = useCallback((employeeId: string, employeeName: string, day: string, oldValue: string, newValue: string) => {
        if (oldValue === newValue) return;

        const change: SimpleChange = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            employeeId,
            employeeName,
            day,
            oldValue,
            newValue,
            timestamp: Date.now(),
        };

        setChanges(prev => [...prev, change]);
        console.log('Cambio registrado:', change);
    }, []);

    // Deshacer último cambio
    const undoLastChange = useCallback(() => {
        if (changes.length === 0) {
            toast.warning('No hay cambios para deshacer');
            return;
        }

        const lastChange = changes[changes.length - 1];
        console.log('Deshaciendo:', lastChange);

        // Si tenemos referencia al grid API, actualizar directamente
        if (gridApiRef.current) {
            try {
                // Buscar la fila en el grid
                let targetRowNode = null;
                gridApiRef.current.forEachNode((node: any) => {
                    if (node.data && (
                        String(node.data.employee_id) === lastChange.employeeId ||
                        String(node.data.id) === lastChange.employeeId ||
                        node.data.nombre === lastChange.employeeName
                    )) {
                        targetRowNode = node;
                    }
                });

                if (targetRowNode) {
                    // Actualizar el dato directamente
                    const updatedData = { ...targetRowNode.data };
                    updatedData[lastChange.day] = lastChange.oldValue;

                    // Aplicar la actualización al grid
                    targetRowNode.setData(updatedData);

                    console.log(`Grid actualizado: ${lastChange.employeeName} día ${lastChange.day} = "${lastChange.oldValue}"`);

                    // Remover el cambio de la lista
                    setChanges(prev => prev.slice(0, -1));

                    toast.success('Cambio deshecho', {
                        description: `${lastChange.employeeName} - Día ${lastChange.day}`,
                        duration: 2000,
                    });
                } else {
                    console.error('No se encontró la fila en el grid');
                    toast.error('No se pudo encontrar la fila para deshacer');
                }
            } catch (error) {
                console.error('Error al deshacer en el grid:', error);
                toast.error('Error al deshacer el cambio');
            }
        } else {
            console.error('No hay referencia al grid API');
            toast.error('Grid no disponible para deshacer');
        }
    }, [changes]);

    // Limpiar historial de cambios (y opcionalmente restaurar grid)
    const clearAllChanges = useCallback((originalData?: any[]) => {
        console.log('Limpiando historial del sistema simple...');

        // Solo restaurar grid si se proporcionan datos originales
        if (originalData && gridApiRef.current) {
            try {
                console.log('Restaurando grid usando sistema simple...');

                // Actualizar cada fila en el grid con los datos originales
                originalData.forEach(originalRow => {
                    let targetRowNode = null;
                    gridApiRef.current.forEachNode((node: any) => {
                        if (node.data && (
                            String(node.data.employee_id) === String(originalRow.employee_id) ||
                            String(node.data.id) === String(originalRow.id) ||
                            node.data.nombre === originalRow.nombre
                        )) {
                            targetRowNode = node;
                        }
                    });

                    if (targetRowNode) {
                        // Restaurar todos los datos del empleado
                        targetRowNode.setData({ ...originalRow });
                    }
                });

                console.log('Grid restaurado por sistema simple');
            } catch (error) {
                console.error('Error al restaurar grid en sistema simple:', error);
            }
        } else {
            console.log('Solo limpiando historial (sin restaurar grid)');
        }

        // Siempre limpiar el historial de cambios
        setChanges([]);

        console.log('Historial del sistema simple limpiado');
    }, []);

    // Establecer referencia del grid API
    const setGridApi = useCallback((api: any) => {
        gridApiRef.current = api;
        console.log('Grid API establecida:', !!api);
    }, []);

    return {
        changes,
        changeCount: changes.length,
        canUndo: changes.length > 0,
        recordChange,
        undoLastChange,
        clearAllChanges,
        setGridApi,
        getGridApi: () => gridApiRef.current // Exponer acceso al Grid API
    };
};
