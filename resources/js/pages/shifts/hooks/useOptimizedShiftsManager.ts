import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useSimpleUndo } from './useSimpleUndo';

interface TurnoData {
    id: string;
    nombre: string;
    amzoma?: boolean | string | number;
    first_name?: string;
    paternal_lastname?: string;
    rut?: string;
    employee_id?: string | number;
    [key: string]: string | boolean | number | undefined;
}

// Sistema optimizado de cambios con mejor tracking
interface OptimizedGridChange {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeRut: string;
    day: string;
    oldValue: string;
    newValue: string;
    timestamp: number;
    applied: boolean; // Track if change has been applied to grid
    undone: boolean; // Track if change has been undone (for history display)
    batch?: string; // Group related changes
}

// Cache para datos
interface DataCache {
    [key: string]: {
        data: TurnoData[];
        timestamp: number;
        month: number;
        year: number;
    };
}

// Hook optimizado para gestión de turnos
export const useOptimizedShiftsManager = (employee_rol_id: number) => {
    const { data, setData, post, processing, errors } = useForm({
        cambios: {},
        comentario: '',
        mes: new Date().getMonth() + 1,
        año: new Date().getFullYear(),
    });

    const { props } = usePage<{ turnos?: TurnoData[]; auth: { user: any } }>();

    // Cache refs para mejor performance
    const dataCache = useRef<DataCache>({});

    // Verificar permisos
    const user = props?.auth?.user;
    const hasEditPermissions = user?.roles?.some((role: any) =>
        role.name === 'Supervisor' || role.name === 'Administrador'
    ) || false;

    // Hook simple para undo que funciona directamente con el grid
    const {
        changes: simpleChanges,
        changeCount: simpleChangeCount,
        canUndo: simpleCanUndo,
        recordChange,
        undoLastChange: simpleUndoLastChange,
        clearAllChanges: simpleClearAllChanges,
        setGridApi: setSimpleUndoGridApi,
        getGridApi: getSimpleUndoGridApi,
    } = useSimpleUndo();

    // Función para establecer Grid API solo en sistema simple
    const setGridApi = useCallback((api: any) => {
        console.log('Configurando Grid API en sistema simple...');
        setSimpleUndoGridApi(api);
    }, [setSimpleUndoGridApi]);

    // Estados principales optimizados
    const [rowData, setRowData] = useState<TurnoData[]>([]);
    const [originalData, setOriginalData] = useState<TurnoData[]>([]); // Backup para undo
    const [gridChanges, setGridChanges] = useState<OptimizedGridChange[]>([]);
    const [resumen, setResumen] = useState<Record<string, any>>({});
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const [isProcessingChanges, setIsProcessingChanges] = useState(false);

    // Estados de UI
    const [searchInputTerm, setSearchInputTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchInputTerm.trim(), 250);
    const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
    const [availableEmployees, setAvailableEmployees] = useState<TurnoData[]>([]);

    // Estados de cambios
    const [originalChangeDate, setOriginalChangeDate] = useState<Date | null>(null);
    const [showPendingChanges, setShowPendingChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Título del mes derivado
    const currentMonthTitle = useMemo(() => {
        return selectedDate.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' });
    }, [selectedDate]);

    // Función de ordenamiento optimizada
    const sortByAmzomaAndName = useCallback((a: TurnoData, b: TurnoData) => {
        const isAmzomaA = a.amzoma === true || a.amzoma === 'true' || a.amzoma === 1;
        const isAmzomaB = b.amzoma === true || b.amzoma === 'true' || b.amzoma === 1;

        if (!isAmzomaA && isAmzomaB) return -1;
        if (isAmzomaA && !isAmzomaB) return 1;

        const nombreA = a.first_name && a.paternal_lastname
            ? `${String(a.first_name).split(' ')[0]} ${String(a.paternal_lastname)}`.toLowerCase()
            : String(a.nombre || '').toLowerCase();
        const nombreB = b.first_name && b.paternal_lastname
            ? `${String(b.first_name).split(' ')[0]} ${String(b.paternal_lastname)}`.toLowerCase()
            : String(b.nombre || '').toLowerCase();

        return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
    }, []);

    // Datos iniciales ordenados con memoización
    const datosInicialesOrdenados = useMemo(() => {
        if (!props?.turnos || !Array.isArray(props.turnos)) {
            return [];
        }
        return [...props.turnos].sort(sortByAmzomaAndName);
    }, [props?.turnos, sortByAmzomaAndName]);

    // Función optimizada para obtener ID del empleado
    const getEmployeeId = useCallback((employee: TurnoData): string => {
        return String(employee.employee_id || employee.id || employee.rut || employee.nombre);
    }, []);

    // Cache key generator
    const getCacheKey = useCallback((year: number, month: number) => {
        return `${employee_rol_id}-${year}-${month}`;
    }, [employee_rol_id]);

    // Función optimizada de carga de datos con cache
    const loadDataOptimized = useCallback(async (fecha: Date, showToast = false) => {
        const year = fecha.getFullYear();
        const month = fecha.getMonth() + 1;
        const cacheKey = getCacheKey(year, month);

        // Verificar cache primero
        const cached = dataCache.current[cacheKey];
        const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

        if (cached && cacheAge < CACHE_DURATION) {
            setRowData([...cached.data]);
            setOriginalData([...cached.data]);
            setAvailableEmployees([...cached.data]);

            if (showToast) {
                toast.success('Datos cargados desde cache', {
                    description: `${cached.data.length} empleados cargados`,
                    duration: 2000,
                });
            }
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`/api/turnos/${year}/${month}/${employee_rol_id}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const turnosArray = Object.values(data) as TurnoData[];
            const turnosOrdenados = turnosArray.sort(sortByAmzomaAndName);

            // Guardar en cache
            dataCache.current[cacheKey] = {
                data: turnosOrdenados,
                timestamp: Date.now(),
                month,
                year,
            };

            // Limpiar cache antiguo (mantener solo últimos 3 meses)
            const cacheKeys = Object.keys(dataCache.current);
            if (cacheKeys.length > 3) {
                const oldestKey = cacheKeys.reduce((oldest, key) => {
                    return dataCache.current[key].timestamp < dataCache.current[oldest].timestamp ? key : oldest;
                });
                delete dataCache.current[oldestKey];
            }

            setRowData([...turnosOrdenados]);
            setOriginalData([...turnosOrdenados]);
            setAvailableEmployees([...turnosOrdenados]);


            if (showToast) {
                toast.success('Turnos cargados correctamente', {
                    description: `Se cargaron ${turnosOrdenados.length} empleados para ${fecha.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}`,
                    duration: 3000,
                });
            }

        } catch (error) {
            console.error('Error al cargar turnos:', error);
            if (showToast) {
                toast.error('Error al cargar turnos', {
                    description: 'Hubo un problema al cargar los turnos del mes seleccionado.',
                    duration: 4000,
                });
            }
        } finally {
            setLoading(false);
        }
    }, [employee_rol_id, getCacheKey, sortByAmzomaAndName]);


    // Función simplificada para registrar cambios (ahora usa ambos sistemas)
    const registerChange = useCallback((employee: string, rut: string, day: string, oldValue: string, newValue: string) => {
        // Normalizar valores: convertir undefined/null a cadena vacía
        const normalizedOldValue = String(oldValue || '').trim();
        const normalizedNewValue = String(newValue || '').trim();

        // Si no hay cambio real, no registrar
        if (normalizedOldValue === normalizedNewValue) {
            console.log('No hay cambio real, ignorando:', { employee, day, oldValue: normalizedOldValue, newValue: normalizedNewValue });
            return;
        }

        console.log('Registrando cambio:', { employee, day, oldValue: normalizedOldValue, newValue: normalizedNewValue });

        const employeeId = getEmployeeId({ nombre: employee, rut } as TurnoData);

        // 1. Registrar en el sistema simple de undo (para deshacer directo en grid)
        recordChange(employeeId, employee, day, normalizedOldValue, normalizedNewValue);

        // 2. Registrar en el sistema complejo (para historial y backend)
        const change: OptimizedGridChange = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            employeeId,
            employeeName: employee,
            employeeRut: rut,
            day,
            oldValue: normalizedOldValue,
            newValue: normalizedNewValue,
            timestamp: Date.now(),
            applied: true,
            undone: false, // Inicialmente no está deshecho
        };

        setGridChanges(prev => {
            const newChanges = [...prev, change];
            console.log('Total de cambios:', newChanges.length);
            return newChanges;
        });

        // Actualizar el resumen inmediatamente
        setResumen(prev => {
            const newResumen = { ...prev };

            if (!newResumen[employeeId]) {
                newResumen[employeeId] = {
                    rut: rut,
                    nombre: employee,
                    employee_id: employeeId,
                    turnos: {}
                };
            }

            if (normalizedNewValue) {
                newResumen[employeeId].turnos[day] = normalizedNewValue;
            } else {
                // Si el nuevo valor está vacío, registramos la eliminación
                newResumen[employeeId].turnos[day] = '';
            }

            // Limpiar objetos vacíos
            if (Object.keys(newResumen[employeeId].turnos || {}).length === 0) {
                delete newResumen[employeeId];
            }

            return newResumen;
        });

        // Establecer fecha de cambios si no está establecida
        if (!originalChangeDate) {
            setOriginalChangeDate(selectedDate);
            setShowPendingChanges(true);
        }

    }, [getEmployeeId, originalChangeDate, selectedDate, recordChange, rowData]);

    // Sistema de deshacer que usa el grid API directamente
    const undoChange = useCallback(() => {
        // Usar el sistema simple que actualiza directamente el grid
        simpleUndoLastChange();

        // También eliminar el último cambio de la lista para mantener consistencia con el sistema simple
        if (gridChanges.length > 0) {
            setGridChanges(prev => {
                // Eliminar el último cambio (igual que el sistema simple)
                const updated = prev.slice(0, -1);
                console.log(`📋 Último cambio eliminado de la lista`);

                // Reconstruir el resumen usando solo los cambios activos restantes
                const activeChanges = updated.filter(change => !change.undone);
                const undoneChanges = updated.filter(change => change.undone);

                console.log('🔍 Cambios deshechos:', undoneChanges.length);
                console.log('🔍 Cambios activos:', activeChanges.length);

                // Reconstruir el resumen completamente desde los cambios activos
                const newResumen: Record<string, any> = {};

                activeChanges.forEach(change => {
                    const employeeId = change.employeeId;

                    if (!newResumen[employeeId]) {
                        newResumen[employeeId] = {
                            rut: change.employeeRut,
                            nombre: change.employeeName,
                            employee_id: employeeId,
                            turnos: {}
                        };
                    }

                    // Agregar el turno al resumen
                    newResumen[employeeId].turnos[change.day] = change.newValue;
                    console.log(`✅ Agregado cambio activo al resumen: ${change.employeeName} - día ${change.day} = "${change.newValue}"`);
                });

                console.log('🔍 Estado final del resumen después de reconstruir:', Object.keys(newResumen).length, 'empleados');
                console.log(`🧹 Resumen reconstruido: ${activeChanges.length} cambios activos`);

                // Actualizar el resumen con el estado actualizado
                setResumen(newResumen);

                // Limpiar estados si no hay más cambios activos
                if (activeChanges.length === 0) {
                    setShowPendingChanges(false);
                    setOriginalChangeDate(null);
                }

                return updated;
            });
        }
    }, [simpleUndoLastChange, gridChanges]);

    // Callback para notificar cuando se han aplicado todos los cambios
    const onAllChangesApplied = useRef<(() => void) | null>(null);

    // Deshacer cambio específico por ID - Usar sistema simple que funciona
    const undoSpecificChange = useCallback((changeId: string) => {
        console.log('🎯 Deshaciendo cambio específico:', changeId);

        // Buscar el cambio en el historial
        const changeToUndo = gridChanges.find(change => change.id === changeId);
        if (!changeToUndo) {
            console.warn('❌ Cambio no encontrado:', changeId);
            toast.error('Cambio no encontrado');
            return;
        }

        console.log('✅ Cambio encontrado:', changeToUndo);
        console.log('📝 Restaurando valor:', changeToUndo.newValue, '→', changeToUndo.oldValue);

        // Usar el sistema simple que funciona correctamente
        const gridApi = getSimpleUndoGridApi();
        if (gridApi) {
            console.log('🔍 Usando sistema simple para restaurar...');

            try {
                // Buscar la fila en el grid usando la misma lógica del sistema simple
                let targetRowNode = null;
                gridApi.forEachNode((node: any) => {
                    if (node.data && (
                        String(node.data.employee_id) === String(changeToUndo.employeeId) ||
                        String(node.data.id) === String(changeToUndo.employeeId) ||
                        node.data.nombre === changeToUndo.employeeName
                    )) {
                        targetRowNode = node;
                    }
                });

                if (targetRowNode) {
                    console.log('✅ Nodo encontrado, restaurando valor específico...');

                    // Actualizar el dato directamente usando la misma lógica del sistema simple
                    const updatedData = { ...(targetRowNode as any).data };
                    updatedData[changeToUndo.day] = changeToUndo.oldValue;

                    // Aplicar la actualización al grid
                    (targetRowNode as any).setData(updatedData);

                    console.log(`✅ Grid actualizado: ${changeToUndo.employeeName} día ${changeToUndo.day} = "${changeToUndo.oldValue}"`);

                    // Forzar actualización del grid
                    gridApi.refreshCells({ force: true });
                } else {
                    console.error('❌ No se encontró la fila en el grid');
                    toast.error('No se pudo encontrar la fila para deshacer');
                    return;
                }
            } catch (error) {
                console.error('❌ Error al deshacer en el grid:', error);
                toast.error('Error al deshacer el cambio');
                return;
            }
        } else {
            console.error('❌ No hay referencia al grid API');
            toast.error('Grid no disponible para deshacer');
            return;
        }

        // También actualizar el rowData para mantener consistencia
        setRowData(prevRowData => {
            const updatedRowData = prevRowData.map(row => {
                // Buscar por múltiples criterios para mayor precisión
                const matchesEmployee =
                    row.nombre === changeToUndo.employeeName ||
                    String(row.employee_id) === String(changeToUndo.employeeId) ||
                    String(row.id) === String(changeToUndo.employeeId);

                if (matchesEmployee) {
                    console.log('✅ Empleado encontrado en rowData, restaurando valor...');
                    console.log('📊 Valor actual:', row[changeToUndo.day], '→ Valor a restaurar:', changeToUndo.oldValue);

                    return {
                        ...row,
                        [changeToUndo.day]: changeToUndo.oldValue
                    };
                }
                return row;
            });

            console.log('✅ rowData actualizado con valor restaurado');
            return updatedRowData;
        });

        // Marcar el cambio como deshecho en lugar de eliminarlo del historial
        setGridChanges(prev => {
            const updated = prev.map(change =>
                change.id === changeId
                    ? { ...change, undone: true }
                    : change
            );
            console.log(`📋 Cambio marcado como deshecho: ${changeId}`);
            return updated;
        });

        // Actualizar resumen eliminando completamente este cambio
        setResumen(prev => {
            const newResumen = { ...prev };
            const employeeKey = changeToUndo.employeeId;

            if (newResumen[employeeKey]?.turnos) {
                // Simplemente eliminar el día del resumen (no restaurar valor anterior)
                delete newResumen[employeeKey].turnos[changeToUndo.day];
                console.log(`🗑️ Eliminado cambio del resumen para día ${changeToUndo.day}`);

                // Si no quedan turnos, eliminar el empleado del resumen
                if (Object.keys(newResumen[employeeKey].turnos).length === 0) {
                    delete newResumen[employeeKey];
                    console.log(`🗑️ Eliminado empleado del resumen: ${changeToUndo.employeeName}`);
                }
            }

            return newResumen;
        });

        // Si no quedan cambios, limpiar estado
        const remainingChanges = gridChanges.filter(change => change.id !== changeId);
        if (remainingChanges.length === 0) {
            setShowPendingChanges(false);
            setOriginalChangeDate(null);
            console.log('🧹 Estado limpiado - no quedan cambios pendientes');
        }

        toast.success('Cambio específico deshecho', {
            description: `${changeToUndo.employeeName} - ${changeToUndo.day}: restaurado a "${changeToUndo.oldValue || 'vacío'}"`,
            duration: 3000,
        });

        console.log('🎉 Cambio específico deshecho exitosamente');
    }, [gridChanges, getSimpleUndoGridApi]);

    // Función para deshacer múltiples cambios con callback
    const undoSpecificChangesWithCallback = useCallback((changeIds: string[], onComplete?: () => void) => {
        console.log('🎯 Deshaciendo múltiples cambios:', changeIds);

        // Establecer el callback
        onAllChangesApplied.current = onComplete || null;

        // Contador de cambios pendientes
        let pendingChanges = changeIds.length;

        const onChangeApplied = () => {
            pendingChanges--;
            console.log(`📊 Cambios restantes: ${pendingChanges}`);

            if (pendingChanges === 0) {
                console.log('✅ Todos los cambios han sido aplicados');
                if (onAllChangesApplied.current) {
                    onAllChangesApplied.current();
                    onAllChangesApplied.current = null;
                }
            }
        };

        // Deshacer cada cambio con feedback visual
        changeIds.forEach((changeId, index) => {
            setTimeout(async () => {
                const changeToUndo = gridChanges.find(change => change.id === changeId);
                if (!changeToUndo) {
                    console.warn('❌ Cambio no encontrado:', changeId);
                    onChangeApplied();
                    return;
                }

                console.log(`🔄 Deshaciendo cambio ${index + 1}/${changeIds.length}: ${changeToUndo.employeeName} - Día ${changeToUndo.day}`);

                // Usar el sistema simple para deshacer
                const gridApi = getSimpleUndoGridApi();
                if (gridApi) {
                    try {
                        let targetRowNode = null;
                        gridApi.forEachNode((node: any) => {
                            if (node.data && (
                                String(node.data.employee_id) === String(changeToUndo.employeeId) ||
                                String(node.data.id) === String(changeToUndo.employeeId) ||
                                node.data.nombre === changeToUndo.employeeName
                            )) {
                                targetRowNode = node;
                            }
                        });

                        if (targetRowNode) {
                            // Actualizar la grid inmediatamente para feedback visual
                            const updatedData = { ...(targetRowNode as any).data };
                            updatedData[changeToUndo.day] = changeToUndo.oldValue;
                            (targetRowNode as any).setData(updatedData);
                            gridApi.refreshCells({ force: true });

                            console.log(`✅ Grid actualizado: ${changeToUndo.employeeName} día ${changeToUndo.day} = "${changeToUndo.oldValue}"`);

                            // Esperar un poco para que el usuario vea el cambio
                            await new Promise(resolve => setTimeout(resolve, 200));

                            // Marcar como deshecho
                            setGridChanges(prev => {
                                return prev.map(change =>
                                    change.id === changeId
                                        ? { ...change, undone: true }
                                        : change
                                );
                            });

                            // Actualizar resumen
                            setResumen(prev => {
                                const newResumen = { ...prev };
                                const employeeKey = changeToUndo.employeeId;
                                if (newResumen[employeeKey]?.turnos) {
                                    delete newResumen[employeeKey].turnos[changeToUndo.day];
                                    if (Object.keys(newResumen[employeeKey].turnos).length === 0) {
                                        delete newResumen[employeeKey];
                                    }
                                }
                                return newResumen;
                            });

                            // Actualizar rowData
                            setRowData(prevRowData => {
                                return prevRowData.map(row => {
                                    const matchesEmployee =
                                        row.nombre === changeToUndo.employeeName ||
                                        String(row.employee_id) === String(changeToUndo.employeeId) ||
                                        String(row.id) === String(changeToUndo.employeeId);

                                    if (matchesEmployee) {
                                        return {
                                            ...row,
                                            [changeToUndo.day]: changeToUndo.oldValue
                                        };
                                    }
                                    return row;
                                });
                            });

                            console.log(`✅ Cambio ${changeId} deshecho completamente`);
                        } else {
                            console.error('❌ No se encontró la fila para el cambio:', changeId);
                        }
                    } catch (error) {
                        console.error('❌ Error al deshacer cambio:', changeId, error);
                    }
                } else {
                    console.error('❌ Grid API no disponible para cambio:', changeId);
                }

                // Notificar que este cambio se completó
                onChangeApplied();
            }, index * 300); // Delay más largo para permitir feedback visual
        });
    }, [gridChanges, getSimpleUndoGridApi]);

    // Simplificar redo por ahora - implementación básica
    const redoChange = useCallback(() => {
        toast.info('Función de rehacer en desarrollo', {
            description: 'Por ahora usa Ctrl+Z para deshacer cambios.',
            duration: 2000,
        });
    }, []);


    // Función para guardar cambios optimizada
    const handleActualizarCambios = useCallback(async (comentarioNuevo: string, whatsappRecipients?: string[]) => {
        if (Object.keys(resumen).length === 0) {
            toast.warning('No hay cambios para guardar');
            return;
        }

        setIsSaving(true);

        const fechaParaCambios = originalChangeDate || selectedDate;
        const mes = fechaParaCambios.getMonth() + 1;
        const año = fechaParaCambios.getFullYear();

        // Transformar el resumen para usar IDs numéricos en lugar de nombres como claves
        const resumenTransformado: Record<string, any> = {};

        Object.entries(resumen).forEach(([employeeKey, employeeData]) => {
            // Buscar el empleado en rowData para obtener su ID numérico real
            const employeeInGrid = rowData.find(emp =>
                emp.nombre === employeeKey ||
                String(emp.employee_id) === employeeKey ||
                String(emp.id) === employeeKey
            );

            const realEmployeeId = String(employeeInGrid?.employee_id || employeeInGrid?.id || employeeKey);

            console.log('🔄 Transformando resumen:', {
                employeeKey,
                realEmployeeId,
                employeeInGrid: employeeInGrid ? { id: employeeInGrid.id, employee_id: employeeInGrid.employee_id, nombre: employeeInGrid.nombre } : null
            });

            resumenTransformado[realEmployeeId] = {
                ...employeeData,
                employee_id: realEmployeeId
            };
        });

        const datosAEnviar = {
            cambios: resumenTransformado,
            comentario: comentarioNuevo,
            mes,
            año,
            whatsapp_recipients: whatsappRecipients || [],
        };

        try {
            const response = await fetch('/turnos-mes/actualizar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(datosAEnviar)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Limpiar estados
            setResumen({});
            setGridChanges([]);
            setOriginalChangeDate(null);
            setShowPendingChanges(false);

            // Invalidar cache
            const cacheKey = getCacheKey(año, mes);
            delete dataCache.current[cacheKey];

            // Recargar datos
            await loadDataOptimized(fechaParaCambios, false);

            // Limpiar sistema simple de undo DESPUÉS de recargar
            console.log('Limpiando sistema simple después de recargar datos...');
            simpleClearAllChanges();
            console.log('Sistema simple limpiado, changeCount debería ser 0');

            toast.success('Cambios guardados exitosamente', {
                description: 'Los turnos fueron actualizados correctamente.',
                duration: 3000,
            });

        } catch (error) {
            console.error('Error al guardar cambios:', error);
            toast.error('Error al guardar cambios', {
                description: 'Hubo un problema al guardar los cambios. Intenta nuevamente.',
                duration: 4000,
            });
        } finally {
            setIsSaving(false);
        }
    }, [resumen, originalChangeDate, selectedDate, getCacheKey, loadDataOptimized, simpleClearAllChanges]);


    // Funciones de empleados (simplificadas para mejor performance)
    const addEmployeeToGrid = useCallback((employee: TurnoData) => {
        const employeeId = getEmployeeId(employee);
        setSelectedEmployees(prev => new Set([...prev, employeeId]));

        setRowData(prev => {
            if (!prev.find(e => getEmployeeId(e) === employeeId)) {
                return [...prev, employee].sort(sortByAmzomaAndName);
            }
            return prev;
        });
    }, [getEmployeeId, sortByAmzomaAndName]);

    const removeEmployeeFromGrid = useCallback((employee: TurnoData) => {
        const employeeId = getEmployeeId(employee);
        setSelectedEmployees(prev => {
            const newSet = new Set(prev);
            newSet.delete(employeeId);
            return newSet;
        });

        setRowData(prev => prev.filter(e => getEmployeeId(e) !== employeeId));
    }, [getEmployeeId]);

    // Agregar todos los empleados disponibles al grid
    const addAllEmployees = useCallback(() => {
        const newEmployeeIds = new Set(selectedEmployees);
        const employeesToAdd: TurnoData[] = [];

        availableEmployees.forEach(employee => {
            const employeeId = getEmployeeId(employee);
            if (!newEmployeeIds.has(employeeId)) {
                newEmployeeIds.add(employeeId);
                employeesToAdd.push(employee);
            }
        });

        setSelectedEmployees(newEmployeeIds);
        setRowData(prev => {
            const currentIds = new Set(prev.map(e => getEmployeeId(e)));
            const filteredToAdd = employeesToAdd.filter(e => !currentIds.has(getEmployeeId(e)));
            return [...prev, ...filteredToAdd].sort(sortByAmzomaAndName);
        });

        toast.success(`${employeesToAdd.length} empleados agregados al grid`, {
            description: 'Los empleados han sido agregados exitosamente',
            duration: 2000,
        });
    }, [availableEmployees, selectedEmployees, getEmployeeId, sortByAmzomaAndName]);

    // Limpiar todos los empleados del grid
    const clearAllEmployees = useCallback(() => {
        setSelectedEmployees(new Set());
        setRowData([]);

        toast.success('Grid limpiado', {
            description: 'Todos los empleados han sido removidos del grid',
            duration: 2000,
        });
    }, []);

    // Cerrar selector de empleados
    const closeEmployeeSelector = useCallback(() => {
        setSearchInputTerm('');
    }, []);

    // Efectos
    useEffect(() => {
        loadDataOptimized(selectedDate, false);
    }, [selectedDate, loadDataOptimized]);


    // Atajos de teclado
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey)) {
                switch (event.key) {
                    case 'z':
                        event.preventDefault();
                        if (event.shiftKey) {
                            redoChange();
                        } else {
                            undoChange();
                        }
                        break;
                    case 'y':
                        event.preventDefault();
                        redoChange();
                        break;
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [undoChange, redoChange]);

    // Compatibilidad con la interfaz existente
    // Contador de cambios activos (no deshechos)
    const activeChangeCount = useMemo(() => {
        const activeChanges = gridChanges.filter(change => !change.undone);
        const totalChanges = gridChanges.length;
        const undoneChanges = gridChanges.filter(change => change.undone);

        console.log('📊 Cálculo de activeChangeCount:');
        console.log('  - Total cambios:', totalChanges);
        console.log('  - Cambios activos:', activeChanges.length);
        console.log('  - Cambios deshechos:', undoneChanges.length);

        return activeChanges.length;
    }, [gridChanges]);

    // Función de filtrado de datos
    const filterData = useCallback((data: TurnoData[], term: string) => {
        if (!term.trim()) return data;

        return data.filter(item => {
            // Filtrar por nombre
            const nombreCompleto = item.nombre?.toLowerCase() || '';
            if (nombreCompleto.includes(term.toLowerCase())) return true;

            // Filtrar por first_name + paternal_lastname
            if (item.first_name && item.paternal_lastname) {
                const nombreFormateado = `${String(item.first_name)} ${String(item.paternal_lastname)}`.toLowerCase();
                if (nombreFormateado.includes(term.toLowerCase())) return true;
            }

            // Filtrar por campos individuales
            if (item.first_name && String(item.first_name).toLowerCase().includes(term.toLowerCase())) return true;
            if (item.paternal_lastname && String(item.paternal_lastname).toLowerCase().includes(term.toLowerCase())) return true;
            if (item.maternal_lastname && String(item.maternal_lastname).toLowerCase().includes(term.toLowerCase())) return true;
            if (item.rut && String(item.rut).toLowerCase().includes(term.toLowerCase())) return true;

            return false;
        });
    }, []);

    // Datos filtrados con memoización
    const filteredRowData = useMemo(() =>
        filterData(rowData, debouncedSearchTerm),
        [rowData, debouncedSearchTerm, filterData]
    );

    // Función de filtrado para empleados disponibles
    const filterAvailableEmployees = useCallback((term: string) => {
        if (!term.trim()) return availableEmployees;

        return availableEmployees.filter(item => {
            const nombreCompleto = item.nombre?.toLowerCase() || '';
            if (nombreCompleto.includes(term.toLowerCase())) return true;

            if (item.first_name && item.paternal_lastname) {
                const nombreFormateado = `${String(item.first_name)} ${String(item.paternal_lastname)}`.toLowerCase();
                if (nombreFormateado.includes(term.toLowerCase())) return true;
            }

            if (item.first_name && String(item.first_name).toLowerCase().includes(term.toLowerCase())) return true;
            if (item.paternal_lastname && String(item.paternal_lastname).toLowerCase().includes(term.toLowerCase())) return true;
            if (item.maternal_lastname && String(item.maternal_lastname).toLowerCase().includes(term.toLowerCase())) return true;

            return false;
        });
    }, [availableEmployees]);

    // Empleados disponibles filtrados
    const filteredAvailableEmployees = useMemo(
        () => filterAvailableEmployees(debouncedSearchTerm),
        [debouncedSearchTerm, filterAvailableEmployees]
    );

    const listaCambios = useMemo(() => {
        // Retornar TODOS los cambios (incluyendo deshechos) para mostrar historial completo
        return gridChanges.map(change => ({
            id: change.id,
            employeeId: change.employeeId,
            employeeName: change.employeeName,
            employeeRut: change.employeeRut,
            day: change.day,
            oldValue: change.oldValue,
            newValue: change.newValue,
            timestamp: change.timestamp,
            undone: change.undone, // Incluir estado de deshecho
        })).sort((a, b) => b.timestamp - a.timestamp); // Ordenar por timestamp descendente
    }, [gridChanges]);

    return {
        // Estados
        rowData,
        filteredRowData,
        resumen,
        selectedDate,
        currentMonthTitle,
        loading,
        originalChangeDate,
        isSaving,
        showPendingChanges,
        searchTerm: searchInputTerm,
        selectedEmployees,
        availableEmployees,
        filteredAvailableEmployees,
        listaCambios,
        hasEditPermissions,
        processing,
        errors,
        isProcessingChanges,

        // Estados de historial
        canUndo: simpleCanUndo,
        canRedo: false, // Simplificado por ahora
        changeCount: activeChangeCount, // Cambios activos (no deshechos)

        // Funciones principales
        setSelectedDate,
        setSearchTerm: setSearchInputTerm,
        cargarTurnosPorMes: loadDataOptimized,
        registerChange,
        handleActualizarCambios,

        // Funciones de historial
        undoChange,
        undoSpecificChange,
        undoSpecificChangesWithCallback,
        redoChange,
        clearAllChanges: simpleClearAllChanges,

        // Funciones de empleados
        getEmployeeId,
        addEmployeeToGrid,
        removeEmployeeFromGrid,
        addAllEmployees,
        clearAllEmployees,
        closeEmployeeSelector,

        // Funciones de utilidad
        getTotalEmployees: () => rowData.length,
        filterData,
        handleResumenUpdate: (resumen: any) => {
            setResumen(resumen);
            setData(prev => ({ ...prev, cambios: resumen }));
        },

        // Función para registrar el API del grid (para undo directo)
        setGridApi,
    };
};
