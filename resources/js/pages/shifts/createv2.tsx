import { MonthYearPicker } from '@/components/month-year-picker';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AgGridHorizontal from '@/components/ui/excel-shift-horizontal';
import ShiftHistoryFeed from '@/components/ui/shift-history-feed';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { ChevronRight, FileSpreadsheet, FileText, History } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { toast } from 'sonner';
import ListaCambios from './shift-change-list';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Crear Turnos',
        href: '/shifts/create',
    },
];

interface TurnoData {
    id: string;
    nombre: string;
    [key: string]: string;
}

export default function ShiftsManager({ turnos, employee_rol_id }: any) {
    const { data, setData, post, processing, errors } = useForm({
        cambios: {},
        comentario: '',
        mes: new Date().getMonth() + 1,
        año: new Date().getFullYear(),
    });

    const { props } = usePage<{ turnos: TurnoData[]; auth: { user: any } }>();

    // Verificar si el usuario tiene permisos de supervisor o administrador
    const user = props.auth?.user;
    const hasEditPermissions = user?.roles?.some((role: any) => role.name === 'Supervisor' || role.name === 'Administrador') || false;

    const [rowData, setRowData] = useState<TurnoData[]>(props.turnos);
    const [resumen, setResumen] = useState<Record<string, Record<string, string>>>({});
    const [comentario, setComentario] = useState('');
    const [historial, setHistorial] = useState([]);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentMonthTitle, setCurrentMonthTitle] = useState(new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long' }));
    const [loading, setLoading] = useState(false);
    const [isChangesExpanded, setIsChangesExpanded] = useState(true); // Panel de cambios expandido por defecto
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false); // Panel de historial contraído por defecto
    const [resetGrid, setResetGrid] = useState(false); // Nuevo estado para reiniciar el grid
    const [isUndoing, setIsUndoing] = useState(false); // Estado para evitar registrar cambios durante deshacer
    const [originalChangeDate, setOriginalChangeDate] = useState<Date | null>(null); // Fecha original cuando se hizo el primer cambio
    const [isSaving, setIsSaving] = useState(false); // Estado para manejar el loading al guardar
    const [showPendingChanges, setShowPendingChanges] = useState(false); // Estado para mostrar cambios pendientes visualmente
    const [clearChanges, setClearChanges] = useState(false); // Estado para limpiar cambios internos de AgGrid

    // Array simplificado de cambios
    const [listaCambios, setListaCambios] = useState<Array<{
        id: string;
        employeeId: string | number;
        employeeName: string;
        employeeRut: string;
        day: string;
        oldValue: string;
        newValue: string;
        timestamp: number;
    }>>([]);
    const gridRef = useRef<any>(null);

    // Función para aplicar cambios pendientes sobre los datos cargados
    const aplicarCambiosPendientes = (turnosArray: TurnoData[], fechaActual: Date): TurnoData[] => {
        // Si no hay cambios pendientes o no hay fecha original, devolver datos sin modificar
        if (listaCambios.length === 0 || !originalChangeDate) {
            return turnosArray;
        }

        // Solo aplicar cambios si estamos viendo el mes original donde se hicieron los cambios
        if (originalChangeDate.getMonth() !== fechaActual.getMonth() ||
            originalChangeDate.getFullYear() !== fechaActual.getFullYear()) {
            return turnosArray;
        }

        try {
            // Crear una copia profunda de los datos para evitar mutaciones
            const turnosModificados = turnosArray.map(turno => ({ ...turno }));

            // Aplicar cada cambio pendiente
            listaCambios.forEach(cambio => {
                const empleadoIndex = turnosModificados.findIndex(
                    emp => emp.employee_id === cambio.employeeId || emp.id === cambio.employeeId
                );

                if (empleadoIndex !== -1) {
                    // Aplicar el cambio al día correspondiente
                    turnosModificados[empleadoIndex][cambio.day] = cambio.newValue;
                    console.log(`🔄 Aplicado cambio pendiente: ${cambio.employeeName} - día ${cambio.day} = ${cambio.newValue}`);
                }
            });

            return turnosModificados;
        } catch (error) {
            console.error('Error al aplicar cambios pendientes:', error);
            return turnosArray; // Devolver datos originales si hay error
        }
    };

    const cargarTurnosPorMes = useCallback(async (fecha: Date) => {
        const year = fecha.getFullYear();
        const month = fecha.getMonth() + 1;

        // Verificar si hay cambios pendientes y el usuario está cambiando de mes
        if (listaCambios.length > 0 && originalChangeDate &&
            (originalChangeDate.getMonth() !== fecha.getMonth() || originalChangeDate.getFullYear() !== fecha.getFullYear())) {

            toast.warning('Cambios pendientes', {
                description: `Tienes cambios pendientes para ${originalChangeDate.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}. Los cambios se aplicarán al mes original.`,
                duration: 5000,
            });
        }

        try {
            setLoading(true);
            setCurrentMonthTitle(`Cargando turnos de ${fecha.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}...`);

            const response = await fetch(`/api/turnos/${year}/${month}/${employee_rol_id}`);
            const data = await response.json();

            const turnosArray = Object.values(data) as TurnoData[];

            // Solo aplicar cambios pendientes si estamos en el mes original
            const isOriginalMonth = originalChangeDate &&
                originalChangeDate.getMonth() === fecha.getMonth() &&
                originalChangeDate.getFullYear() === fecha.getFullYear();

            if (isOriginalMonth && listaCambios.length > 0) {
                // Aplicar cambios pendientes sobre los datos cargados
                const turnosConCambiosPendientes = aplicarCambiosPendientes(turnosArray, fecha);
                setRowData(turnosConCambiosPendientes);
                // Activar visualización de cambios pendientes después de un pequeño delay
                setTimeout(() => {
                    setShowPendingChanges(true);
                }, 200);
            } else {
                // Cargar datos sin modificar y limpiar resumen
                setRowData(turnosArray);
                setResumen({}); // Limpiar resumen al cargar nuevos datos
                setListaCambios([]); // Limpiar lista de cambios
                setOriginalChangeDate(null); // Limpiar fecha original
                // Desactivar visualización de cambios pendientes
                setShowPendingChanges(false);
            }

            setCurrentMonthTitle(fecha.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' }));

            setTimeout(() => {
                if (gridRef.current) {
                    gridRef.current.autoSizeColumns(['nombre']);
                    setTimeout(() => {
                        gridRef.current.sizeColumnsToFit();
                    }, 50);
                }
            }, 100);

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
    }, [listaCambios, originalChangeDate, employee_rol_id]);

    const handleResumenUpdate = useCallback((ResumenCambios: any) => {
        setResumen(ResumenCambios);
        setData((prev) => ({
            ...prev,
            cambios: ResumenCambios,
        }));
    }, []);

    // Función para deshacer el último cambio
    const undoLastChange = async () => {
        if (listaCambios.length === 0) return;

        setIsUndoing(true); // Activar flag para evitar registrar cambios

        const lastChange = listaCambios[listaCambios.length - 1];

        // Crear una copia del resumen actual
        const newResumen = { ...resumen };

        // Usar directamente el employeeId del cambio
        const employeeId = lastChange.employeeId;

        if (!employeeId) {
            console.error('❌ No se pudo encontrar el ID del empleado:', lastChange.employeeName);
            toast.error('Error al deshacer cambio', {
                description: 'No se pudo identificar al empleado',
                duration: 4000,
            });
            setIsUndoing(false);
            return;
        }

        // Usar el ID real del empleado
        const claveEmpleado = employeeId.toString();

        // Eliminar completamente la entrada del resumen
        if (newResumen[claveEmpleado] && newResumen[claveEmpleado].turnos) {
            delete (newResumen[claveEmpleado] as any).turnos[lastChange.day];
            // Si no quedan cambios para este empleado, eliminar el empleado
            if (Object.keys((newResumen[claveEmpleado] as any).turnos).length === 0) {
                delete newResumen[claveEmpleado];
            }
        }

        // Actualizar el resumen
        setResumen(newResumen);
        setData((prev) => ({
            ...prev,
            cambios: newResumen,
        }));

        // Actualizar visualmente el grid - buscar por nombre del empleado
        if (gridRef.current?.api) {
            let targetNode: any = null;
            gridRef.current.api.forEachNode((node: any) => {
                if (node.data && node.data.nombre === lastChange.employeeName) {
                    targetNode = node;
                }
            });

            if (targetNode && targetNode.data) {
                targetNode.setDataValue(lastChange.day, lastChange.oldValue);
                gridRef.current.api.refreshCells({
                    rowNodes: [targetNode],
                    columns: [lastChange.day],
                });
            }
        }

        // Remover el cambio del historial
        setListaCambios((prev) => {
            const newList = prev.slice(0, -1);
            // Desactivar visualización de cambios pendientes si no quedan cambios
            if (newList.length === 0) {
                setShowPendingChanges(false);
            }
            return newList;
        });

        // Desactivar flag después de un pequeño delay para asegurar que el grid se actualice
        setTimeout(() => {
            setIsUndoing(false);
        }, 100);
    };

        // Función para deshacer un cambio específico
    const undoSpecificChange = async (changeId: string) => {

        const changeIndex = listaCambios.findIndex((change) => change.id === changeId);
        console.log('🔄 Índice encontrado:', changeIndex);

        if (changeIndex === -1) {
            console.log('🔄 No se encontró el cambio con ID:', changeId);
            return;
        }

        setIsUndoing(true); // Activar flag para evitar registrar cambios

        const change = listaCambios[changeIndex];

        // Crear una copia del resumen actual
        const newResumen = { ...resumen };

        // Usar directamente el employeeId del cambio
        const employeeId = change.employeeId;
        const claveEmpleado = employeeId.toString();

        // Eliminar completamente la entrada del resumen
        console.log('🔄 Resumen antes de eliminar (específico):', newResumen);
        if (newResumen[claveEmpleado] && newResumen[claveEmpleado].turnos) {
            console.log('🔄 Eliminando entrada específica:', claveEmpleado, change.day);
            delete (newResumen[claveEmpleado] as any).turnos[change.day];
            // Si no quedan cambios para este empleado, eliminar el empleado
            if (Object.keys((newResumen[claveEmpleado] as any).turnos).length === 0) {
                console.log('🔄 Eliminando empleado completo (específico):', claveEmpleado);
                delete newResumen[claveEmpleado];
            }
        }
        console.log('🔄 Resumen después de eliminar (específico):', newResumen);

        // Actualizar el resumen
        setResumen(newResumen);
        setData((prev) => ({
            ...prev,
            cambios: newResumen,
        }));

        // Actualizar visualmente el grid - buscar por nombre del empleado
        if (gridRef.current?.api) {
            let targetNode: any = null;
            gridRef.current.api.forEachNode((node: any) => {
                if (node.data && node.data.nombre === change.employeeName) {
                    targetNode = node;
                }
            });

            if (targetNode && targetNode.data) {
                targetNode.setDataValue(change.day, change.oldValue);
                gridRef.current.api.refreshCells({
                    rowNodes: [targetNode],
                    columns: [change.day],
                });
            }
        }

        // Remover el cambio del historial
        setListaCambios((prev) => {
            const newList = prev.filter((_, index) => index !== changeIndex);
            // Desactivar visualización de cambios pendientes si no quedan cambios
            if (newList.length === 0) {
                setShowPendingChanges(false);
            }
            return newList;
        });

        // Desactivar flag después de un pequeño delay para asegurar que el grid se actualice
        setTimeout(() => {
            setIsUndoing(false);
        }, 100);
    };

            // Función para registrar un cambio en el historial
    const registerChange = (employee: string, rut: string, day: string, oldValue: string, newValue: string) => {
        // Guardar la fecha original cuando se hace el primer cambio
        if (originalChangeDate === null) {
            // Usar el mes y año que están actualmente seleccionados
            const currentMonth = selectedDate.getMonth();
            const currentYear = selectedDate.getFullYear();
            const fixedDate = new Date(currentYear, currentMonth, 1);
            setOriginalChangeDate(fixedDate);
        }

        // Buscar el employee_id del empleado en los datos
        const employeeData = rowData.find((row) => row.nombre === employee);
        const employeeId = employeeData?.employee_id || employeeData?.id;

        if (!employeeId) {
            console.error('❌ No se pudo encontrar el ID del empleado:', employee);
            return;
        }

        const change = {
            id: `${employeeId}_${day}_${Date.now()}`,
            employeeId,
            employeeName: employee,
            employeeRut: rut,
            day,
            oldValue,
            newValue,
            timestamp: Date.now(),
        };

        setListaCambios((prev) => {
            const newList = [...prev, change];
            return newList;
        });
    };

    // Efecto para manejar Ctrl+Z
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

    // Efecto para limpiar estados cuando cambian los datos
    useEffect(() => {
        // Si no hay cambios pendientes, desactivar visualización
        if (listaCambios.length === 0) {
            setShowPendingChanges(false);
        }
    }, [listaCambios.length]);

    // Efecto para limpiar resumen al montar el componente
    useEffect(() => {
        // Limpiar resumen al iniciar
        setResumen({});
        setListaCambios([]);
        setOriginalChangeDate(null);
        setShowPendingChanges(false);
    }, []);

    const handleActualizarCambios = (comentarioNuevo: string) => {
        setComentario(comentarioNuevo);

        // Usar la fecha original de los cambios, o la fecha actual si no hay fecha original
        const fechaParaCambios = originalChangeDate || selectedDate;
        const mes = fechaParaCambios.getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12
        const año = fechaParaCambios.getFullYear();

        // Actualizar los datos del formulario antes de enviar
        const datosAEnviar = {
            cambios: resumen,
            comentario: comentarioNuevo,
            mes: mes,
            año: año,
        };

        setIsSaving(true); // Activar loading

        // Usar fetch directamente para asegurar que se envíen los datos correctos
        fetch(route('post-updateShifts'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
            body: JSON.stringify(datosAEnviar)
        })
        .then(response => {
            // Verificar si la respuesta es exitosa
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Verificar el tipo de contenido
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                // Si no es JSON, asumir que fue exitoso (los cambios se guardaron)
                console.log('🔄 Respuesta no-JSON recibida, asumiendo éxito');
                return { success: true, message: 'Cambios guardados correctamente' };
            }
        })
        .then(data => {
            setIsSaving(false); // Desactivar loading

            // Si llegamos aquí, los cambios se guardaron exitosamente
            setResumen({});
            setComentario('');
            setResetGrid(true); // Activar reinicio del grid
            setListaCambios([]); // Limpiar lista de cambios
            setOriginalChangeDate(null); // Limpiar fecha original
            setShowPendingChanges(false); // Desactivar visualización de cambios pendientes

            toast.success('Cambios guardados exitosamente', {
                description: 'Los turnos fueron actualizados correctamente.',
                duration: 3000,
            });

            // Resetear el flag después de un breve delay
            setTimeout(() => setResetGrid(false), 100);

            // Recargar los datos del mes actual para mostrar los cambios actualizados
            cargarTurnosPorMes(selectedDate);
        })
        .catch(error => {
            setIsSaving(false); // Desactivar loading
            console.error('Error en fetch:', error);

            // Si el error es de parsing JSON, probablemente los cambios se guardaron
            if (error instanceof SyntaxError && error.message.includes('JSON')) {
                toast.success('Cambios guardados exitosamente', {
                    description: 'Los turnos fueron actualizados correctamente.',
                    duration: 3000,
                });

                // Limpiar estados de todas formas
                setResumen({});
                setComentario('');
                setResetGrid(true);
                setListaCambios([]);
                setOriginalChangeDate(null);
                setShowPendingChanges(false);

                setTimeout(() => setResetGrid(false), 100);
                cargarTurnosPorMes(selectedDate);
            } else {
                toast.error('Error al guardar cambios', {
                    description: 'Hubo un problema al guardar los cambios. Intenta nuevamente.',
                    duration: 4000,
                });
            }
        });
    };

    const getTotalEmployees = () => rowData.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Turnos" />

            <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
                {/* Main Content */}
                <div className="p-6">
                    <div className="flex h-[calc(100vh-120px)] flex-col gap-6 xl:flex-row">
                        {/* Left Panel - Data Grid */}
                        <div className="min-w-0 flex-1">
                            <Card className="h-full border-slate-200/50 shadow-xl backdrop-blur-sm dark:bg-slate-900/90">
                                <CardHeader className="border-b bg-slate-50/50 pb-2 dark:border-slate-800 dark:bg-slate-800/50">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                                                <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                                                    Turnos del Personal {employee_rol_id === 1 ? '- Patrullaje y Proximidad' : ''}
                                                </CardTitle>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {getTotalEmployees()} empleados registrados
                                                </p>
                                            </div>
                                        </div>

                                        {/* Integrated Month/Year Picker */}
                                        <div className="flex items-center gap-3">
                                            <MonthYearPicker
                                                onChange={setSelectedDate}
                                                onLoadData={cargarTurnosPorMes}
                                                loading={loading}
                                                currentMonthTitle={currentMonthTitle}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="flex h-full flex-col px-2">
                                    {!hasEditPermissions && (
                                        <div className="mb-4 border-l-4 border-yellow-400 bg-yellow-50 p-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-yellow-700">
                                                        <strong>Modo de solo lectura:</strong> No tienes permisos para editar turnos. Solo puedes
                                                        visualizar la información.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="ag-theme-alpine h-full min-h-[400px] flex-1 overflow-hidden rounded-b-lg border-0">
                                        <AgGridHorizontal
                                            ref={gridRef}
                                            rowData={rowData}
                                            onResumenChange={handleResumenUpdate}
                                            editable={hasEditPermissions}
                                            resetGrid={resetGrid}
                                            onRegisterChange={registerChange}
                                            isUndoing={isUndoing}
                                            pendingChanges={listaCambios}
                                            originalChangeDate={originalChangeDate}
                                            month={selectedDate.getMonth()}
                                            year={selectedDate.getFullYear()}
                                            showPendingChanges={showPendingChanges}
                                            clearChanges={clearChanges}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Panel - Controls & History */}
                        <div className="flex flex-col gap-4 xl:w-[320px]">
                            {/* Resumen de cambios por aplicar - colapsable */}
                            {hasEditPermissions && (
                                <Card className="border-slate-200/50 bg-white/90 shadow-xl backdrop-blur-sm dark:bg-slate-900/90">
                                    <CardHeader
                                        className="cursor-pointer border-b border-slate-100 pb-2 transition-colors hover:bg-slate-100/50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-700/50"
                                        onClick={() => setIsChangesExpanded(!isChangesExpanded)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="rounded-md bg-orange-100 p-1 dark:bg-orange-900">
                                                    <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                </div>
                                                <CardTitle className="text-sm text-slate-900 dark:text-white">
                                                    Resumen de Cambios
                                                </CardTitle>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <ChevronRight
                                                    className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isChangesExpanded ? 'rotate-90' : ''}`}
                                                />
                                            </div>
                                        </div>
                                    </CardHeader>

                                    {isChangesExpanded && hasEditPermissions && (
                                        <div className="duration-200 animate-in slide-in-from-top-2">
                                            <ListaCambios
                                                cambios={resumen}
                                                onActualizar={(comentario) => handleActualizarCambios(comentario)}
                                                isProcesing={isSaving}
                                                isCollapsed={false}
                                                selectedDate={originalChangeDate || selectedDate}
                                                disabled={!hasEditPermissions}
                                                onUndoLastChange={undoLastChange}
                                                onUndoSpecificChange={undoSpecificChange}
                                                changeHistory={listaCambios}
                                            />
                                        </div>
                                    )}
                                </Card>
                            )}

                            {/* History Feed - Collapsible */}
                            <Card className="max-h-[40.5vh] overflow-clip border-slate-200/50 shadow-xl backdrop-blur-sm dark:bg-slate-900/90">
                                <CardHeader
                                    className="cursor-pointer border-b border-slate-100 pb-2 transition-colors hover:bg-slate-100/50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-700/50"
                                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-md bg-emerald-100 p-1 dark:bg-emerald-900">
                                                <History className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <CardTitle className="text-sm text-slate-900 dark:text-white">Actividad Reciente</CardTitle>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <ChevronRight
                                                className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isHistoryExpanded ? 'rotate-90' : ''}`}
                                            />
                                        </div>
                                    </div>
                                </CardHeader>

                                {isHistoryExpanded && (
                                    <div className="px-2 duration-200 animate-in slide-in-from-top-2">
                                        <CardContent className="p-0">
                                            <div className="p-t-[-10rem] h-[400px] overflow-hidden">
                                                <ShiftHistoryFeed />
                                            </div>
                                        </CardContent>
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>

                <Toaster
                    richColors
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(226, 232, 240, 0.5)',
                        },
                    }}
                />
            </div>
        </AppLayout>
    );
}
