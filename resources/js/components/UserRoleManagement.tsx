import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Shield, AlertCircle, CheckCircle } from 'lucide-react';

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

export default function UserRoleManagement({ users, roles }: UserRoleManagementProps) {
    const [selectedRoles, setSelectedRoles] = useState<Record<number, number[]>>({});
    const [isUpdating, setIsUpdating] = useState<Record<number, boolean>>({});
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRoleChange = (userId: number, roleId: number, checked: boolean) => {
        setSelectedRoles(prev => {
            const currentRoles = prev[userId] || [];
            
            if (checked) {
                // Agregar rol si no existe
                if (!currentRoles.includes(roleId)) {
                    return {
                        ...prev,
                        [userId]: [...currentRoles, roleId]
                    };
                }
            } else {
                // Remover rol si existe
                return {
                    ...prev,
                    [userId]: currentRoles.filter(id => id !== roleId)
                };
            }
            
            return prev;
        });
    };

    const updateUserRoles = async (userId: number) => {
        const roleIds = selectedRoles[userId];
        if (!roleIds || roleIds.length === 0) return;

        setIsUpdating(prev => ({ ...prev, [userId]: true }));
        setError(null);
        setSuccess(null);

        try {
            await router.patch(`/admin/users/${userId}/role`, {
                roles: roleIds
            }, {
                onSuccess: () => {
                    setSuccess(`Roles actualizados exitosamente para el usuario`);
                    // Limpiar el estado después de un tiempo
                    setTimeout(() => setSuccess(null), 3000);
                },
                onError: (errors) => {
                    setError(errors.roles || 'Error al actualizar los roles');
                }
            });
        } catch (err) {
            setError('Error al actualizar los roles');
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

    const hasRoleChanges = (user: User) => {
        const currentRoleIds = getCurrentRoles(user).map(role => role.id);
        const selectedRoleIds = selectedRoles[user.id] || [];
        
        // Verificar si hay diferencias en cantidad o contenido
        if (currentRoleIds.length !== selectedRoleIds.length) return true;
        
        return currentRoleIds.some(id => !selectedRoleIds.includes(id)) ||
               selectedRoleIds.some(id => !currentRoleIds.includes(id));
    };

    return (
        <div className="w-full pb-6">
            <div className="mb-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Shield className="h-5 w-5" />
                    Gestión de Roles de Usuarios
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Selecciona múltiples roles para cada usuario. Los roles se acumulan y otorgan diferentes permisos.
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
                        Marca los checkboxes para asignar roles. Puedes seleccionar múltiples roles por usuario.
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
                                const selectedRoleIds = selectedRoles[user.id] || currentRoles.map(role => role.id);
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
                                                <div className="flex flex-wrap gap-2">
                                                    {currentRoles.map((role) => (
                                                        <Badge key={role.id} className={getRoleBadgeColor(role.name)}>
                                                            {role.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <h5 className="text-sm font-medium text-gray-700">Asignar roles:</h5>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {roles.map((role) => (
                                                    <div key={role.id} className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`user-${user.id}-role-${role.id}`}
                                                            checked={selectedRoleIds.includes(role.id)}
                                                            onCheckedChange={(checked) => 
                                                                handleRoleChange(user.id, role.id, checked as boolean)
                                                            }
                                                        />
                                                        <label
                                                            htmlFor={`user-${user.id}-role-${role.id}`}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                        >
                                                            {role.name}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {hasChanges && (
                                            <div className="mt-4 flex justify-end">
                                                <Button
                                                    onClick={() => updateUserRoles(user.id)}
                                                    disabled={isUpdating[user.id]}
                                                    size="sm"
                                                >
                                                    {isUpdating[user.id] ? 'Guardando...' : 'Guardar Cambios'}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
