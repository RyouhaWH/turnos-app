import { Button } from '@/components/ui/button';
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

    // 🔥 CAMBIO PRINCIPAL: Usar useState para rowData
    const [rowData, setRowData] = useState<TurnoData[]>(props.turnos);

    const [resumen, setResumen] = useState<Record<string, Record<string, Date>>>({});
    const [comentario, setComentario] = useState('');
    const [historial, setHistorial] = useState([]);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [loading, setLoading] = useState(false);
    const gridRef = useRef<any>(null); // Referencia al grid

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
            console.log(year, month, employee_rol_id);
            const response = await fetch(`/api/turnos/${year}/${month}/${employee_rol_id}`);
            const data = await response.json();

            // 🔥 Convertir objeto a array para AgGrid
            const turnosArray = Object.values(data);
            console.log('Datos convertidos a array:', turnosArray);

            setRowData(turnosArray);

            // 🔥 NUEVO: Forzar redimensionamiento después de actualizar datos
            setTimeout(() => {
                if (gridRef.current) {
                    // Autosize solo la columna de nombres y luego ajustar el resto
                    gridRef.current.autoSizeColumns(['nombre']);
                    setTimeout(() => {
                        gridRef.current.sizeColumnsToFit();
                    }, 50);
                }
            }, 100);

            toast('✅ Turnos cargados', {
                description: `Turnos de ${fecha.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })} cargados correctamente.`,
            });
        } catch (error) {
            console.error('Error al cargar turnos:', error);
            toast('❌ Error al cargar turnos', {
                description: 'Hubo un problema al cargar los turnos del mes seleccionado.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleResumenUpdate = useCallback((ResumenCambios) => {
        setResumen(ResumenCambios);
        setData((prev) => ({
            ...prev,
            cambios: ResumenCambios,
        }));
    }, []);

    const handleActualizarCambios = (comentarioNuevo: string) => {
        setComentario(comentarioNuevo);

        post(route('post-updateShifts'), {
            data: {
                cambios: resumen,
                comentario: comentarioNuevo,
            },
            onSuccess: () => {
                setResumen({});
                setComentario('');
                toast('✅ Cambios guardados', {
                    description: 'Los turnos fueron actualizados correctamente.',
                });
                // Opcional: recargar datos después de guardar
                cargarTurnosPorMes(selectedDate);
            },
            onError: () => {
                toast('❌ Error al guardar', {
                    description: 'Hubo un problema al guardar los cambios.',
                });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-col gap-4 overflow-hidden p-4">
                {/* Contenedor principal */}
                <div className="flex flex-1 gap-4 overflow-hidden">
                    {/* Tabla AG Grid */}
                    <div className="h-auto w-full pb-4">
                        <h2 className="mb-2 text-center font-bold">
                            {selectedDate.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}
                        </h2>

                        <div className="ag-theme-alpine h-full flex-1 overflow-auto pb-4 dark:border-sidebar-border">
                            {/* Ahora usa el estado de React */}
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
                    </div>

                    {/* Panel lateral derecho */}
                    <div className="relative w-[420px] shrink-0 overflow-hidden">
                        <div className="sticky max-h-[calc(100vh-2rem)] overflow-y-hidden p-3 text-sm">
                            {/* Selector de mes y año con ShadCN */}
                            <MonthYearPicker onChange={setSelectedDate} />
                            <Button
                                className="mb-4 w-full"
                                onClick={() => cargarTurnosPorMes(selectedDate)}
                                disabled={loading} // Opcional: deshabilitar mientras carga
                            >
                                {loading ? 'Cargando...' : 'Cargar turnos'}
                            </Button>

                            {/* Resumen de cambios */}
                            <h2 className="mb-2 text-center font-bold">Resumen</h2>
                            <ListaCambios
                                cambios={resumen}
                                onActualizar={(comentario) => handleActualizarCambios(comentario)}
                                isProcesing={processing}
                            />

                            {/* Feed lateral */}
                            <div className="h-full w-auto shrink-0 py-4">
                                <ShiftHistoryFeed />
                            </div>
                        </div>
                    </div>
                </div>

                <Toaster />
            </div>
        </AppLayout>
    );
}
