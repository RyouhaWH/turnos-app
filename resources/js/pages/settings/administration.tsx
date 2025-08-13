import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head } from '@inertiajs/react';
import HeadingSmall from '@/components/heading-small';
import CreateUser from '@/components/CreateUser';
import UserRoleManagement from '@/components/UserRoleManagement';
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
}

export default function Administration({ users = [], roles = [] }: AdministrationProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Administración" />
            <SettingsLayout>
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
                            roles={[
                                { id: 1, name: 'Administrador' },
                                { id: 2, name: 'Supervisor' },
                                { id: 3, name: 'Usuario' }
                            ]}
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
