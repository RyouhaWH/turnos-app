import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import CreateUser from '@/components/CreateUser';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Administración',
        href: '/settings/administration',
    },
];

export default function Administration() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Administración" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Administración del Sistema"
                        description="Gestiona usuarios y configuraciones del sistema"
                    />

                    {/* Sección para crear usuarios */}
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium">Crear Nuevo Usuario</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Crea nuevas cuentas de usuario para el sistema
                            </p>
                        </div>

                        <CreateUser
                            roles={[
                                { id: 1, name: 'Administrador' },
                                { id: 2, name: 'Supervisor' },
                                { id: 3, name: 'Usuario' }
                            ]}
                        />
                    </div>

                    {/* Aquí puedes agregar más secciones de administración en el futuro */}
                    {/* Por ejemplo: Lista de usuarios, gestión de roles, estadísticas, etc. */}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
