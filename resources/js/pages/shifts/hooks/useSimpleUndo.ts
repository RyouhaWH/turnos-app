import { useCallback, useRef, useState } from 'react';
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
    const onUndoCallback = useRef<((changeId: string) => void) | null>(null);

    // Registrar un cambio
    const recordChange = useCallback(
        (employeeId: string, employeeName: string, day: string, oldValue: string, newValue: string, changeId?: string) => {
            console.log('🎯 recordChange llamado en sistema simple:', {
                employeeId, employeeName, day, oldValue, newValue, changeId
            });

            if (oldValue === newValue) {
                console.log('⚠️ Sistema simple: valores iguales, no registrando');
                return;
            }

            const change: SimpleChange = {
                id: changeId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                employeeId,
                employeeName,
                day,
                oldValue,
                newValue,
                timestamp: Date.now(),
            };

            console.log('📝 Sistema simple: registrando cambio:', change);
            setChanges((prev) => {
                const newChanges = [...prev, change];
                console.log('📊 Sistema simple: total cambios después de agregar:', newChanges.length);
                return newChanges;
            });
        },
        [],
    );

    // Obtener lista de changeIds ordenados (más reciente al final)
    const getChangeIds = useCallback(() => {
        return changes.map(change => change.id);
    }, [changes]);

    // Deshacer cambio específico por ID
    const undoSpecificChange = useCallback((changeId: string) => {
        console.log('🎯 undoSpecificChange llamado con ID:', changeId);
        console.log('📊 Changes disponibles:', changes.length, changes);

        const changeToUndo = changes.find(change => change.id === changeId);
        if (!changeToUndo) {
            console.warn('❌ Cambio no encontrado:', changeId);
            toast.error('Cambio no encontrado');
            return;
        }

        console.log('✅ Cambio encontrado para deshacer:', changeToUndo);

        // Si tenemos referencia al grid API, actualizar directamente
        if (gridApiRef.current) {
            console.log('🔗 Grid API disponible, buscando fila...');
            try {
                // Buscar la fila en el grid usando múltiples criterios
                let targetRowNode: any = null;
                let matchedBy = '';

                gridApiRef.current.forEachNode((node: any) => {
                    if (node.data && !targetRowNode) {
                        // Prioridad 1: Por employee_id
                        if (String(node.data.employee_id) === String(changeToUndo.employeeId)) {
                            targetRowNode = node;
                            matchedBy = 'employee_id';
                        }
                        // Prioridad 2: Por id
                        else if (String(node.data.id) === String(changeToUndo.employeeId)) {
                            targetRowNode = node;
                            matchedBy = 'id';
                        }
                        // Prioridad 3: Por nombre
                        else if (node.data.nombre === changeToUndo.employeeName) {
                            targetRowNode = node;
                            matchedBy = 'nombre';
                        }
                    }
                });

                console.log('🔍 Búsqueda de fila:', {
                    buscando: changeToUndo.employeeId,
                    porNombre: changeToUndo.employeeName,
                    encontrado: !!targetRowNode,
                    matchedBy: matchedBy
                });

                if (targetRowNode) {
                    console.log('🎯 Fila encontrada, actualizando grid...');
                    // Actualizar el dato directamente
                    const updatedData = { ...(targetRowNode as any).data };
                    const oldValue = updatedData[changeToUndo.day];
                    updatedData[changeToUndo.day] = changeToUndo.oldValue;

                    console.log(`🔄 Cambiando ${changeToUndo.employeeName} día ${changeToUndo.day}: "${oldValue}" → "${changeToUndo.oldValue}"`);

                    // Estrategia 1: Actualizar toda la fila
                    (targetRowNode as any).setData(updatedData);

                    // Estrategia 2: También actualizar la celda específica directamente
                    try {
                        gridApiRef.current.setValue(targetRowNode, changeToUndo.day, changeToUndo.oldValue);
                        console.log('📝 setValue aplicado directamente');
                    } catch (error) {
                        console.log('⚠️ setValue falló, usando setData solamente');
                    }

                    // Estrategia agresiva de actualización visual
                    console.log('🔄 Aplicando actualización visual agresiva...');

                    // 1. Refresh específico de la celda
                    try {
                        gridApiRef.current.refreshCells({
                            rowNodes: [targetRowNode],
                            columns: [changeToUndo.day],
                            force: true
                        });
                        console.log('✅ refreshCells aplicado');
                    } catch (e) {
                        console.log('⚠️ refreshCells falló:', e);
                    }

                    // 2. Redraw de la fila
                    try {
                        gridApiRef.current.redrawRows({ rowNodes: [targetRowNode] });
                        console.log('✅ redrawRows aplicado');
                    } catch (e) {
                        console.log('⚠️ redrawRows falló:', e);
                    }

                    // 3. Actualización completa del grid como último recurso
                    try {
                        gridApiRef.current.refreshCells({ force: true });
                        console.log('✅ refreshCells completo aplicado');
                    } catch (e) {
                        console.log('⚠️ refreshCells completo falló:', e);
                    }

                    // 4. Forzar re-render completo
                    setTimeout(() => {
                        try {
                            gridApiRef.current.redrawRows();
                            console.log('✅ redrawRows completo aplicado (delayed)');
                        } catch (e) {
                            console.log('⚠️ redrawRows completo falló:', e);
                        }
                    }, 10);

                    console.log(`✅ Grid actualizado y refrescado: ${changeToUndo.employeeName} día ${changeToUndo.day} = "${changeToUndo.oldValue}"`);

                    // Verificar que el cambio se aplicó
                    const currentValue = (targetRowNode as any).data[changeToUndo.day];
                    console.log(`🔍 Verificación - Valor actual en grid: "${currentValue}"`);

                    // Remover el cambio específico de la lista
                    setChanges((prev) => prev.filter(change => change.id !== changeId));

                    // Notificar al hook padre que se deshizo un cambio
                    if (onUndoCallback.current) {
                        onUndoCallback.current(changeToUndo.id);
                    }

                    toast.success('Cambio deshecho', {
                        description: `${changeToUndo.employeeName} - Día ${changeToUndo.day}`,
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

    // Deshacer último cambio - simplificado para usar undoSpecificChange
    const undoLastChange = useCallback(() => {
        if (changes.length === 0) {
            toast.warning('No hay cambios para deshacer');
            return;
        }

        // Obtener el ID del último cambio y usar undoSpecificChange
        const lastChangeId = changes[changes.length - 1].id;
        console.log('📝 Deshaciendo último cambio con ID:', lastChangeId);
        undoSpecificChange(lastChangeId);
    }, [changes, undoSpecificChange]);

    // Limpiar historial de cambios (y opcionalmente restaurar grid)
    const clearAllChanges = useCallback((originalData?: any[]) => {
        ('Limpiando historial del sistema simple...');

        // Solo restaurar grid si se proporcionan datos originales
        if (originalData && gridApiRef.current) {
            try {
                ('Restaurando grid usando sistema simple...');

                // Actualizar cada fila en el grid con los datos originales
                originalData.forEach((originalRow) => {
                    let targetRowNode = null;
                    gridApiRef.current.forEachNode((node: any) => {
                        if (
                            node.data &&
                            (String(node.data.employee_id) === String(originalRow.employee_id) ||
                                String(node.data.id) === String(originalRow.id) ||
                                node.data.nombre === originalRow.nombre)
                        ) {
                            targetRowNode = node;
                        }
                    });

                    if (targetRowNode) {
                        // Restaurar todos los datos del empleado
                        (targetRowNode as any).setData({ ...originalRow });
                    }
                });

                ('Grid restaurado por sistema simple');
            } catch (error) {
                console.error('Error al restaurar grid en sistema simple:', error);
            }
        } else {
            ('Solo limpiando historial (sin restaurar grid)');
        }

        // Siempre limpiar el historial de cambios
        setChanges([]);

        ('Historial del sistema simple limpiado');
    }, []);

    // Establecer referencia del grid API
    const setGridApi = useCallback((api: any) => {
        gridApiRef.current = api;
        console.log('Grid API establecida:', !!api);
    }, []);

    // Establecer callback para notificar undo
    const setOnUndoCallback = useCallback((callback: (changeId: string) => void) => {
        onUndoCallback.current = callback;
    }, []);

    return {
        changes,
        changeCount: changes.length,
        canUndo: changes.length > 0,
        recordChange,
        undoLastChange,
        undoSpecificChange, // Nueva función para deshacer cambio específico
        getChangeIds, // Nueva función para obtener lista de IDs
        clearAllChanges,
        setGridApi,
        getGridApi: () => gridApiRef.current, // Exponer acceso al Grid API
        setOnUndoCallback, // Nueva función para establecer callback
    };
};
