import { Button } from '@/components/ui/button';
import AgGridHorizontal from '@/components/ui/excel-shift-horizontal';
import ShiftHistoryFeed from '@/components/ui/shift-history-feed';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import ListaCambios from './shift-change-list';
import { DatePickerDemo } from '@/components/ui/date-picker';

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
    const mesActual = 'Julio';

    const { data, setData, post, processing, errors } = useForm({
        cambios: {},
        comentario: '',
    });

    const { props } = usePage<{ turnos: TurnoData[] }>();

    let rowData = props.turnos;

    const [resumen, setResumen] = useState<Record<string, Record<string, Date>>>({});
    const [comentario, setComentario] = useState('');
    const [historial, setHistorial] = useState([]);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());


    const cargarHistorial = async (employeeId: number | string) => {
        const res = await fetch(`/api/shift-change-log/${employeeId}`);
        const data = await res.json();
        setHistorial(data);
    };

    const cargarTurnosPorMes = async (fecha) => {

        const year = fecha.getFullYear();
        const month = fecha.getMonth() + 1;

        try {
            const response = await fetch(`/api/shifts/${year}/${month}/${employee_rol_id}`);
            const data = await response.json();
            rowData = data;
        } catch (error) {
            console.error('Error al cargar turnos:', error);
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
        console.log(comentarioNuevo);
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
                        <h2 className="mb-2 text-center font-bold">{mesActual}</h2>
                        <div className="ag-theme-alpine h-full flex-1 overflow-auto pb-4 dark:border-sidebar-border">
                            <AgGridHorizontal
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
                            {/* Ejemplo básico de mes/año selector */}
                            <DatePicker selected={selectedDate} onChange={(date) => setSelectedDate(date)} dateFormat="MM/yyyy" showMonthYearPicker />
                            <Button onClick={() => cargarTurnosPorMes(selectedDate)}>Cargar turnos</Button>

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
