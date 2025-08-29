import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Shield, AlertCircle, CheckCircle, Key, Mail } from 'lucide-react';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import ChangeEmailForm from '@/components/ChangeEmailForm';

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

interface UserRoleManagementProps {
    users: User[];
    roles: Role[];
}

// Definir la jerarquía de roles
const ROLE_HIERARCHY = {
    'Administrador': ['Usuario', 'Supervisor', 'Administrador'],
    'Supervisor': ['Usuario', 'Supervisor'],
    'Usuario': ['Usuario']
};

export default function UserRoleManagement({ users, roles }: UserRoleManagementProps) {
    const [selectedRoles, setSelectedRoles] = useState<Record<number, string>>({});
    const [isUpdating, setIsUpdating] = useState<Record<number, boolean>>({});
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [passwordDialogUser, setPasswordDialogUser] = useState<User | null>(null);
    const [emailDialogUser, setEmailDialogUser] = useState<User | null>(null);

    const handleRoleChange = (userId: number, roleName: string) => {
        setSelectedRoles(prev => ({
            ...prev,
            [userId]: roleName
        }));
    };

    const updateUserRoles = async (userId: number) => {
        const selectedRoleName = selectedRoles[userId];
        if (!selectedRoleName) return;

        setIsUpdating(prev => ({ ...prev, [userId]: true }));
        setError(null);
        setSuccess(null);

        try {
            // Obtener los IDs de roles según la jerarquía
            const roleNamesToAssign = ROLE_HIERARCHY[selectedRoleName as keyof typeof ROLE_HIERARCHY] || [];
            const roleIds = roles
                .filter(role => roleNamesToAssign.includes(role.name))
                .map(role => role.id);

            await router.patch(`/settings/administration/users/${userId}/role`, {
                roles: roleIds
            }, {
                onSuccess: () => {
                    setSuccess(`Rol actualizado exitosamente. El usuario ahora tiene: ${selectedRoleName}`);
                    setTimeout(() => setSuccess(null), 3000);
                },
                onError: (errors) => {
                    setError(errors.roles || 'Error al actualizar el rol');
                }
            });
        } catch (err) {
            setError('Error al actualizar el rol');
        } finally {
            setIsUpdating(prev => ({ ...prev, [userId]: false }));
        }
    };

    const getCurrentRoles = (user: User) => {
        return user.roles || [];
    };

    const getRoleBadgeColor = (roleName: string) => {
        switch (roleName.toLowerCase()) {
            case 'administrador':
                return 'bg-red-100 text-red-800 hover:bg-red-200';
            case 'supervisor':
                return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
            case 'usuario':
                return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
        }
    };

    const getCurrentPrimaryRole = (user: User) => {
        const userRoles = getCurrentRoles(user);
        const roleNames = userRoles.map(role => role.name);

        // Determinar el rol principal según la jerarquía
        if (roleNames.includes('Administrador')) return 'Administrador';
        if (roleNames.includes('Supervisor')) return 'Supervisor';
        if (roleNames.includes('Usuario')) return 'Usuario';

        return 'Usuario'; // Por defecto
    };

    const hasRoleChanges = (user: User) => {
        const currentPrimaryRole = getCurrentPrimaryRole(user);
        const selectedRole = selectedRoles[user.id];

        return selectedRole && selectedRole !== currentPrimaryRole;
    };

    return (
        <div className="w-full pb-6">
            <div className="mb-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Shield className="h-5 w-5" />
                    Gestión de Roles de Usuarios
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Selecciona el rol principal del usuario. Los roles se asignan automáticamente según la jerarquía.
                </p>
            </div>

            {success && (
                <Alert className="mb-4 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        {success}
                    </AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Usuarios del Sistema
                    </CardTitle>
                    <CardDescription>
                        Selecciona el rol principal. Los roles se asignan automáticamente según la jerarquía.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {users.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay usuarios registrados en el sistema
                            </div>
                        ) : (
                            users.map((user) => {
                                const currentRoles = getCurrentRoles(user);
                                const currentPrimaryRole = getCurrentPrimaryRole(user);
                                const selectedRole = selectedRoles[user.id] || currentPrimaryRole;
                                const hasChanges = hasRoleChanges(user);

                                return (
                                    <div key={user.id} className="border rounded-lg p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div>
                                                        <h4 className="font-medium">{user.name}</h4>
                                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {currentRoles.map((role) => (
                                                        <Badge key={role.id} className={getRoleBadgeColor(role.name)}>
                                                            {role.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    <strong>Rol principal actual:</strong> {currentPrimaryRole}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h5 className="text-sm font-medium text-gray-700">Cambiar rol principal:</h5>
                                            <div className="flex items-center gap-3">
                                                <Select
                                                    value={selectedRole}
                                                    onValueChange={(value) => handleRoleChange(user.id, value)}
                                                >
                                                    <SelectTrigger className="w-48">
                                                        <SelectValue placeholder="Seleccionar rol" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Usuario">
                                                            Usuario (Acceso básico)
                                                        </SelectItem>
                                                        <SelectItem value="Supervisor">
                                                            Supervisor (Usuario + Supervisión)
                                                        </SelectItem>
                                                        <SelectItem value="Administrador">
                                                            Administrador (Todos los permisos)
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                <div className="flex gap-2">
                                                    {hasChanges && (
                                                        <Button
                                                            onClick={() => updateUserRoles(user.id)}
                                                            disabled={isUpdating[user.id]}
                                                            size="sm"
                                                        >
                                                            {isUpdating[user.id] ? 'Guardando...' : 'Guardar Cambios'}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setPasswordDialogUser(user)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Key className="h-4 w-4" />
                                                        Cambiar Contraseña
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEmailDialogUser(user)}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Mail className="h-4 w-4" />
                                                        Cambiar Email
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="text-xs text-muted-foreground mt-2">
                                                <strong>Jerarquía:</strong> Usuario → Supervisor → Administrador
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Diálogo para cambiar contraseña */}
            {passwordDialogUser && (
                <ChangePasswordForm
                    user={passwordDialogUser}
                    isOpen={true}
                    onClose={() => setPasswordDialogUser(null)}
                />
            )}

            {/* Diálogo para cambiar email */}
            {emailDialogUser && (
                <ChangeEmailForm
                    user={emailDialogUser}
                    isOpen={true}
                    onClose={() => setEmailDialogUser(null)}
                />
            )}
        </div>
    );
}
