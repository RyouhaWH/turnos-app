import AgGridHorizontal from '@/components/ui/excel-shift-horizontal';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import ListaCambios from './shift-change-list';
import { useShiftsManager } from './hooks/useShiftsManager';

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
    const { props } = usePage<{ turnos: TurnoData[] }>();
    const rowData = props.turnos;

    // Usar el hook useShiftsManager
    const {
        resumen,
        handleActualizarCambios,
        registerChange,
        isSaving,
        listaCambios,
        handleResumenUpdate
    } = useShiftsManager(employee_rol_id);

    // Esta función se mantiene estable entre renders para compatibilidad
    const handleResumenUpdateCallback = useCallback((ResumenCambios) => {
        handleResumenUpdate(ResumenCambios);
    }, [handleResumenUpdate]);

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
                            onResumenChange={handleResumenUpdateCallback}
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
                            <ListaCambios cambios={resumen} onActualizar={handleActualizarCambios} isProcesing={isSaving} />
                        </div>
                    </div>

                    <Toaster />
                </div>
            </div>
        </AppLayout>
    );
}
