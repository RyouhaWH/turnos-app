import AgGridHorizontal from '@/components/ui/excel-shift-horizontal';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import ListaCambios from './shift-change-list';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Crear Turnos', href: '/shifts/create' },
];

interface TurnoData {
    id: string;
    nombre: string;
    [key: string]: string;
}

export default function ShiftsManager({ turnos, employee_rol_id }: any) {
    const { data, setData, post, processing } = useForm({ cambios: {} });
    const { props } = usePage<{ turnos: TurnoData[] }>();
    const rowData = props.turnos;

    const [resumen, setResumen] = useState<Record<string, Record<string, Date>>>({});
    const [historial, setHistorial] = useState([]);
    const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const cargarHistorial = async (employeeId: number | string) => {
        const res = await fetch(`/api/shift-change-log/${employeeId}`);
        const data = await res.json();
        setHistorial(data);
        setIsModalOpen(true);
    };

    const handleResumenUpdate = useCallback((ResumenCambios) => {
        setResumen(ResumenCambios);
        setData({ cambios: ResumenCambios });
    }, []);

    const handleActualizarCambios = () => {
        post(route('post-updateShifts'), {
            onSuccess: () => {
                setResumen({});
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
            <div className="flex h-screen flex-col gap-4 overflow-hidden p-4">
                <div className="flex flex-1 gap-4 overflow-hidden">
                    {/* AG Grid */}
                    <div className="ag-theme-alpine flex-1 overflow-auto rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <AgGridHorizontal
                            rowData={rowData}
                            onResumenChange={handleResumenUpdate}
                            onRowClicked={(event) => {
                                console.log('hola mundo')
                                const empleadoId = event.data.id || event.data.employee_id;
                                setEmpleadoSeleccionado(event.data);
                                cargarHistorial(empleadoId);
                            }}
                        />
                    </div>

                    {/* Panel lateral derecho */}
                    <div className="relative w-[420px] shrink-0">
                        <div className="sticky max-h-[calc(100vh-2rem)] overflow-y-auto p-3 text-sm">
                            <h2 className="mb-2 text-center font-bold">Resumen</h2>
                            <ListaCambios
                                cambios={resumen}
                                onActualizar={handleActualizarCambios}
                                isProcesing={processing}
                            />
                        </div>
                    </div>
                </div>

                <Toaster />

                {/* Modal con historial */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent className="max-w-5xl">
                        <DialogHeader>
                            <DialogTitle>
                                Historial – {empleadoSeleccionado?.nombre ?? 'Empleado'}
                            </DialogTitle>
                        </DialogHeader>

                        {historial.length > 0 ? (
                            <div className="overflow-auto max-h-[70vh]">
                                <table className="w-full text-sm border text-left">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="border px-2 py-1">Fecha</th>
                                            <th className="border px-2 py-1">Anterior</th>
                                            <th className="border px-2 py-1">Nuevo</th>
                                            <th className="border px-2 py-1">Comentario</th>
                                            <th className="border px-2 py-1">Modificado por</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historial.map((registro: any, idx: number) => (
                                            <tr key={idx}>
                                                <td className="border px-2 py-1">{registro.changed_at}</td>
                                                <td className="border px-2 py-1">{registro.old_shift}</td>
                                                <td className="border px-2 py-1">{registro.new_shift}</td>
                                                <td className="border px-2 py-1">{registro.comment}</td>
                                                <td className="border px-2 py-1">
                                                    {registro.user?.name ?? 'Desconocido'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 mt-4 text-center">
                                No hay historial para este empleado.
                            </p>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
