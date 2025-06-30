import AgGridHorizontal from '@/components/ui/excel-shift-horizontal';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Crear Turnos',
        href: '/shifts/create',
    },
];

interface TurnoData {
  id: string
  nombre: string
  [key: string]: string
}

export default function ShiftsManager({ shifts }: any) {

    const { props } = usePage<{ turnos: TurnoData[] }>()
    const rowData = props.turnos



    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="ag-theme-alpine relative min-h-[100vh] flex-1 overflow-auto rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border"
                style={{ height: 600, width: '75%' }}
                >

                <h1>Crear nuevo horario</h1>



                {/* <ShiftsAGGrid shifts={shifts}/> */}
                <AgGridHorizontal rowData={rowData}/>


                </div>
            </div>
        </AppLayout>
    );
}
