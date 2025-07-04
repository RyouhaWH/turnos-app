import { Button } from '@/components/ui/button';
import AgGridHorizontal from '@/components/ui/excel-shift-horizontal';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';
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

    name: string,

}

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

export default function ShiftsManager({ shifts }: any) {
    const { props } = usePage<{ turnos: TurnoData[] }>();
    const rowData = props.turnos;

    const [resumen, setResumen] = useState<Record<string, Record<string, Date>>>({});

    // Esta función se mantiene estable entre renders
    const handleResumenUpdate = useCallback((ResumenCambios) => {

        console.log(ResumenCambios)
        setResumen(ResumenCambios);
    }, []);

    // Aquí llamas a tu endpoint o lógica de guardar cambios en DB
    const handleActualizarCambios = () => {
        console.log("Actualizando con estos cambios:", resumen);
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
                            onResumenChange={handleResumenUpdate} />
                    </div>

                    {/* Resumen fijo */}
                    <div className="relative w-[420px] shrink-0">
                        <div className="sticky  max-h-[calc(100vh-2rem)] overflow-y-auto p-3 text-sm">
                            <h2 className="mb-2 text-center font-bold">Resumen</h2>
                            <ListaCambios
                                cambios={resumen}
                                onActualizar={handleActualizarCambios}/>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
