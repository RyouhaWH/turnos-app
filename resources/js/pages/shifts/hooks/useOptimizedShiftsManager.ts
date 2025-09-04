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
    const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);

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
        if (oldValue === newValue) return;

        console.log('Registrando cambio:', { employee, day, oldValue, newValue });

        const employeeId = getEmployeeId({ nombre: employee, rut } as TurnoData);

        // 1. Registrar en el sistema simple de undo (para deshacer directo en grid)
        recordChange(employeeId, employee, day, oldValue, newValue);

        // 2. Registrar en el sistema complejo (para resumen y backend)
        const change: OptimizedGridChange = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            employeeId,
            employeeName: employee,
            employeeRut: rut,
            day,
            oldValue,
            newValue,
            timestamp: Date.now(),
            applied: true,
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

            if (newValue) {
                newResumen[employeeId].turnos[day] = newValue;
            } else {
                delete newResumen[employeeId].turnos[day];
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

    }, [getEmployeeId, originalChangeDate, selectedDate, recordChange]);

    // Sistema de deshacer que usa el grid API directamente
    const undoChange = useCallback(() => {
        // Usar el sistema simple que actualiza directamente el grid
        simpleUndoLastChange();

        // También remover el último cambio del sistema complejo para mantener consistencia
        if (gridChanges.length > 0) {
            setGridChanges(prev => prev.slice(0, -1));

            // Actualizar resumen si es necesario
            const lastChange = gridChanges[gridChanges.length - 1];
            if (lastChange) {
                setResumen(prev => {
                    const newResumen = { ...prev };
                    const employeeId = lastChange.employeeId;

                    if (newResumen[employeeId]) {
                        if (lastChange.oldValue) {
                            newResumen[employeeId].turnos[lastChange.day] = lastChange.oldValue;
                        } else {
                            delete newResumen[employeeId].turnos[lastChange.day];
                        }

                        if (Object.keys(newResumen[employeeId].turnos || {}).length === 0) {
                            delete newResumen[employeeId];
                        }
                    }

                    return newResumen;
                });
            }

            // Limpiar estados si no hay más cambios
            if (gridChanges.length === 1) {
                setShowPendingChanges(false);
                setOriginalChangeDate(null);
            }
        }
    }, [simpleUndoLastChange, gridChanges]);

    // Deshacer cambio específico por ID - Restauración directa en grid
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

        // Usar el Grid API directamente para restaurar el valor específico
        const gridApi = getSimpleUndoGridApi();

        if (gridApi) {
            console.log('🔍 Buscando empleado en grid:', changeToUndo.employeeName);

            // Buscar el nodo específico en el grid
            let targetNode = null;
            gridApi.forEachNode((node: any) => {
                if (node.data) {
                    // Buscar por múltiples criterios para mayor precisión
                    const matchesEmployee =
                        node.data.nombre === changeToUndo.employeeName ||
                        String(node.data.employee_id) === String(changeToUndo.employeeId) ||
                        String(node.data.id) === String(changeToUndo.employeeId);

                    if (matchesEmployee) {
                        targetNode = node;
                    }
                }
            });

            if (targetNode) {
                console.log('✅ Nodo encontrado, restaurando valor específico...');
                console.log('📊 Datos actuales:', (targetNode as any).data[changeToUndo.day]);

                // Restaurar el valor específico directamente
                const newData = { ...(targetNode as any).data };
                newData[changeToUndo.day] = changeToUndo.oldValue;

                (targetNode as any).setData(newData);

                console.log('✅ Valor restaurado en grid:', changeToUndo.oldValue);

                // Forzar actualización del grid
                gridApi.refreshCells({ force: true });
            } else {
                console.warn('❌ No se encontró el nodo del empleado en el grid');
                toast.error('No se pudo encontrar el empleado en el grid');
                return;
            }
        } else {
            console.warn('❌ Grid API no disponible');
            toast.error('Grid no disponible para restaurar');
            return;
        }

        // Remover el cambio específico del historial
        setGridChanges(prev => {
            const filtered = prev.filter(change => change.id !== changeId);
            console.log(`📋 Cambios restantes: ${filtered.length} (eliminado: ${changeId})`);
            return filtered;
        });

        // Actualizar resumen removiendo este cambio específico
        setResumen(prev => {
            const newResumen = { ...prev };
            const employeeKey = changeToUndo.employeeId;

            if (newResumen[employeeKey]?.turnos) {
                if (changeToUndo.oldValue === '' || !changeToUndo.oldValue) {
                    // Si el valor original era vacío, eliminar la entrada
                    delete newResumen[employeeKey].turnos[changeToUndo.day];
                    console.log(`🗑️ Eliminada entrada de turno para día ${changeToUndo.day}`);
                } else {
                    // Restaurar el valor original en el resumen
                    newResumen[employeeKey].turnos[changeToUndo.day] = changeToUndo.oldValue;
                    console.log(`🔄 Restaurado valor en resumen: ${changeToUndo.oldValue}`);
                }

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

    // Simplificar redo por ahora - implementación básica
    const redoChange = useCallback(() => {
        toast.info('Función de rehacer en desarrollo', {
            description: 'Por ahora usa Ctrl+Z para deshacer cambios.',
            duration: 2000,
        });
    }, []);

    // Filtrado optimizado con memoización
    const filterData = useCallback((data: TurnoData[], term: string) => {
        if (!term.trim()) return data;

        const lowerTerm = term.toLowerCase();
        return data.filter(item => {
            const nombreCompleto = item.nombre?.toLowerCase() || '';
            if (nombreCompleto.includes(lowerTerm)) return true;

            if (item.first_name && item.paternal_lastname) {
                const nombreFormateado = `${String(item.first_name)} ${String(item.paternal_lastname)}`.toLowerCase();
                if (nombreFormateado.includes(lowerTerm)) return true;
            }

            return [item.first_name, item.paternal_lastname, item.maternal_lastname]
                .some(field => field && String(field).toLowerCase().includes(lowerTerm));
        });
    }, []);

    const filteredRowData = useMemo(() =>
        filterData(rowData, debouncedSearchTerm),
        [rowData, debouncedSearchTerm, filterData]
    );

    // Función para guardar cambios optimizada
    const handleActualizarCambios = useCallback(async (comentarioNuevo: string) => {
        if (Object.keys(resumen).length === 0) {
            toast.warning('No hay cambios para guardar');
            return;
        }

        setIsSaving(true);

        const fechaParaCambios = originalChangeDate || selectedDate;
        const mes = fechaParaCambios.getMonth() + 1;
        const año = fechaParaCambios.getFullYear();

        const datosAEnviar = {
            cambios: resumen,
            comentario: comentarioNuevo,
            mes,
            año,
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
    }, [resumen, originalChangeDate, selectedDate, getCacheKey, loadDataOptimized]);


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
    const listaCambios = useMemo(() => {
        return gridChanges.map(change => ({
            id: change.id,
            employeeId: change.employeeId,
            employeeName: change.employeeName,
            employeeRut: change.employeeRut,
            day: change.day,
            oldValue: change.oldValue,
            newValue: change.newValue,
            timestamp: change.timestamp,
        }));
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
        showEmployeeSelector,
        listaCambios,
        hasEditPermissions,
        processing,
        errors,
        isProcessingChanges,

        // Estados de historial (usando sistema simple)
        canUndo: simpleCanUndo,
        canRedo: false, // Simplificado por ahora
        changeCount: simpleChangeCount,

        // Funciones principales
        setSelectedDate,
        setSearchTerm: setSearchInputTerm,
        setShowEmployeeSelector,
        cargarTurnosPorMes: loadDataOptimized,
        registerChange,
        handleActualizarCambios,

        // Funciones de historial
        undoChange,
        undoSpecificChange,
        redoChange,

        // Funciones de empleados
        getEmployeeId,
        addEmployeeToGrid,
        removeEmployeeFromGrid,

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
