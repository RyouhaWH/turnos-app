import AgGridHorizontal from '@/components/ui/excel-shift-horizontal';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';
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

interface ChangeShift {
    name: string;
}

const [historial, setHistorial] = useState([]);
const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);

const cargarHistorial = async (employeeId) => {
    const res = await fetch(`/api/shift-change-log/${employeeId}`);
    const data = await res.json();
    setHistorial(data);
};

const contarTurnos = (datos: TurnoData[]): TurnoResumen => {
    const conteo: TurnoResumen = {};
    for (const fila of datos) {
        for (const key in fila) {
            if (key === 'nombre' || key === 'id') continue;
            const valor = (fila[key] || '').toUpperCase().trim();
            if (!valor) continue;
            if (!conteo[valor]) {
                conteo[valor] = 0;
            }
            conteo[valor] += 1;
        }
    }
    return conteo;
};

export default function ShiftsManager({ turnos, employee_rol_id }: any) {
    const { data, setData, post, processing, errors } = useForm({
        cambios: {},
    });
    const { props } = usePage<{ turnos: TurnoData[] }>();
    const rowData = props.turnos;

    const [resumen, setResumen] = useState<Record<string, Record<string, Date>>>({});

    console.log('el rol del empleado es: ' + employee_rol_id);

    // Esta función se mantiene estable entre renders
    const handleResumenUpdate = useCallback((ResumenCambios) => {
        console.log(ResumenCambios);
        setResumen(ResumenCambios);
        setData(ResumenCambios);
        setData({ cambios: ResumenCambios });
    }, []);

    // Aquí llamas a tu endpoint o lógica de guardar cambios en DB
    const handleActualizarCambios = () => {
        console.log('turnos-mes/actualizar');
        post(route('post-updateShifts'), {
            onSuccess: () => {
                console.log('✅ Turnos guardados correctamente');
                setResumen({}); // limpia cambios si quieres
                toast('✅ Cambios guardados', {
                    description: 'Los turnos fueron actualizados correctamente.',
                });
            },
            onError: (error) => {
                console.error('❌ Error al guardar:', error);
                toast('❌ Error al guardar', {
                    description: 'Hubo un problema al guardar los cambios.',
                });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-screen flex-col gap-4 overflow-hidden p-4">
                {/* Contenedor principal (tabla + resumen) */}
                <div className="flex flex-1 gap-4 overflow-hidden">
                    {/* Tabla */}
                    <div className="ag-theme-alpine flex-1 overflow-auto rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
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

                    {/* Resumen fijo */}
                    <div className="relative w-[420px] shrink-0">
                        <div className="sticky max-h-[calc(100vh-2rem)] overflow-y-auto p-3 text-sm">
                            <h2 className="mb-2 text-center font-bold">Resumen</h2>
                            <ListaCambios cambios={resumen} onActualizar={handleActualizarCambios} isProcesing={processing} />
                        </div>
                    </div>

                    <Toaster />
                </div>
            </div>
        </AppLayout>
    );
}
