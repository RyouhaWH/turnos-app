import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { router } from '@inertiajs/react';

interface TurnoData {
    id: string;
    nombre: string;
    amzoma?: boolean | string | number;
    first_name?: string;
    paternal_lastname?: string;
    [key: string]: string | boolean | number | undefined;
}

// Nueva interfaz para el sistema centralizado de cambios
interface GridChange {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeRut: string;
    day: string;
    oldValue: string;
    newValue: string;
    timestamp: number;
}

// Interfaz de compatibilidad
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

export const useShiftsManager = (employee_rol_id: number) => {
    const { data, setData, post, processing, errors } = useForm({
        cambios: {},
        comentario: '',
        mes: new Date().getMonth() + 1,
        año: new Date().getFullYear(),
    });

    const { props } = usePage<{ turnos: TurnoData[]; auth: { user: any } }>();

    // Verificar permisos
    const user = props.auth?.user;
    const hasEditPermissions = user?.roles?.some((role: any) => role.name === 'Supervisor' || role.name === 'Administrador') || false;

    // Ordenar datos iniciales: primero Municipal, luego Amzoma, ambos alfabéticamente
    const datosInicialesOrdenados = useMemo(() => {
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
    const [rowData, setRowData] = useState<TurnoData[]>([]);
    const [resumen, setResumen] = useState<Record<string, any>>({});
    const [comentario, setComentario] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Derivar el título del mes
    const currentMonthTitle = useMemo(() => {
        return selectedDate.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' });
    }, [selectedDate]);

    const [loading, setLoading] = useState(true);
    const [isChangesExpanded, setIsChangesExpanded] = useState(false);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const [resetGrid, setResetGrid] = useState(false);
    const [isUndoing, setIsUndoing] = useState(false);
    const [originalChangeDate, setOriginalChangeDate] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showPendingChanges, setShowPendingChanges] = useState(false);
    const [clearChanges, setClearChanges] = useState(false);
    const [pendingDateChange, setPendingDateChange] = useState<Date | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [initialDataLoaded, setInitialDataLoaded] = useState(false);

    // Búsqueda con debounce
    const [searchInputTerm, setSearchInputTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchInputTerm.trim(), 250);

    // Selección y empleados disponibles
    const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
    const [availableEmployees, setAvailableEmployees] = useState<TurnoData[]>([]);
    const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);

    // SISTEMA CENTRALIZADO DE CAMBIOS
    const [gridChanges, setGridChanges] = useState<GridChange[]>([]);

    // Derivar listaCambios para compatibilidad
    const listaCambios = useMemo((): ChangeItem[] => {
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

    // Función para obtener el ID del empleado
    const getEmployeeId = useCallback((employee: TurnoData): string => {
        return String(employee.employee_id || employee.id || employee.rut || employee.nombre);
    }, []);

    // Función para obtener el ID del empleado por nombre y rut
    const getEmployeeIdByNameAndRut = useCallback((employeeName: string, rut: string): string => {
        const employee = rowData.find(emp =>
            emp.nombre === employeeName ||
            emp.rut === rut ||
            (emp.first_name && emp.paternal_lastname &&
             `${String(emp.first_name).split(' ')[0]} ${String(emp.paternal_lastname)}` === employeeName)
        );
        return String(employee?.employee_id || employee?.id || employeeName);
    }, [rowData]);

    // FUNCIÓN PARA REGISTRAR CAMBIOS EN EL GRID
    const registerChange = useCallback((employee: string, rut: string, day: string, oldValue: string, newValue: string) => {
        if (oldValue === newValue) return;

        const employeeId = getEmployeeIdByNameAndRut(employee, rut);

        const change: GridChange = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            employeeId,
            employeeName: employee,
            employeeRut: rut,
            day,
            oldValue,
            newValue,
            timestamp: Date.now(),
        };

        // Agregar cambio al array centralizado
        setGridChanges(prev => [...prev, change]);

        // Actualizar el resumen para compatibilidad con el backend
        setResumen(prev => {
            const newResumen = { ...prev } as any;

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
    }, [selectedDate, originalChangeDate, getEmployeeIdByNameAndRut]);

    // DESHACER ÚLTIMO CAMBIO
    const undoLastChange = useCallback(() => {
        if (gridChanges.length === 0) return;

        setIsUndoing(true);

        const lastChange = gridChanges[gridChanges.length - 1];

        // Revertir el cambio en rowData
        setRowData(prevData => prevData.map(emp => {
            if (String(emp.employee_id) === lastChange.employeeId || String(emp.id) === lastChange.employeeId) {
                return { ...emp, [lastChange.day]: lastChange.oldValue };
            }
            return emp;
        }));

        // Remover el cambio del array centralizado
        setGridChanges(prev => prev.slice(0, -1));

        // Actualizar el resumen
        setResumen(prev => {
            const newResumen = { ...prev } as any;
            const employeeId = lastChange.employeeId;

            if (newResumen[employeeId]?.turnos) {
                delete newResumen[employeeId].turnos[lastChange.day];

                if (Object.keys(newResumen[employeeId].turnos || {}).length === 0) {
                    delete newResumen[employeeId];
                }
            }

            return newResumen;
        });

        // Si no hay más cambios, limpiar estados relacionados
        if (gridChanges.length === 1) {
            setShowPendingChanges(false);
            setOriginalChangeDate(null);
        }

        // Mantener isUndoing activo para sincronización
        setTimeout(() => setIsUndoing(false), 500);
    }, [gridChanges]);

    // DESHACER CAMBIO ESPECÍFICO
    const undoSpecificChange = useCallback((changeId: string) => {
        const changeIndex = gridChanges.findIndex((c) => c.id === changeId);
        if (changeIndex === -1) return;

        setIsUndoing(true);

        const change = gridChanges[changeIndex];

        // Revertir el cambio en rowData
        setRowData(prevData => prevData.map(emp => {
            if (String(emp.employee_id) === change.employeeId || String(emp.id) === change.employeeId) {
                return { ...emp, [change.day]: change.oldValue };
            }
            return emp;
        }));

        // Remover el cambio específico del array centralizado
        setGridChanges(prev => prev.filter((_, index) => index !== changeIndex));

        // Actualizar el resumen
        setResumen(prev => {
            const newResumen = { ...prev } as any;
            const employeeId = change.employeeId;

            if (newResumen[employeeId]?.turnos) {
                delete newResumen[employeeId].turnos[change.day];

                if (Object.keys(newResumen[employeeId].turnos || {}).length === 0) {
                    delete newResumen[employeeId];
                }
            }

            return newResumen;
        });

        // Si no hay más cambios, limpiar estados relacionados
        if (gridChanges.length === 1) {
            setShowPendingChanges(false);
            setOriginalChangeDate(null);
        }

        // Mantener isUndoing activo para sincronización
        setTimeout(() => setIsUndoing(false), 500);
    }, [gridChanges]);

    // LIMPIAR TODOS LOS CAMBIOS
    const limpiarTodosLosCambios = useCallback(() => {
        const confirmar = window.confirm('¿Estás seguro de que quieres descartar todos los cambios pendientes? Esta acción no se puede deshacer.');
        if (!confirmar) return;

        setIsUndoing(true);

        // Restaurar rowData a su estado original
        setRowData(datosInicialesOrdenados);

        // Limpiar todos los cambios
        setGridChanges([]);
        setResumen({});
        setShowPendingChanges(false);
        setOriginalChangeDate(null);

        // Actualizar datos del formulario
        setData(prev => ({
            ...prev,
            cambios: {},
        }));

        setTimeout(() => setIsUndoing(false), 500);

        toast.success('Cambios descartados', {
            description: 'Todos los cambios pendientes han sido descartados.',
            duration: 3000,
        });
    }, [datosInicialesOrdenados, setData]);

    const limpiarCambiosSinConfirmacion = useCallback(() => {
        setResumen({});
        setGridChanges([]);
        setOriginalChangeDate(null);
        setShowPendingChanges(false);
        setComentario('');
    }, []);

    // Función para filtrar datos
    const filterData = useCallback((data: TurnoData[], term: string) => {
        if (!term.trim()) return data;

        return data.filter(item => {
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
    }, []);

    // Datos filtrados con useMemo (evita renders extra y estados redundantes)
    const filteredRowData = useMemo(() => filterData(rowData, debouncedSearchTerm), [rowData, debouncedSearchTerm, filterData]);

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

    const filteredAvailableEmployees = useMemo(
        () => filterAvailableEmployees(debouncedSearchTerm),
        [debouncedSearchTerm, filterAvailableEmployees]
    );

    // Función de ordenamiento por Amzoma y alfabético
    const sortByAmzomaAndName = useCallback((a: TurnoData, b: TurnoData) => {
        // Primero ordenar por amzoma (false primero, true después) - Municipales arriba
        const isAmzomaA = a.amzoma === true || a.amzoma === 'true' || a.amzoma === 1;
        const isAmzomaB = b.amzoma === true || b.amzoma === 'true' || b.amzoma === 1;

        if (!isAmzomaA && isAmzomaB) return -1;
        if (isAmzomaA && !isAmzomaB) return 1;

        // Si ambos tienen el mismo estado de amzoma, ordenar alfabéticamente
        const nombreA = a.first_name && a.paternal_lastname
            ? `${a.first_name.split(' ')[0]} ${a.paternal_lastname}`.toLowerCase()
            : (a.nombre || '').toLowerCase();
        const nombreB = b.first_name && b.paternal_lastname
            ? `${b.first_name.split(' ')[0]} ${b.paternal_lastname}`.toLowerCase()
            : (b.nombre || '').toLowerCase();

        return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
    }, []);

    // Funciones para manejar empleados
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

    const addMultipleEmployees = useCallback((employees: TurnoData[]) => {
        employees.forEach(employee => addEmployeeToGrid(employee));
    }, [addEmployeeToGrid]);

    const clearAllEmployees = useCallback(() => {
        setSelectedEmployees(new Set());
        setRowData([]);
    }, []);

    const addAllEmployees = useCallback(() => {
        setSelectedEmployees(new Set(availableEmployees.map(e => getEmployeeId(e))));
        setRowData([...availableEmployees].sort(sortByAmzomaAndName));
    }, [availableEmployees, getEmployeeId, sortByAmzomaAndName]);

    const closeEmployeeSelector = useCallback(() => {
        setShowEmployeeSelector(false);
    }, []);

    // Función para aplicar cambios pendientes
    const aplicarCambiosPendientes = useCallback((turnosArray: TurnoData[], fechaActual: Date): TurnoData[] => {
        if (gridChanges.length === 0 || !originalChangeDate) {
            return turnosArray;
        }

        if (originalChangeDate.getMonth() !== fechaActual.getMonth() ||
            originalChangeDate.getFullYear() !== fechaActual.getFullYear()) {
            return turnosArray;
        }

        try {
            const turnosModificados = turnosArray.map(turno => ({ ...turno }));

            gridChanges.forEach(cambio => {
                const empleadoIndex = turnosModificados.findIndex(
                    emp => emp.employee_id === cambio.employeeId || emp.id === cambio.employeeId
                );

                if (empleadoIndex !== -1) {
                    turnosModificados[empleadoIndex][cambio.day] = cambio.newValue;
                }
            });

            return turnosModificados;
        } catch (error) {
            console.error('Error al aplicar cambios pendientes:', error);
            return turnosArray;
        }
    }, [gridChanges, originalChangeDate]);

    // Función de carga asíncrona optimizada
    const loadDataAsync = useCallback(async (fecha: Date, showToast = false) => {
        const year = fecha.getFullYear();
        const month = fecha.getMonth() + 1;

        // Validar cambios pendientes
        const hayCambiosReales = gridChanges.length > 0 && Object.keys(resumen).length > 0;
        const esCambioDeMes = originalChangeDate &&
            (originalChangeDate.getMonth() !== fecha.getMonth() || originalChangeDate.getFullYear() !== fecha.getFullYear());

        if (hayCambiosReales && esCambioDeMes && !isInitialLoad) {
            const confirmarCambio = window.confirm(
                `Tienes cambios pendientes para ${originalChangeDate.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}. ` +
                `¿Deseas guardar estos cambios antes de cambiar a ${fecha.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}?`
            );

            if (confirmarCambio) {
                setPendingDateChange(fecha);
                // Usar la función directamente en lugar de callback para evitar dependencia circular
                const comentarioFinal = comentario || 'Cambios guardados automáticamente al cambiar de mes';
                setComentario(comentarioFinal);

                // TODO: Implementar guardado aquí si es necesario
                return;
            } else {
                setGridChanges([]);
                setOriginalChangeDate(null);
                setResumen({});
                setShowPendingChanges(false);
            }
        }

        try {
            setLoading(true);

            // Yield al browser para no bloquear UI
            await new Promise(resolve => setTimeout(resolve, 0));

            const response = await fetch(`/api/turnos/${year}/${month}/${employee_rol_id}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const turnosArray = Object.values(data) as TurnoData[];

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

            // Aplicar cambios pendientes si es necesario
            const isOriginalMonth = originalChangeDate &&
                originalChangeDate.getMonth() === fecha.getMonth() &&
                originalChangeDate.getFullYear() === fecha.getFullYear();

            let finalData = turnosOrdenados;
            if (isOriginalMonth && gridChanges.length > 0) {
                finalData = aplicarCambiosPendientes(turnosOrdenados, fecha);
            }

            // Asegurar orden correcto por Amzoma antes de asignar
            finalData = finalData.sort(sortByAmzomaAndName);

            // Aplicar datos usando requestAnimationFrame para timing óptimo
            requestAnimationFrame(() => {
                setRowData(finalData);
                setAvailableEmployees(turnosOrdenados.sort(sortByAmzomaAndName));
                setInitialDataLoaded(true);

                if (isOriginalMonth && gridChanges.length > 0) {
                    setTimeout(() => setShowPendingChanges(true), 200);
                } else {
                    if (gridChanges.length === 0) {
                        setResumen({});
                    }
                    setShowPendingChanges(false);
                }

                if (showToast) {
                    toast.success('Turnos cargados correctamente', {
                        description: `Se cargaron ${turnosOrdenados.length} empleados para ${fecha.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}`,
                        duration: 3000,
                    });
                }
            });

        } catch (error) {
            console.error('Error al cargar turnos:', error);

            if (showToast) {
                toast.error('Error al cargar turnos', {
                    description: 'Hubo un problema al cargar los turnos del mes seleccionado.',
                    duration: 4000,
                });
            }
        } finally {
            requestAnimationFrame(() => {
                setLoading(false);
            });
        }
    }, [employee_rol_id, gridChanges, originalChangeDate, comentario, resumen, isInitialLoad, aplicarCambiosPendientes]);

    // Cargar turnos por mes - Ahora usa la función optimizada
    const cargarTurnosPorMes = useCallback(async (fecha: Date) => {
        await loadDataAsync(fecha, true); // Mostrar toast en cargas manuales
    }, [loadDataAsync]);

    const handleResumenUpdate = useCallback((ResumenCambios: any) => {
        setResumen(ResumenCambios);
        setData((prev) => ({
            ...prev,
            cambios: ResumenCambios,
        }));
    }, [setData]);



    const handleActualizarCambios = useCallback((comentarioNuevo: string) => {
        setComentario(comentarioNuevo);

        const fechaParaCambios = originalChangeDate || selectedDate;
        const mes = fechaParaCambios.getMonth() + 1;
        const año = fechaParaCambios.getFullYear();

        const datosAEnviar = {
            cambios: resumen,
            comentario: comentarioNuevo,
            mes: mes,
            año: año,
        };

        // Debug: Log de los datos que se van a enviar
        console.log('🚀 Datos a enviar al backend:', {
            datosAEnviar,
            resumenDetallado: JSON.stringify(resumen, null, 2),
            gridChanges: gridChanges,
            fechaParaCambios: fechaParaCambios.toISOString()
        });

        setIsSaving(true);

        fetch('/turnos-mes/actualizar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            body: JSON.stringify(datosAEnviar)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                return { success: true, message: 'Cambios guardados correctamente' };
            }
        })
        .then(data => {
            setIsSaving(false);

            setResumen({});
            setComentario('');
            setResetGrid(true);
            setGridChanges([]);
            setOriginalChangeDate(null);
            setShowPendingChanges(false);

            toast.success('Cambios guardados exitosamente', {
                description: 'Los turnos fueron actualizados correctamente.',
                duration: 3000,
            });

            setTimeout(() => setResetGrid(false), 100);

            if (!pendingDateChange) {
                const fechaParaRecargar = originalChangeDate || selectedDate;
                cargarTurnosPorMes(fechaParaRecargar);
            }
        })
        .catch(error => {
            setIsSaving(false);
            console.error('Error en fetch:', error);

            if (error instanceof SyntaxError && error.message.includes('JSON')) {
                toast.success('Cambios guardados exitosamente', {
                    description: 'Los turnos fueron actualizados correctamente.',
                    duration: 3000,
                });

                setResumen({});
                setComentario('');
                setResetGrid(true);
                setGridChanges([]);
                setOriginalChangeDate(null);
                setShowPendingChanges(false);

                setTimeout(() => setResetGrid(false), 100);

                if (!pendingDateChange) {
                    const fechaParaRecargar = originalChangeDate || selectedDate;
                    cargarTurnosPorMes(fechaParaRecargar);
                }
            } else {
                toast.error('Error al guardar cambios', {
                    description: 'Hubo un problema al guardar los cambios. Intenta nuevamente.',
                    duration: 4000,
                });
            }
        });
    }, [originalChangeDate, selectedDate, resumen, pendingDateChange, cargarTurnosPorMes]);

    const getTotalEmployees = useCallback(() => rowData.length, [rowData]);

    // Carga inicial optimizada
    useEffect(() => {
        if (!initialDataLoaded) {
            loadDataAsync(selectedDate, false); // No mostrar toast en carga inicial
        }
    }, [loadDataAsync, selectedDate, initialDataLoaded]);

    useEffect(() => {
        limpiarCambiosSinConfirmacion();
    }, [limpiarCambiosSinConfirmacion]);

    useEffect(() => {
        if (pendingDateChange && gridChanges.length === 0 && !isSaving) {
            cargarTurnosPorMes(pendingDateChange);
            setPendingDateChange(null);
        }
    }, [pendingDateChange, gridChanges.length, isSaving, cargarTurnosPorMes]);

    useEffect(() => {
        if (rowData.length > 0 && isInitialLoad) {
            setIsInitialLoad(false);
        }
    }, [rowData.length]);

    useEffect(() => {
        if (gridChanges.length === 0) {
            setShowPendingChanges(false);
        }
    }, [gridChanges.length]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
                event.preventDefault();
                undoLastChange();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [undoLastChange]);

    // Exponer searchTerm (input) y su setter, pero internamente usamos el debounced
    const searchTerm = searchInputTerm;
    const setSearchTerm = setSearchInputTerm;

    return {
        // Estados
        rowData,
        filteredRowData,
        resumen,
        comentario,
        selectedDate,
        currentMonthTitle,
        loading,
        isChangesExpanded,
        isHistoryExpanded,
        resetGrid,
        isUndoing,
        originalChangeDate,
        isSaving,
        showPendingChanges,
        clearChanges,
        searchTerm,
        selectedEmployees,
        availableEmployees,
        showEmployeeSelector,
        filteredAvailableEmployees,
        listaCambios,
        hasEditPermissions,
        processing,
        errors,

        // Funciones
        setSelectedDate,

        setIsChangesExpanded,
        setIsHistoryExpanded,
        setSearchTerm,
        setShowEmployeeSelector,
        cargarTurnosPorMes,
        handleResumenUpdate,
        undoLastChange,
        undoSpecificChange,
        registerChange,
        limpiarTodosLosCambios,
        handleActualizarCambios,
        getTotalEmployees,
        getEmployeeId,
        addEmployeeToGrid,
        removeEmployeeFromGrid,
        addMultipleEmployees,
        clearAllEmployees,
        addAllEmployees,
        closeEmployeeSelector,
        filterData,
        filterAvailableEmployees,
    };
};
