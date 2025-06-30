import AgGridHorizontal from '@/components/ui/excel-shift-horizontal';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';
// import contarTurnos from '@/lib/shift-counter';

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

const contarTurnos = (datos: TurnoData[]): TurnoResumen => {
  const conteo: TurnoResumen = {}
  for (const fila of datos) {
    for (const key in fila) {
      if (key === 'nombre' || key === 'id') continue
      const valor = (fila[key] || '').toUpperCase().trim()
      if (!valor) continue
      if (!conteo[valor]) {
        conteo[valor] = 0
      }
      conteo[valor] += 1
    }
  }
  return conteo
}

export default function ShiftsManager({ shifts }: any) {
    const { props } = usePage<{ turnos: TurnoData[] }>();
    const rowData = props.turnos;

    const [resumen, setResumen] = useState<Record<string, number>>({});

    // Esta función se mantiene estable entre renders
    const handleResumenUpdate = useCallback((nuevoResumen: TurnoResumen) => {
        setResumen(nuevoResumen);
    }, []);


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div
                    className="ag-theme-alpine relative min-h-[100vh] flex-1 overflow-auto rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border"
                    style={{ height: 600, width: '75%' }}
                >
                    <h1>Crear nuevo horario</h1>

                    {/* <ShiftsAGGrid shifts={shifts}/> */}
                    <AgGridHorizontal rowData={rowData} onResumenChange={handleResumenUpdate} />

                    <div className="min-w-[150px] rounded border bg-gray-50 p-3 text-sm shadow">
                        <h2 className="mb-2 text-center font-bold">Resumen</h2>
                        {Object.entries(resumen).map(([turno, cantidad]) => (
                            <div key={turno} className="flex justify-between border-b py-1 text-gray-700">
                                <span>{turno}</span>
                                <span>{cantidad}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
