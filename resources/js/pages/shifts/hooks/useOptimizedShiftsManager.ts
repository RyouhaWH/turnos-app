import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { useSimpleUndo } from './useSimpleUndo';
import { useDebounce } from '@/hooks/useDebounce';

// Importar tipos
export interface TurnoData {
    id?: number;
    employee_id?: number;
    nombre: string;
    rut: string;
    first_name?: string;
    paternal_lastname?: string;
    maternal_lastname?: string;
    amzoma?: boolean | string | number;
    [key: string]: any; // Para los días dinámicos
}

interface GridChange {
    id: string;
    employeeId: string | number;
    employeeName: string;
    employeeRut: string;
    day: string;
    oldValue: string;
    newValue: string;
    timestamp: number;
    undone: boolean; // Track if change has been undone (for history display)
}

interface ChangeItem {
    id: string;
    employeeId: string | number;
    employeeName: string;
    employeeRut: string;
    day: string;
    oldValue: string;
    newValue: string;
    timestamp: number;
}

export interface CambiosPorFuncionario {
    [empleadoId: string]: {
        rut: string;
        nombre: string;
        employee_id: string | number;
        paternal_lastname?: string;
        maternal_lastname?: string;
        turnos: Record<string, string>;
    };
}

export const useOptimizedShiftsManager = (employee_rol_id: number) => {
    // Obtener datos iniciales de Inertia
    const { props } = usePage<{ turnos: TurnoData[]; auth: { user: any } }>();

    // Verificar permisos
    const user = props.auth?.user;
    const hasEditPermissions = user?.roles?.some((role: any) => role.name === 'Supervisor' || role.name === 'Administrador') || false;

    // Ordenar datos iniciales: primero Municipal, luego Amzoma, ambos alfabéticamente
    const datosInicialesOrdenados = useMemo(() => {
        console.log('🔍 Props recibidas:', props);
        console.log('📊 Turnos en props:', props.turnos?.length || 0);

        if (!props.turnos || !Array.isArray(props.turnos)) {
            console.warn('⚠️ No hay datos de turnos en props o no es un array');
            return [];
        }

        console.log('✅ Datos de turnos válidos, ordenando...');
        return props.turnos.sort((a: TurnoData, b: TurnoData) => {
            // Primero ordenar por amzoma (false primero, true después) - Municipales arriba
            const isAmzomaA = a.amzoma === true || a.amzoma === 'true' || a.amzoma === 1;
            const isAmzomaB = b.amzoma === true || b.amzoma === 'true' || b.amzoma === 1;

            if (!isAmzomaA && isAmzomaB) return -1;
            if (isAmzomaA && !isAmzomaB) return 1;

            // Si ambos tienen el mismo estado de amzoma, ordenar alfabéticamente
            const nombreA = a.first_name && a.paternal_lastname
                ? `${String(a.first_name).split(' ')[0]} ${String(a.paternal_lastname)}`.toLowerCase()
                : String(a.nombre || '').toLowerCase();
            const nombreB = b.first_name && b.paternal_lastname
                ? `${String(b.first_name).split(' ')[0]} ${String(b.paternal_lastname)}`.toLowerCase()
                : String(b.nombre || '').toLowerCase();

            return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
        });
    }, [props.turnos]);

    // Estados principales
    const [rowData, setRowData] = useState<TurnoData[]>(datosInicialesOrdenados);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [resumen, setResumen] = useState<CambiosPorFuncionario>({});
    const [showPendingChanges, setShowPendingChanges] = useState(false);
    const [originalChangeDate, setOriginalChangeDate] = useState<Date | null>(null);
    const [isProcessingChanges, setIsProcessingChanges] = useState(false);
    const [gridChanges, setGridChanges] = useState<GridChange[]>([]);
    const [loading, setLoading] = useState(false);

    // Estados para búsqueda y filtrado
    const [searchTerm, setSearchTerm] = useState<string>('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Hook simple para undo que funciona directamente con el grid
    const {
        changes: simpleChanges,
        canUndo: simpleCanUndo,
        recordChange,
        undoLastChange: simpleUndoLastChange,
        undoSpecificChange: simpleUndoSpecificChange,
        getChangeIds: getSimpleChangeIds,
        clearAllChanges: simpleClearAllChanges,
        setGridApi: setSimpleGridApi,
        getGridApi: getSimpleUndoGridApi,
        setOnUndoCallback: setSimpleOnUndoCallback,
    } = useSimpleUndo();

    // Callback para sincronizar undo con gridChanges
    const onSimpleUndo = useCallback((changeId: string) => {
        console.log('🔄 Sincronizando undo simple con gridChanges:', changeId);
        // Aquí podríamos sincronizar con gridChanges si es necesario
    }, []);

    // Establecer el callback en el hook de undo
    useEffect(() => {
        setSimpleOnUndoCallback(onSimpleUndo);
    }, [onSimpleUndo, setSimpleOnUndoCallback]);

    // Estados adicionales
    const [originalData, setOriginalData] = useState<TurnoData[]>([]); // Backup para undo
    const [isUndoing, setIsUndoing] = useState(false);

    // Form de Inertia
    const { data, setData, post, processing, errors } = useForm<{
        changes: CambiosPorFuncionario;
        employee_rol_id: number;
        fecha: string;
        comentario: string;
    }>({
        changes: {},
        employee_rol_id: employee_rol_id,
        fecha: '',
        comentario: '',
    });

    // Función para obtener ID del empleado
    const getEmployeeId = useCallback((employee: TurnoData): string | number => {
        return employee.employee_id || employee.id || `temp_${employee.nombre}_${employee.rut}`;
    }, []);

    // Función principal para registrar cambios
    const registerChange = useCallback((employee: string, rut: string, day: string, oldValue: string, newValue: string, changeId?: string) => {
        console.log('🔄 registerChange llamado:', { employee, rut, day, oldValue, newValue });

        if (oldValue === newValue) {
            console.log('⚠️ Valores iguales, no registrando cambio');
            return;
        }

        // Buscar empleado por nombre primero, luego por RUT si está disponible
        let employeeData = rowData.find(emp => emp.nombre === employee);

        // Si no se encuentra por nombre y hay RUT, buscar por RUT
        if (!employeeData && rut && rut.trim() !== '') {
            employeeData = rowData.find(emp => emp.rut === rut);
        }

        // Si aún no se encuentra, intentar por employee_id si el employee string es un ID
        if (!employeeData && !isNaN(Number(employee))) {
            employeeData = rowData.find(emp => String(emp.employee_id) === employee || String(emp.id) === employee);
        }

        if (!employeeData) {
            console.error('❌ No se encontró el empleado:', employee, rut);
            console.log('📊 RowData disponible:', rowData.map(emp => ({
                nombre: emp.nombre,
                rut: emp.rut,
                employee_id: emp.employee_id,
                id: emp.id
            })));
            return;
        }

        const employeeId = getEmployeeId(employeeData);
        console.log('✅ Empleado encontrado:', {
            nombre: employeeData.nombre,
            rut: employeeData.rut,
            employee_id: employeeData.employee_id,
            finalId: employeeId
        });

        // 1. Registrar en el sistema simple de undo (para deshacer directo en grid)
        console.log('📝 Registrando en sistema simple...');
        console.log('📋 Parámetros para recordChange:', {
            employeeId: String(employeeId),
            employee: employee,
            day: day,
            oldValue: oldValue,
            newValue: newValue,
            changeId: changeId
        });

        recordChange(
            String(employeeId),
            employee,
            day,
            oldValue,
            newValue,
            changeId
        );

        // Verificar que se registró correctamente
        setTimeout(() => {
            console.log('🔍 Verificando registro en sistema simple:', {
                simpleChangesCount: simpleChanges.length,
                canUndo: simpleCanUndo,
                ultimoCambio: simpleChanges[simpleChanges.length - 1]
            });
        }, 50);

        console.log('✅ Registrado en sistema simple');

        // 2. Registrar en el historial completo de cambios
        const gridChangeId = changeId || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newChange: GridChange = {
            id: gridChangeId,
            employeeId: String(employeeId),
            employeeName: employee,
            employeeRut: rut,
            day,
            oldValue,
            newValue,
            timestamp: Date.now(),
            undone: false, // Inicialmente no está deshecho
        };

        setGridChanges(prev => [...prev, newChange]);

        // 3. Actualizar el resumen para mostrar al usuario
        setResumen(prev => {
            const newResumen = { ...prev };
            const employeeIdStr = String(employeeId);

            if (!newResumen[employeeIdStr]) {
                newResumen[employeeIdStr] = {
                    rut,
                    nombre: employee,
                    employee_id: employeeId,
                    paternal_lastname: employeeData.paternal_lastname,
                    maternal_lastname: employeeData.maternal_lastname,
                    turnos: {}
                };
            }

            // Agregar o actualizar el turno
            newResumen[employeeIdStr].turnos[day] = newValue;

            // Limpiar objetos vacíos
            if (Object.keys(newResumen[employeeIdStr].turnos || {}).length === 0) {
                delete newResumen[employeeIdStr];
            }

            return newResumen;
        });

        // Establecer fecha de cambios si no está establecida
        if (!originalChangeDate) {
            setOriginalChangeDate(selectedDate);
            setShowPendingChanges(true);
        }

    }, [getEmployeeId, originalChangeDate, selectedDate, recordChange, rowData]);


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

        // Actualizar el estado de gridChanges
        setGridChanges(prev => {
            const updated = prev.map(change =>
                change.id === changeId
                    ? { ...change, undone: true }
                    : change
            );

            // Reconstruir el resumen usando solo los cambios activos restantes
            const activeChanges = updated.filter(change => !change.undone);

            console.log('🔍 Cambios activos después de undo:', activeChanges.length);

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

        toast.success('Cambio deshecho', {
            description: `${changeToUndo.employeeName} - Día ${changeToUndo.day}`,
            duration: 2000,
        });

    }, [gridChanges, getSimpleUndoGridApi]);

    // Sistema de deshacer que usa el sistema simple directamente
    const undoChange = useCallback(() => {
        console.log('🔄 undoChange llamado');
        console.log('📊 Estado actual:', {
            simpleChangesCount: simpleChanges.length,
            gridChangesCount: gridChanges.length,
            canUndo: simpleCanUndo,
            isUndoing: isUndoing,
            simpleChanges: simpleChanges,
            gridChanges: gridChanges
        });

        // Establecer flag de undoing temporalmente
        setIsUndoing(true);

        // Usar directamente el sistema simple que sabemos que funciona
        if (!simpleCanUndo) {
            toast.warning('No hay cambios para deshacer');
            return;
        }

        console.log('✅ Usando simpleUndoLastChange directamente');

        // Guardar el estado antes del undo para comparar
        const beforeUndo = {
            simpleChangesCount: simpleChanges.length,
            gridChangesCount: gridChanges.length
        };

        simpleUndoLastChange();

        // Verificar después del undo con un pequeño delay para que React actualice
        setTimeout(() => {
            const afterUndo = {
                simpleChangesCount: simpleChanges.length,
                gridChangesCount: gridChanges.length
            };

            console.log('📊 Estado después del undo:', {
                antes: beforeUndo,
                después: afterUndo,
                cambióSimple: beforeUndo.simpleChangesCount !== afterUndo.simpleChangesCount,
                cambióGrid: beforeUndo.gridChangesCount !== afterUndo.gridChangesCount
            });
        }, 100);

        // Sincronizar con gridChanges si es necesario
        if (gridChanges.length > 0) {
            console.log('🔄 Sincronizando con gridChanges...');

            const lastChange = gridChanges[gridChanges.length - 1];
            console.log('🔄 Último cambio a deshacer:', lastChange);

            // Actualizar rowData para forzar re-render del grid
            setRowData(prevRowData => {
                console.log('🔄 Actualizando rowData para forzar re-render...');
                return prevRowData.map(emp => {
                    const empId = String(emp.employee_id || emp.id);
                    if (empId === String(lastChange.employeeId)) {
                        const updatedEmp = { ...emp };
                        updatedEmp[lastChange.day] = lastChange.oldValue;
                        console.log(`🔄 Actualizando rowData: ${emp.nombre} día ${lastChange.day} = "${lastChange.oldValue}"`);
                        return updatedEmp;
                    }
                    return emp;
                });
            });

            setGridChanges(prev => {
                const updated = prev.slice(0, -1); // Remover último cambio

                // Reconstruir resumen
                const activeChanges = updated.filter(change => !change.undone);
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
                    newResumen[employeeId].turnos[change.day] = change.newValue;
                });

                setResumen(newResumen);

                if (activeChanges.length === 0) {
                    setShowPendingChanges(false);
                    setOriginalChangeDate(null);
                }

                console.log('✅ GridChanges sincronizado, cambios activos:', activeChanges.length);
                return updated;
            });
        }

        // Limpiar flag de undoing después de un breve delay
        setTimeout(() => {
            setIsUndoing(false);
            console.log('🏁 Flag isUndoing limpiado');
        }, 200);

    }, [simpleCanUndo, simpleUndoLastChange, gridChanges, simpleChanges.length, isUndoing]);

    // Función para deshacer múltiples cambios con callback
    const undoSpecificChangesWithCallback = useCallback((changeIds: string[], onComplete?: () => void) => {
        console.log('🔄 Deshaciendo múltiples cambios:', changeIds);

        if (changeIds.length === 0) {
            console.log('⚠️ No hay cambios para deshacer');
            onComplete?.();
            return;
        }

        let processedCount = 0;
        const totalChanges = changeIds.length;

        // Función para procesar el siguiente cambio
        const processNextChange = () => {
            if (processedCount >= totalChanges) {
                console.log('✅ Todos los cambios fueron deshecho');
                onComplete?.();
                return;
            }

            const changeId = changeIds[processedCount];
            console.log(`🔄 Procesando cambio ${processedCount + 1}/${totalChanges}:`, changeId);

            // Buscar el cambio específico
            const changeToUndo = gridChanges.find(change => change.id === changeId && !change.undone);
            if (!changeToUndo) {
                console.warn('⚠️ Cambio ya procesado o no encontrado:', changeId);
                processedCount++;
                // Continuar con el siguiente cambio después de un breve delay
                setTimeout(processNextChange, 10);
                return;
            }

            try {
                // Usar el sistema simple para deshacer
                const gridApi = getSimpleUndoGridApi();
                if (gridApi) {
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
                        const updatedData = { ...(targetRowNode as any).data };
                        updatedData[changeToUndo.day] = changeToUndo.oldValue;
                        (targetRowNode as any).setData(updatedData);

                        // Marcar el cambio como deshecho en el historial
                        setGridChanges(prev => prev.map(change =>
                            change.id === changeId
                                ? { ...change, undone: true }
                                : change
                        ));

                        console.log(`✅ Cambio deshecho: ${changeToUndo.employeeName} - día ${changeToUndo.day}`);
                    }
                }

                processedCount++;
                // Continuar con el siguiente cambio después de un breve delay
                setTimeout(processNextChange, 10);
            } catch (error) {
                console.error('❌ Error al deshacer cambio:', changeId, error);
                processedCount++;
                // Continuar con el siguiente cambio
                setTimeout(processNextChange, 10);
            }
        };

        // Iniciar el procesamiento
        processNextChange();
    }, [gridChanges, getSimpleUndoGridApi]);

    // Función para limpiar todos los cambios
    const clearAllChanges = useCallback(() => {
        console.log('🧹 Limpiando todos los cambios...');

        // Mostrar notificación informativa
        toast.info('Limpiando cambios...', {
            description: 'Por ahora usa Ctrl+Z para deshacer cambios.',
            duration: 3000,
        });

        // Limpiar estados principales
        setGridChanges([]);
        setResumen({});
        setShowPendingChanges(false);
        setOriginalChangeDate(null);

        console.log('✅ Estados principales limpiados');
    }, []);

    // Función redo (placeholder)
    const redoChange = useCallback(() => {
        toast.info('Función redo no implementada aún');
    }, []);

    // Función para ordenar datos por Amzoma y nombre
    const sortByAmzomaAndName = useCallback((a: TurnoData, b: TurnoData) => {
        // Primero ordenar por amzoma (false primero, true después) - Municipales arriba
        const isAmzomaA = a.amzoma === true || a.amzoma === 'true' || a.amzoma === 1;
        const isAmzomaB = b.amzoma === true || b.amzoma === 'true' || b.amzoma === 1;

        if (!isAmzomaA && isAmzomaB) return -1;
        if (isAmzomaA && !isAmzomaB) return 1;

        // Si ambos tienen el mismo estado de amzoma, ordenar alfabéticamente
        const nombreA = a.first_name && a.paternal_lastname
            ? `${String(a.first_name).split(' ')[0]} ${String(a.paternal_lastname)}`.toLowerCase()
            : String(a.nombre || '').toLowerCase();
        const nombreB = b.first_name && b.paternal_lastname
            ? `${String(b.first_name).split(' ')[0]} ${String(b.paternal_lastname)}`.toLowerCase()
            : String(b.nombre || '').toLowerCase();

        return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
    }, []);

    // Función para cargar turnos por mes
    const cargarTurnosPorMes = useCallback(async (fecha: Date) => {
        try {
            setSelectedDate(fecha);
            setLoading(true);

            const year = fecha.getFullYear();
            const month = fecha.getMonth() + 1; // JavaScript months are 0-indexed

            console.log(`🔄 Cargando turnos para ${month}/${year} - Rol: ${employee_rol_id}`);

            // Yield al browser para no bloquear UI
            await new Promise(resolve => setTimeout(resolve, 0));

            const response = await fetch(`/api/turnos/${year}/${month}/${employee_rol_id}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const turnosArray = Object.values(data) as TurnoData[];

            console.log('✅ Datos recibidos:', turnosArray.length, 'empleados');

            // Procesar datos en chunks para no bloquear UI
            const processDataInChunks = async (data: TurnoData[], chunkSize = 50) => {
                const result = [];

                for (let i = 0; i < data.length; i += chunkSize) {
                    const chunk = data.slice(i, i + chunkSize);
                    result.push(...chunk);

                    // Yield al browser después de cada chunk
                    if (i + chunkSize < data.length) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }

                // Ordenar todo al final para mantener el orden correcto por Amzoma
                return result.sort(sortByAmzomaAndName);
            };

            const turnosOrdenados = await processDataInChunks(turnosArray);

            // Actualizar los datos
            setRowData(turnosOrdenados);
            setOriginalData(turnosOrdenados);

            console.log('✅ Turnos cargados y ordenados:', turnosOrdenados.length, 'empleados');

            toast.success(`Turnos cargados para ${fecha.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}`);

        } catch (error) {
            console.error('❌ Error al cargar turnos:', error);
            toast.error('Error al cargar turnos del servidor');
        } finally {
            setLoading(false);
        }
    }, [employee_rol_id, sortByAmzomaAndName]);

    // Función para manejar actualización de cambios
    const handleActualizarCambios = useCallback(async (comentario: string) => {
        if (Object.keys(resumen).length === 0) {
            toast.warning('No hay cambios pendientes para actualizar');
            return;
        }

        setIsProcessingChanges(true);

        try {
            // Preparar datos para envío
            const formData = {
                changes: resumen,
                employee_rol_id: employee_rol_id,
                fecha: originalChangeDate ? originalChangeDate.toISOString().split('T')[0] : selectedDate.toISOString().split('T')[0],
                comentario: comentario || '',
            };

            setData(formData);

            // Enviar usando Inertia
            post('/shifts/update', {
                onSuccess: () => {
                    toast.success('Cambios actualizados correctamente');

                    // Limpiar estados después del éxito
                    setGridChanges([]);
                    setResumen({});
                    setShowPendingChanges(false);
                    setOriginalChangeDate(null);

                    // Limpiar sistema simple de undo DESPUÉS de recargar
                    setTimeout(() => {
                        simpleClearAllChanges();
                    }, 100);
                },
                onError: (errors) => {
                    console.error('Error al actualizar cambios:', errors);
                    toast.error('Error al actualizar cambios');
                },
                onFinish: () => {
                    setIsProcessingChanges(false);
                }
            });

        } catch (error) {
            console.error('Error en handleActualizarCambios:', error);
            toast.error('Error al procesar cambios');
            setIsProcessingChanges(false);
        }
    }, [resumen, employee_rol_id, originalChangeDate, selectedDate, setData, post, simpleClearAllChanges]);

    // Función para agregar empleado al grid
    const addEmployeeToGrid = useCallback((employee: TurnoData) => {
        setRowData(prev => {
            const exists = prev.some(emp =>
                emp.nombre === employee.nombre && emp.rut === employee.rut
            );

            if (exists) {
                toast.warning('El empleado ya está en la lista');
                return prev;
            }

            return [...prev, employee];
        });
    }, []);

    // Función para remover empleado del grid
    const removeEmployeeFromGrid = useCallback((employeeId: string | number) => {
        setRowData(prev => prev.filter(emp => getEmployeeId(emp) !== employeeId));
    }, [getEmployeeId]);

    // Función para obtener total de empleados
    const getTotalEmployees = useCallback(() => {
        return rowData.length;
    }, [rowData]);

    // Función para filtrar datos
    const filterData = useCallback((data: TurnoData[], term: string) => {
        if (!term.trim()) return data;

        return data.filter(item => {
            const nombreCompleto = item.nombre?.toLowerCase() || '';
            if (nombreCompleto.includes(term.toLowerCase())) return true;

            if (item.rut) {
                const rut = String(item.rut).toLowerCase();
                if (rut.includes(term.toLowerCase())) return true;
            }

            // Buscar en apellidos si existen
            if (item.paternal_lastname) {
                const apellidoPaterno = String(item.paternal_lastname).toLowerCase();
                if (apellidoPaterno.includes(term.toLowerCase())) return true;
            }

            if (item.maternal_lastname) {
                const apellidoMaterno = String(item.maternal_lastname).toLowerCase();
                if (apellidoMaterno.includes(term.toLowerCase())) return true;
            }

            return false;
        });
    }, []);

    // Datos filtrados con useMemo (evita renders extra y estados redundantes)
    const filteredRowData = useMemo(() => filterData(rowData, debouncedSearchTerm), [rowData, debouncedSearchTerm, filterData]);

    // Derivar listaCambios para compatibilidad con componentes existentes
    const listaCambios = useMemo((): ChangeItem[] => {
        return gridChanges
            .filter(change => !change.undone) // Solo cambios activos
            .map(change => ({
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

    // Función para manejar actualización del resumen
    const handleResumenUpdate = useCallback((newResumen: CambiosPorFuncionario) => {
        setResumen(newResumen);
    }, []);

    // Función para establecer API del grid
    const setGridApi = useCallback((api: any) => {
        console.log('🔗 Estableciendo Grid API en manager:', !!api);
        setSimpleGridApi(api);
        console.log('✅ Grid API establecida en sistema simple');

        // Verificar que el API funciona
        if (api) {
            try {
                let nodeCount = 0;
                api.forEachNode(() => nodeCount++);
                console.log('📊 Grid API verificada, nodos:', nodeCount);
            } catch (error) {
                console.error('❌ Error verificando Grid API:', error);
            }
        }
    }, [setSimpleGridApi]);

    // Efecto para actualizar rowData cuando cambian los datos iniciales
    useEffect(() => {
        if (datosInicialesOrdenados.length > 0 && rowData.length === 0) {
            console.log('📊 Cargando datos iniciales:', datosInicialesOrdenados.length, 'empleados');
            setRowData(datosInicialesOrdenados);
            setOriginalData(datosInicialesOrdenados);
        }
    }, [datosInicialesOrdenados, rowData.length]);

    // Manejo de atajos de teclado
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                undoChange();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undoChange, redoChange]);

    // Computed values
    const canUndo = simpleCanUndo;
    const canRedo = false; // Placeholder
    const hasChanges = Object.keys(resumen).length > 0;
    const changeCount = gridChanges.length;

    // Estadísticas de cambios para debugging
    useEffect(() => {
        const activeChanges = gridChanges.filter(change => !change.undone);
        const undoneChanges = gridChanges.filter(change => change.undone);

        console.log('📊 Estado de cambios:');
        console.log('  - Total:', gridChanges.length);
        console.log('  - Activos:', activeChanges.length);
        console.log('  - Deshechos:', undoneChanges.length);
        console.log('  - Resumen empleados:', Object.keys(resumen).length);
    }, [gridChanges, resumen]);

    // Estados adicionales para empleados
    const [filteredAvailableEmployees, setFilteredAvailableEmployees] = useState<TurnoData[]>([]);

    const addAllEmployees = useCallback(() => {
        // Implementar lógica para agregar todos los empleados
        console.log('Agregando todos los empleados...');
    }, []);

    const clearAllEmployees = useCallback(() => {
        setRowData([]);
        toast.success('Todos los empleados han sido removidos');
    }, []);

    const closeEmployeeSelector = useCallback(() => {
        // Implementar lógica para cerrar selector
        console.log('Cerrando selector de empleados...');
    }, []);

    // Función para obtener historial de cambios con estado de deshecho
    const getChangeHistory = useCallback(() => {
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
        }));
    }, [gridChanges]);

    // Título del mes actual, usado por createv3
    const currentMonthTitle = useMemo(() => {
        try {
            const formatter = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' });
            const formatted = formatter.format(selectedDate);
            // Capitalizar primer letra
            return formatted.charAt(0).toUpperCase() + formatted.slice(1);
        } catch (_) {
            return `${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`;
        }
    }, [selectedDate]);

    // Compatibilidad con createv3 (valores de respaldo)
    const isSaving = false;
    const selectedEmployees: any[] = [];
    const availableEmployees = filteredAvailableEmployees;

    // Recalcular layout del grid cuando su contenedor cambia de tamaño
    const recalculateGridLayout = useCallback(() => {
        const api = getSimpleUndoGridApi();
        if (!api) return;
        // Esperar al próximo frame para asegurar DOM actualizado
        requestAnimationFrame(() => {
            try {
                // Disparar eventos de resize/redraw
                if (typeof api.onGridSizeChanged === 'function') {
                    api.onGridSizeChanged();
                }
                if (typeof api.sizeColumnsToFit === 'function') {
                    api.sizeColumnsToFit();
                }
                if (typeof api.resetRowHeights === 'function') {
                    api.resetRowHeights();
                }
                api.refreshCells({ force: true });
                api.redrawRows();
            } catch (_) {
                // no-op
            }
        });
    }, []);

    return {
        // Estados principales
        rowData,
        setRowData,
        selectedDate,
        setSelectedDate,
        resumen,
        setResumen,
        showPendingChanges,
        setShowPendingChanges,
        originalChangeDate,
        setOriginalChangeDate,
        isProcessingChanges,
        gridChanges,
        setGridChanges,
        originalData,
        setOriginalData,
        isUndoing,
        setIsUndoing,

        // Estados de búsqueda y filtrado
        searchTerm,
        setSearchTerm,
        debouncedSearchTerm,
        filteredRowData, // 🆕 Datos filtrados
        listaCambios, // 🆕 Lista de cambios para compatibilidad

        // Estados computados
        canUndo,
        canRedo,
        hasChanges,
        changeCount,
        loading,
        hasEditPermissions,

        // Funciones principales
        cargarTurnosPorMes,
        registerChange,
        handleActualizarCambios,

        // Funciones de historial
        undoChange,
        undoSpecificChange,
        undoSpecificChangesWithCallback,
        redoChange,
        clearAllChanges,

        // Funciones de empleados
        getEmployeeId,
        addEmployeeToGrid,
        removeEmployeeFromGrid,

        // Funciones de utilidad
        getTotalEmployees,
        filterData,
        handleResumenUpdate,
        setGridApi,
        // Estados y funciones adicionales para filtro de empleados
        filteredAvailableEmployees,
        addAllEmployees,
        clearAllEmployees,
        closeEmployeeSelector,

        // Función para obtener historial completo
        getChangeHistory,

        // Form de Inertia
        data,
        setData,
        post,
        processing,
        errors,

        // Función para registrar el API del grid (para undo directo)
        registerGridApi: setGridApi,

        // Función para obtener lista de changeIds
        getChangeIds: getSimpleChangeIds,
        currentMonthTitle: currentMonthTitle,
        isSaving: isSaving,
        selectedEmployees: selectedEmployees,
        availableEmployees: availableEmployees,
        recalculateGridLayout,
    };
};
