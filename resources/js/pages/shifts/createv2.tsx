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
import { useCallback, useEffect, useRef, useState } from 'react';
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
    const hasEditPermissions = user?.roles?.some((role: any) =>
        role.name === 'Supervisor' || role.name === 'Administrador'
    ) || false;

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
    const [changeHistory, setChangeHistory] = useState<Array<{
        id: string;
        employee: string;
        employeeId?: string | number;
        day: string;
        oldValue: string;
        newValue: string;
        timestamp: number;
    }>>([]); // Historial de cambios para poder deshacer
    const gridRef = useRef<any>(null);

    const cargarHistorial = async (employeeId: number | string) => {
        const res = await fetch(`/api/shift-change-log/${employeeId}`);
        const data = await res.json();
        setHistorial(data);
    };

    const cargarTurnosPorMes = async (fecha: Date) => {
        const year = fecha.getFullYear();
        const month = fecha.getMonth() + 1;

        try {
            setLoading(true);
            setCurrentMonthTitle(`Cargando turnos de ${fecha.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}...`);

            const response = await fetch(`/api/turnos/${year}/${month}/${employee_rol_id}`);
            const data = await response.json();

            const turnosArray = Object.values(data) as TurnoData[];

            setRowData(turnosArray);
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
    };

    const handleResumenUpdate = useCallback((ResumenCambios: Record<string, Record<string, string>>) => {
        setResumen(ResumenCambios);
        setData((prev) => ({
            ...prev,
            cambios: ResumenCambios,
        }));
    }, []);

    // Función para deshacer el último cambio
    const undoLastChange = async () => {
        if (changeHistory.length === 0) return;

        setIsUndoing(true); // Activar flag para evitar registrar cambios

        const lastChange = changeHistory[changeHistory.length - 1];

        // Crear una copia del resumen actual
        const newResumen = { ...resumen };

        // Buscar el empleado real en los datos del grid para obtener el ID correcto
        const employeeData = rowData.find(row => row.nombre === lastChange.employee);
        const employeeId = employeeData?.employee_id || employeeData?.id;

        if (!employeeId) {
            console.error('🔄 No se pudo encontrar el ID del empleado:', lastChange.employee);
            toast.error('Error al deshacer cambio', {
                description: 'No se pudo identificar al empleado',
                duration: 4000,
            });
            setIsUndoing(false);
            return;
        }

        // Usar el ID real del empleado
        const claveEmpleado = employeeId.toString();

        // Restaurar el valor anterior
        if (lastChange.oldValue === '') {
            // Si el valor anterior estaba vacío, eliminar la entrada
            if (newResumen[claveEmpleado]) {
                delete newResumen[claveEmpleado][lastChange.day];
                // Si no quedan cambios para este empleado, eliminar el empleado
                if (Object.keys(newResumen[claveEmpleado]).length === 0) {
                    delete newResumen[claveEmpleado];
                }
            }
        } else {
            // Restaurar el valor anterior
            if (!newResumen[claveEmpleado]) {
                newResumen[claveEmpleado] = {};
            }
            newResumen[claveEmpleado][lastChange.day] = lastChange.oldValue;
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
                if (node.data && node.data.nombre === lastChange.employee) {
                    targetNode = node;
                }
            });

            if (targetNode && targetNode.data) {
                targetNode.setDataValue(lastChange.day, lastChange.oldValue);
                gridRef.current.api.refreshCells({
                    rowNodes: [targetNode],
                    columns: [lastChange.day]
                });
            }
        }

        // Remover el cambio del historial
        setChangeHistory(prev => prev.slice(0, -1));

        // Desactivar flag después de un pequeño delay para asegurar que el grid se actualice
        setTimeout(() => {
            setIsUndoing(false);
        }, 100);
    };

    // Función para deshacer un cambio específico
    const undoSpecificChange = async (changeId: string) => {
        const changeIndex = changeHistory.findIndex(change => change.id === changeId);
        if (changeIndex === -1) return;

        setIsUndoing(true); // Activar flag para evitar registrar cambios

        const change = changeHistory[changeIndex];

        // Crear una copia del resumen actual
        const newResumen = { ...resumen };

        // Buscar el empleado real en los datos del grid para obtener el ID correcto
        const employeeData = rowData.find(row => row.nombre === change.employee);
        const employeeId = employeeData?.employee_id || employeeData?.id;

        if (!employeeId) {
            console.error('🔄 No se pudo encontrar el ID del empleado:', change.employee);
            toast.error('Error al deshacer cambio', {
                description: 'No se pudo identificar al empleado',
                duration: 4000,
            });
            setIsUndoing(false);
            return;
        }

        // Usar el ID real del empleado
        const claveEmpleado = employeeId.toString();

        // Restaurar el valor anterior
        if (change.oldValue === '') {
            // Si el valor anterior estaba vacío, eliminar la entrada
            if (newResumen[claveEmpleado]) {
                delete newResumen[claveEmpleado][change.day];
                // Si no quedan cambios para este empleado, eliminar el empleado
                if (Object.keys(newResumen[claveEmpleado]).length === 0) {
                    delete newResumen[claveEmpleado];
                }
            }
        } else {
            // Restaurar el valor anterior
            if (!newResumen[claveEmpleado]) {
                newResumen[claveEmpleado] = {};
            }
            newResumen[claveEmpleado][change.day] = change.oldValue;
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
                if (node.data && node.data.nombre === change.employee) {
                    targetNode = node;
                }
            });

            if (targetNode && targetNode.data) {
                targetNode.setDataValue(change.day, change.oldValue);
                gridRef.current.api.refreshCells({
                    rowNodes: [targetNode],
                    columns: [change.day]
                });
            }
        }

        // Remover el cambio del historial
        setChangeHistory(prev => prev.filter((_, index) => index !== changeIndex));

        // Desactivar flag después de un pequeño delay para asegurar que el grid se actualice
        setTimeout(() => {
            setIsUndoing(false);
        }, 100);
    };

    // Función para registrar un cambio en el historial
    const registerChange = (employee: string, day: string, oldValue: string, newValue: string) => {
        // Buscar el employee_id del empleado en los datos
        const employeeData = rowData.find(row => row.nombre === employee);
        const employeeId = employeeData?.employee_id || employeeData?.id;

        const change = {
            id: `${employeeId}_${day}_${Date.now()}`,
            employee,
            employeeId,
            day,
            oldValue,
            newValue,
            timestamp: Date.now(),
        };

        setChangeHistory(prev => [...prev, change]);
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
    }, [changeHistory, resumen]);

    const handleActualizarCambios = (comentarioNuevo: string) => {
        setComentario(comentarioNuevo);

        // Obtener mes y año de la fecha seleccionada
        const mes = selectedDate.getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12
        const año = selectedDate.getFullYear();

        // Actualizar los datos del formulario antes de enviar
        setData({
            cambios: resumen,
            comentario: comentarioNuevo,
            mes: mes,
            año: año,
        });

        post(route('post-updateShifts'), {
            onSuccess: () => {
                setResumen({});
                setComentario('');
                setResetGrid(true); // Activar reinicio del grid
                setChangeHistory([]); // Limpiar historial de cambios
                toast.success('Cambios guardados exitosamente', {
                    description: 'Los turnos fueron actualizados correctamente.',
                    duration: 3000,
                });
                // Resetear el flag después de un breve delay
                setTimeout(() => setResetGrid(false), 100);
                cargarTurnosPorMes(selectedDate);
            },
            onError: () => {
                toast.error('Error al guardar cambios', {
                    description: 'Hubo un problema al guardar los cambios. Intenta nuevamente.',
                    duration: 4000,
                });
            },
        });
    };

    const getTotalEmployees = () => rowData.length;
    const getTotalChanges = () => Object.keys(resumen).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Turnos" />

            <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
                {/* Header Section */}
                {/* <div className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                    <div className="px-6 pt-4 pb-2">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"> */}
                {/* Title Section */}
                {/* <div className="flex items-start gap-4">
                                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                                    <Briefcase className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                        Gestión de Turnos
                                    </h1>
                                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                                        Administra y actualiza los turnos del personal de manera eficiente
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                                        <Calendar className="h-4 w-4" />
                                        <span>Período actual: {currentMonthTitle}</span>
                                    </div>
                                </div>
                            </div> */}

                {/* Quick Stats */}
                {/* <div className="flex flex-wrap gap-4">
                                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 border-0 shadow-lg">
                                    <CardContent className="flex items-center gap-3 p-4">
                                        <div className="p-2 bg-white/20 rounded-lg">
                                            <Users className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white">{getTotalEmployees()}</p>
                                            <p className="text-blue-100 text-sm">Empleados activos</p>
                                        </div>
                                    </CardContent>
                                </Card> */}

                {/* Tarjeta de cambios realizados */}
                {/* <Card className="bg-gradient-to-r from-amber-500 to-amber-600 border-0 shadow-lg">
                                    <CardContent className="flex items-center gap-3 p-4">
                                        <div className="p-2 bg-white/20 rounded-lg">
                                            <Activity className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white">{getTotalChanges()}</p>
                                            <p className="text-amber-100 text-sm">Cambios pendientes</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div> */}
                {/* </div>
                    </div>
                </div> */}

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
                                                    Turnos del Personal
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
                                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                            <div className="flex">
                                                <div className="flex-shrink-0">
                                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-yellow-700">
                                                        <strong>Modo de solo lectura:</strong> No tienes permisos para editar turnos. Solo puedes visualizar la información.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="ag-theme-alpine h-full flex-1 overflow-hidden rounded-b-lg border-0">
                                        <AgGridHorizontal
                                            ref={gridRef}
                                            rowData={rowData}
                                            onResumenChange={handleResumenUpdate}
                                            onRowClicked={(event) => {
                                                const empleadoId = event.data?.id || event.data?.employee_id;
                                                setEmpleadoSeleccionado(event.data);
                                                if (empleadoId) {
                                                    cargarHistorial(empleadoId);
                                                }
                                            }}
                                            editable={hasEditPermissions}
                                            resetGrid={resetGrid}
                                            onRegisterChange={registerChange}
                                            isUndoing={isUndoing}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Panel - Controls & History */}
                        <div className="flex flex-col gap-4 xl:w-[280px]">
                            {/* Resumen de cambios - colapsable */}
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
                                                {getTotalChanges() > 0 && (
                                                    <Badge variant="secondary" className="border-orange-200 bg-orange-100 text-orange-700">
                                                        {Object.values(resumen).reduce((acc, fechas) => acc + Object.keys(fechas).length, 0)}{' '}
                                                        modificaciones
                                                    </Badge>
                                                )}
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
                                            isProcesing={processing}
                                            isCollapsed={false}
                                            selectedDate={selectedDate}
                                            disabled={!hasEditPermissions}
                                            onUndoLastChange={undoLastChange}
                                            onUndoSpecificChange={undoSpecificChange}
                                            changeHistory={changeHistory}
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
