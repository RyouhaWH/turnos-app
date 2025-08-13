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
    const { props } = usePage<{ turnos: TurnoData[]; auth: { user: any } }>();
    const rowData = props.turnos;

    // Verificar si el usuario tiene permisos de supervisor o administrador
    const user = props.auth?.user;
    const hasEditPermissions = user?.roles?.some((role: any) =>
        role.name === 'Supervisor' || role.name === 'Administrador'
    ) || false;

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
                        <AgGridHorizontal
                            rowData={rowData}
                            onResumenChange={handleResumenUpdate}
                            onRowClicked={(event) => {
                                console.log('hola mundo')
                                const empleadoId = event.data.id || event.data.employee_id;
                                setEmpleadoSeleccionado(event.data);
                                cargarHistorial(empleadoId);
                            }}
                            editable={hasEditPermissions}
                        />
                    </div>

                    {/* Panel lateral derecho */}
                    {hasEditPermissions && (
                        <div className="relative w-[420px] shrink-0">
                            <div className="sticky max-h-[calc(100vh-2rem)] overflow-y-auto p-3 text-sm">
                                <h2 className="mb-2 text-center font-bold">Resumen</h2>
                                <ListaCambios
                                    cambios={resumen}
                                    onActualizar={handleActualizarCambios}
                                    isProcesing={processing}
                                    disabled={!hasEditPermissions}
                                />
                            </div>
                        </div>
                    )}
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
