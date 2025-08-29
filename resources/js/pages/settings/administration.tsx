import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head } from '@inertiajs/react';
import HeadingSmall from '@/components/heading-small';
import CreateUser from '@/components/CreateUser';
import UserRoleManagement from '@/components/UserRoleManagement';

import PermissionDenied from '@/components/PermissionDenied';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Separator } from '@/components/ui/separator';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Administración', href: '/settings/administration' },
];

interface User {
    id: number;
    name: string;
    email: string;
    roles: Array<{
        id: number;
        name: string;
    }>;
}

interface Role {
    id: number;
    name: string;
}

interface AdministrationProps {
    users?: User[];
    roles?: Role[];
    error?: string;
    auth?: {
        user: User;
    };
}

export default function Administration({ users = [], roles = [], error, auth }: AdministrationProps) {


    // Si hay un error de permisos, mostrar el componente PermissionDenied
    if (error) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Acceso Denegado" />
                <SettingsLayout user={auth?.user}>
                    <PermissionDenied message={error} />
                </SettingsLayout>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Administración" />
            <SettingsLayout user={auth?.user}>
                <div className="space-y-8">
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
                            roles={roles}
                        />
                    </div>

                    <Separator />

                    {/* Sección para gestionar roles */}
                    <div className="space-y-6">
                        <UserRoleManagement users={users} roles={roles} />
                    </div>

                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
