import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AgGridHorizontal from '@/components/ui/excel-shift-horizontal';
import ShiftHistoryFeed from '@/components/ui/shift-history-feed';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useCallback, useState, useRef } from 'react';
import { toast } from 'sonner';
import ListaCambios from './shift-change-list';
import { MonthYearPicker } from '@/components/month-year-picker';
import {
    Calendar,
    Download,
    Users,
    Clock,
    RefreshCw,
    Database,
    Activity,
    TrendingUp,
    FileSpreadsheet,
    History,
    Settings,
    ChevronRight,
    Briefcase,
    FileText
} from 'lucide-react';

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
    });

    const { props } = usePage<{ turnos: TurnoData[] }>();

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

            const turnosArray = Object.values(data);

            console.log(turnosArray);
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

    const handleActualizarCambios = (comentarioNuevo: string) => {
        setComentario(comentarioNuevo);

        // Obtener mes y año de la fecha seleccionada
        const mes = selectedDate.getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12
        const año = selectedDate.getFullYear();

        post(route('post-updateShifts'), {
            data: {
                cambios: resumen,
                comentario: comentarioNuevo,
                mes: mes,
                año: año,
            },
            onSuccess: () => {
                setResumen({});
                setComentario('');
                toast.success('Cambios guardados exitosamente', {
                    description: 'Los turnos fueron actualizados correctamente.',
                    duration: 3000,
                });
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
                    <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-120px)]">

                        {/* Left Panel - Data Grid */}
                        <div className="flex-1 min-w-0">
                            <Card className="h-full dark:bg-slate-900/90 backdrop-blur-sm border-slate-200/50 shadow-xl">
                                <CardHeader className="border-b pb-2 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
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

                                <CardContent className="h-full flex flex-col px-2">
                                    <div className="ag-theme-alpine h-full flex-1 rounded-b-lg overflow-hidden border-0">
                                        <AgGridHorizontal
                                            ref={gridRef}
                                            rowData={rowData}
                                            onResumenChange={handleResumenUpdate}
                                            onRowClicked={(event) => {
                                                const empleadoId = event.data.id || event.data.employee_id;
                                                setEmpleadoSeleccionado(event.data);
                                                cargarHistorial(empleadoId);
                                            }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Panel - Controls & History */}
                        <div className="xl:w-[440px] flex flex-col gap-4">

                            {/* Resumen de cambios - colapsable */}
                            <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-slate-200/50 shadow-xl">
                                <CardHeader
                                    className="border-b border-slate-100 dark:border-slate-800 pb-2 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors"
                                    onClick={() => setIsChangesExpanded(!isChangesExpanded)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 bg-orange-100 dark:bg-orange-900 rounded-md">
                                                <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <CardTitle className="text-lg text-slate-900 dark:text-white">
                                                Resumen de Cambios
                                            </CardTitle>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {getTotalChanges() > 0 && (
                                                <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                                                    {Object.values(resumen).reduce((acc, fechas) => acc + Object.keys(fechas).length, 0)} modificaciones
                                                </Badge>
                                            )}
                                            <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isChangesExpanded ? 'rotate-90' : ''}`} />
                                        </div>
                                    </div>
                                </CardHeader>

                                {isChangesExpanded && (
                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                        <ListaCambios
                                            cambios={resumen}
                                            onActualizar={(comentario) => handleActualizarCambios(comentario)}
                                            isProcesing={processing}
                                            isCollapsed={false}
                                            selectedDate={selectedDate}
                                        />
                                    </div>
                                )}
                            </Card>

                            {/* History Feed - Collapsible */}
                            <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-slate-200/50 shadow-xl">
                                <CardHeader
                                    className="border-b border-slate-100 dark:border-slate-800 pb-2 dark:bg-slate-800/50 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-700/50 transition-colors"
                                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 bg-emerald-100 dark:bg-emerald-900 rounded-md">
                                                <History className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <CardTitle className="text-lg text-slate-900 dark:text-white">
                                                Actividad Reciente
                                            </CardTitle>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                                Últimos cambios
                                            </Badge>
                                            <ChevronRight className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isHistoryExpanded ? 'rotate-90' : ''}`} />
                                        </div>
                                    </div>
                                </CardHeader>

                                {isHistoryExpanded && (
                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                        <CardContent className="p-0">
                                            <div className="h-[400px] overflow-hidden">
                                                <ShiftHistoryFeed />
                                            </div>
                                        </CardContent>
                                    </div>
                                )}
                            </Card>

                            {/* Quick Actions Panel - Always Visible */}
                            {/* <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 border-blue-200 dark:border-slate-600 shadow-lg">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                            <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white">Acciones Rápidas</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs bg-white/50 hover:bg-white/80 border-blue-200"
                                            disabled
                                        >
                                            <Download className="h-3 w-3 mr-1" />
                                            Exportar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs bg-white/50 hover:bg-white/80 border-blue-200"
                                            disabled
                                        >
                                            <RefreshCw className="h-3 w-3 mr-1" />
                                            Sincronizar
                                        </Button>
                                    </div>

                                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                                        <p>💡 <strong>Tip:</strong> Haz clic en una fila para ver el historial del empleado</p>
                                    </div>
                                </CardContent>
                            </Card> */}
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
                        }
                    }}
                />
            </div>
        </AppLayout>
    );
}
