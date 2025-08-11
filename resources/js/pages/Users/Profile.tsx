import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { User, Shield, Key, Calendar } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Mi Perfil',
        href: '/profile',
    },
];

interface UserProfile {
    id: number;
    name: string;
    email: string;
    roles: string[];
    permissions: string[];
}

interface ProfileProps {
    user: UserProfile;
}

export default function Profile({ user }: ProfileProps) {
    const getRoleColor = (role: string) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'manager':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'user':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
                return <Shield className="h-4 w-4" />;
            case 'manager':
                return <User className="h-4 w-4" />;
            case 'user':
                return <User className="h-4 w-4" />;
            default:
                return <User className="h-4 w-4" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mi Perfil" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Mi Perfil</h1>
                        <p className="text-muted-foreground">Información de tu cuenta y permisos</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Información del Usuario */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Información Personal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                                <p className="text-lg font-semibold">{user.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Email</label>
                                <p className="text-lg font-semibold">{user.email}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">ID de Usuario</label>
                                <p className="text-lg font-semibold">#{user.id}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Roles */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Roles Asignados
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {user.roles.length > 0 ? (
                                    user.roles.map((role) => (
                                        <Badge
                                            key={role}
                                            className={`flex items-center gap-2 ${getRoleColor(role)}`}
                                        >
                                            {getRoleIcon(role)}
                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground">No tienes roles asignados</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Permisos */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                Permisos Disponibles
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {user.permissions.length > 0 ? (
                                    user.permissions.map((permission) => (
                                        <Badge
                                            key={permission}
                                            variant="outline"
                                            className="flex items-center gap-2"
                                        >
                                            <Key className="h-3 w-3" />
                                            {permission.replace('_', ' ')}
                                        </Badge>
                                    ))
                                ) : (
                                    <p className="text-muted-foreground">No tienes permisos específicos</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Información adicional */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Información del Sistema
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <label className="font-medium text-muted-foreground">Total de Roles</label>
                                <p className="text-lg font-semibold">{user.roles.length}</p>
                            </div>
                            <div>
                                <label className="font-medium text-muted-foreground">Total de Permisos</label>
                                <p className="text-lg font-semibold">{user.permissions.length}</p>
                            </div>
                            <div>
                                <label className="font-medium text-muted-foreground">Nivel de Acceso</label>
                                <p className="text-lg font-semibold">
                                    {user.roles.includes('admin') ? 'Administrador' :
                                     user.roles.includes('manager') ? 'Gerente' : 'Usuario'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
