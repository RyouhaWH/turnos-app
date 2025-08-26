import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { toast } from 'sonner';

interface TurnoData {
    id: string;
    nombre: string;
    [key: string]: string;
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

    // Ordenar datos iniciales alfabéticamente
    const datosInicialesOrdenados = useMemo(() => {
        return props.turnos.sort((a: TurnoData, b: TurnoData) => {
            const nombreA = a.first_name && a.paternal_lastname
                ? `${a.first_name.split(' ')[0]} ${a.paternal_lastname}`.toLowerCase()
                : (a.nombre || '').toLowerCase();
            const nombreB = b.first_name && b.paternal_lastname
                ? `${b.first_name.split(' ')[0]} ${b.paternal_lastname}`.toLowerCase()
                : (b.nombre || '').toLowerCase();

            return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
        });
    }, [props.turnos]);

    // Estados principales
    const [rowData, setRowData] = useState<TurnoData[]>(datosInicialesOrdenados);
    const [resumen, setResumen] = useState<Record<string, Record<string, string>>>({});
    const [comentario, setComentario] = useState('');
    const [historial, setHistorial] = useState([]);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonthTitle, setCurrentMonthTitle] = useState(new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long' }));
    const [loading, setLoading] = useState(false);
    const [isChangesExpanded, setIsChangesExpanded] = useState(true);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const [resetGrid, setResetGrid] = useState(false);
    const [isUndoing, setIsUndoing] = useState(false);
    const [originalChangeDate, setOriginalChangeDate] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [showPendingChanges, setShowPendingChanges] = useState(false);
    const [clearChanges, setClearChanges] = useState(false);
    const [pendingDateChange, setPendingDateChange] = useState<Date | null>(null);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Búsqueda con debounce
    const [searchInputTerm, setSearchInputTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    useEffect(() => {
        const id = setTimeout(() => setDebouncedSearchTerm(searchInputTerm.trim()), 250);
        return () => clearTimeout(id);
    }, [searchInputTerm]);

    // Selección y disponibles
    const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
    const [availableEmployees, setAvailableEmployees] = useState<TurnoData[]>(datosInicialesOrdenados);
    const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);

    // Lista de cambios
    const [listaCambios, setListaCambios] = useState<ChangeItem[]>([]);

    // Función para filtrar datos
    const filterData = useCallback((data: TurnoData[], term: string) => {
        if (!term.trim()) return data;

        return data.filter(item => {
            const nombreCompleto = item.nombre?.toLowerCase() || '';
            if (nombreCompleto.includes(term.toLowerCase())) return true;

            if (item.first_name && item.paternal_lastname) {
                const nombreFormateado = `${item.first_name} ${item.paternal_lastname}`.toLowerCase();
                if (nombreFormateado.includes(term.toLowerCase())) return true;
            }

            if (item.first_name && item.first_name.toLowerCase().includes(term.toLowerCase())) return true;
            if (item.paternal_lastname && item.paternal_lastname.toLowerCase().includes(term.toLowerCase())) return true;
            if (item.maternal_lastname && item.maternal_lastname.toLowerCase().includes(term.toLowerCase())) return true;

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
                const nombreFormateado = `${item.first_name} ${item.paternal_lastname}`.toLowerCase();
                if (nombreFormateado.includes(term.toLowerCase())) return true;
            }

            if (item.first_name && item.first_name.toLowerCase().includes(term.toLowerCase())) return true;
            if (item.paternal_lastname && item.paternal_lastname.toLowerCase().includes(term.toLowerCase())) return true;
            if (item.maternal_lastname && item.maternal_lastname.toLowerCase().includes(term.toLowerCase())) return true;

            return false;
        });
    }, [availableEmployees]);

    const filteredAvailableEmployees = useMemo(
        () => filterAvailableEmployees(debouncedSearchTerm),
        [debouncedSearchTerm, filterAvailableEmployees]
    );

    // Función para obtener ID único de empleado
    const getEmployeeId = (employee: TurnoData): string => {
        return employee.employee_id || employee.id || employee.rut || employee.nombre;
    };

    // Funciones para manejar empleados
    const addEmployeeToGrid = useCallback((employee: TurnoData) => {
        const employeeId = getEmployeeId(employee);
        setSelectedEmployees(prev => new Set([...prev, employeeId]));

        setRowData(prev => {
            if (!prev.find(e => getEmployeeId(e) === employeeId)) {
                return [...prev, employee].sort((a, b) => {
                    const nombreA = a.first_name && a.paternal_lastname
                        ? `${a.first_name.split(' ')[0]} ${a.paternal_lastname}`.toLowerCase()
                        : (a.nombre || '').toLowerCase();
                    const nombreB = b.first_name && b.paternal_lastname
                        ? `${b.first_name.split(' ')[0]} ${b.paternal_lastname}`.toLowerCase()
                        : (b.nombre || '').toLowerCase();
                    return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
                });
            }
            return prev;
        });
    }, []);

    const removeEmployeeFromGrid = useCallback((employee: TurnoData) => {
        const employeeId = getEmployeeId(employee);
        setSelectedEmployees(prev => {
            const newSet = new Set(prev);
            newSet.delete(employeeId);
            return newSet;
        });

        setRowData(prev => prev.filter(e => getEmployeeId(e) !== employeeId));
    }, []);

    const addMultipleEmployees = useCallback((employees: TurnoData[]) => {
        employees.forEach(employee => addEmployeeToGrid(employee));
    }, [addEmployeeToGrid]);

    const clearAllEmployees = useCallback(() => {
        setSelectedEmployees(new Set());
        setRowData([]);
    }, []);

    const addAllEmployees = useCallback(() => {
        setSelectedEmployees(new Set(availableEmployees.map(e => getEmployeeId(e))));
        setRowData([...availableEmployees]);
    }, [availableEmployees]);

    const closeEmployeeSelector = useCallback(() => {
        setShowEmployeeSelector(false);
    }, []);

    // Función para aplicar cambios pendientes
    const aplicarCambiosPendientes = (turnosArray: TurnoData[], fechaActual: Date): TurnoData[] => {
        if (listaCambios.length === 0 || !originalChangeDate) {
            return turnosArray;
        }

        if (originalChangeDate.getMonth() !== fechaActual.getMonth() ||
            originalChangeDate.getFullYear() !== fechaActual.getFullYear()) {
            return turnosArray;
        }

        try {
            const turnosModificados = turnosArray.map(turno => ({ ...turno }));

            listaCambios.forEach(cambio => {
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
    };

    // Cargar turnos por mes
    const cargarTurnosPorMes = useCallback(async (fecha: Date) => {
        const year = fecha.getFullYear();
        const month = fecha.getMonth() + 1;

        const hayCambiosReales = listaCambios.length > 0 && Object.keys(resumen).length > 0;
        const esCambioDeMes = originalChangeDate &&
            (originalChangeDate.getMonth() !== fecha.getMonth() || originalChangeDate.getFullYear() !== fecha.getFullYear());

        if (hayCambiosReales && esCambioDeMes && !isInitialLoad) {
            const confirmarCambio = window.confirm(
                `Tienes cambios pendientes para ${originalChangeDate.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}. ` +
                `¿Deseas guardar estos cambios antes de cambiar a ${fecha.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}?`
            );

            if (confirmarCambio) {
                setPendingDateChange(fecha);
                handleActualizarCambios(comentario || 'Cambios guardados automáticamente al cambiar de mes');
                return;
            } else {
                setListaCambios([]);
                setOriginalChangeDate(null);
                setResumen({});
                setShowPendingChanges(false);
            }
        }

        try {
            setLoading(true);
            setCurrentMonthTitle(`Cargando turnos de ${fecha.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}...`);

            const response = await fetch(`/api/turnos/${year}/${month}/${employee_rol_id}`);
            const data = await response.json();

            const turnosArray = Object.values(data) as TurnoData[];

            const turnosOrdenados = turnosArray.sort((a, b) => {
                const nombreA = a.first_name && a.paternal_lastname
                    ? `${a.first_name.split(' ')[0]} ${a.paternal_lastname}`.toLowerCase()
                    : (a.nombre || '').toLowerCase();
                const nombreB = b.first_name && b.paternal_lastname
                    ? `${b.first_name.split(' ')[0]} ${b.paternal_lastname}`.toLowerCase()
                    : (b.nombre || '').toLowerCase();

                return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
            });

            const isOriginalMonth = originalChangeDate &&
                originalChangeDate.getMonth() === fecha.getMonth() &&
                originalChangeDate.getFullYear() === fecha.getFullYear();

            if (isOriginalMonth && listaCambios.length > 0) {
                const turnosConCambiosPendientes = aplicarCambiosPendientes(turnosOrdenados, fecha);
                setRowData(turnosConCambiosPendientes);
                setTimeout(() => {
                    setShowPendingChanges(true);
                }, 200);
            } else {
                setRowData(turnosOrdenados);
                if (listaCambios.length === 0) {
                    setResumen({});
                }
                setShowPendingChanges(false);
            }

            setCurrentMonthTitle(fecha.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' }));

            toast.success('Turnos cargados correctamente', {
                description: `Se cargaron los turnos de ${fecha.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}`,
                duration: 3000,
            });
        } catch (error) {
            console.error('Error al cargar turnos:', error);
            setCurrentMonthTitle(`Error cargando ${fecha.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}`);

            toast.error('Error al cargar turnos', {
                description: 'Hubo un problema al cargar los turnos del mes seleccionado.',
                duration: 4000,
            });
        } finally {
            setLoading(false);
        }
    }, [listaCambios, originalChangeDate, employee_rol_id, comentario, resumen, isInitialLoad]);

    const handleResumenUpdate = useCallback((ResumenCambios: any) => {
        setResumen(ResumenCambios);
        setData((prev) => ({
            ...prev,
            cambios: ResumenCambios,
        }));
    }, [setData]);

    // Registrar cambio en historial (para deshacer)
    const registerChange = (employee: string, rut: string, day: string, oldValue: string, newValue: string) => {
        if (originalChangeDate === null) {
            const currentMonth = selectedDate.getMonth();
            const currentYear = selectedDate.getFullYear();
            const fixedDate = new Date(currentYear, currentMonth, 1);
            setOriginalChangeDate(fixedDate);
        }

        const employeeData = rowData.find((row) => row.nombre === employee);
        const employeeId = employeeData?.employee_id || employeeData?.id;
        if (!employeeId) return;

        const change: ChangeItem = {
            id: `${employeeId}_${day}_${Date.now()}`,
            employeeId,
            employeeName: employee,
            employeeRut: rut,
            day,
            oldValue,
            newValue,
            timestamp: Date.now(),
        };

        setListaCambios((prev) => [...prev, change]);
    };

    // Deshacer último cambio: actualizar datos directamente
    const undoLastChange = async () => {
        if (listaCambios.length === 0) return;

        setIsUndoing(true);

        const lastChange = listaCambios[listaCambios.length - 1];
        const newResumen = { ...resumen };
        const employeeId = lastChange.employeeId;
        const claveEmpleado = employeeId.toString();

        if (!employeeId) {
            toast.error('Error al deshacer cambio', {
                description: 'No se pudo identificar al empleado',
                duration: 4000,
            });
            setIsUndoing(false);
            return;
        }

        if (newResumen[claveEmpleado] && (newResumen[claveEmpleado] as any).turnos) {
            delete (newResumen[claveEmpleado] as any).turnos[lastChange.day];
            if (Object.keys((newResumen[claveEmpleado] as any).turnos).length === 0) {
                delete newResumen[claveEmpleado];
            }
        }

        setResumen(newResumen);
        setData((prev) => ({
            ...prev,
            cambios: newResumen,
        }));

        setRowData(prevData => prevData.map(emp => (
            (emp.employee_id === lastChange.employeeId || emp.id === lastChange.employeeId)
                ? { ...emp, [lastChange.day]: lastChange.oldValue }
                : emp
        )));

        setListaCambios((prev) => {
            const newList = prev.slice(0, -1);
            if (newList.length === 0) {
                setShowPendingChanges(false);
                setOriginalChangeDate(null);
            }
            return newList;
        });

        setTimeout(() => setIsUndoing(false), 100);
    };

    // Deshacer cambio específico
    const undoSpecificChange = async (changeId: string) => {
        const changeIndex = listaCambios.findIndex((c) => c.id === changeId);
        if (changeIndex === -1) return;

        setIsUndoing(true);

        const change = listaCambios[changeIndex];
        const newResumen = { ...resumen };
        const employeeId = change.employeeId;
        const claveEmpleado = employeeId.toString();

        if (newResumen[claveEmpleado] && (newResumen[claveEmpleado] as any).turnos) {
            delete (newResumen[claveEmpleado] as any).turnos[change.day];
            if (Object.keys((newResumen[claveEmpleado] as any).turnos).length === 0) {
                delete newResumen[claveEmpleado];
            }
        }

        setResumen(newResumen);
        setData((prev) => ({
            ...prev,
            cambios: newResumen,
        }));

        setRowData(prevData => prevData.map(emp => (
            (emp.employee_id === change.employeeId || emp.id === change.employeeId)
                ? { ...emp, [change.day]: change.oldValue }
                : emp
        )));

        setListaCambios((prev) => {
            const newList = prev.filter((_, index) => index !== changeIndex);
            if (newList.length === 0) {
                setShowPendingChanges(false);
                setOriginalChangeDate(null);
            }
            return newList;
        });

        setTimeout(() => setIsUndoing(false), 100);
    };

    const limpiarTodosLosCambios = () => {
        const confirmar = window.confirm('¿Estás seguro de que quieres descartar todos los cambios pendientes? Esta acción no se puede deshacer.');
        if (!confirmar) return;

        setResumen({});
        setListaCambios([]);
        setOriginalChangeDate(null);
        setShowPendingChanges(false);
        setComentario('');

        toast.success('Cambios descartados', {
            description: 'Todos los cambios pendientes han sido descartados.',
            duration: 3000,
        });
    };

    const limpiarCambiosSinConfirmacion = () => {
        setResumen({});
        setListaCambios([]);
        setOriginalChangeDate(null);
        setShowPendingChanges(false);
        setComentario('');
    };

    const handleActualizarCambios = (comentarioNuevo: string) => {
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

        setIsSaving(true);

        fetch(route('post-updateShifts'), {
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
            setListaCambios([]);
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
                setListaCambios([]);
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
    };

    const getTotalEmployees = () => rowData.length;

    useEffect(() => {
        limpiarCambiosSinConfirmacion();
    }, []);

    useEffect(() => {
        if (pendingDateChange && listaCambios.length === 0 && !isSaving) {
            cargarTurnosPorMes(pendingDateChange);
            setPendingDateChange(null);
        }
    }, [pendingDateChange, listaCambios.length, isSaving, cargarTurnosPorMes]);

    useEffect(() => {
        if (rowData.length > 0 && isInitialLoad) {
            setIsInitialLoad(false);
        }
    }, [rowData.length, isInitialLoad]);

    useEffect(() => {
        if (listaCambios.length === 0) {
            setShowPendingChanges(false);
        }
    }, [listaCambios.length]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
                event.preventDefault();
                undoLastChange();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [listaCambios, resumen]);

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
        setCurrentMonthTitle,
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
