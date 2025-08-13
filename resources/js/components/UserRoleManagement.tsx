import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    const [selectedRoles, setSelectedRoles] = useState<Record<number, number>>({});
    const [isUpdating, setIsUpdating] = useState<Record<number, boolean>>({});
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRoleChange = (userId: number, roleId: number) => {
        setSelectedRoles(prev => ({
            ...prev,
            [userId]: roleId
        }));
    };

    const updateUserRole = async (userId: number) => {
        const roleId = selectedRoles[userId];
        if (!roleId) return;

        setIsUpdating(prev => ({ ...prev, [userId]: true }));
        setError(null);
        setSuccess(null);

        try {
            await router.patch(`/admin/users/${userId}/role`, {
                role: roleId
            }, {
                onSuccess: () => {
                    setSuccess(`Rol actualizado exitosamente para el usuario`);
                    // Limpiar el estado después de un tiempo
                    setTimeout(() => setSuccess(null), 3000);
                },
                onError: (errors) => {
                    setError(errors.role || 'Error al actualizar el rol');
                }
            });
        } catch (err) {
            setError('Error al actualizar el rol');
        } finally {
            setIsUpdating(prev => ({ ...prev, [userId]: false }));
        }
    };

    const getCurrentRole = (user: User) => {
        return user.roles.length > 0 ? user.roles[0] : null;
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

    return (
        <div className="w-full pb-6">
            <div className="mb-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Shield className="h-5 w-5" />
                    Gestión de Roles de Usuarios
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Cambia los roles y permisos de los usuarios existentes
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
                        Selecciona un nuevo rol para cada usuario y guarda los cambios
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {users.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay usuarios registrados en el sistema
                            </div>
                        ) : (
                            users.map((user) => {
                                const currentRole = getCurrentRole(user);
                                const isRoleChanged = selectedRoles[user.id] && 
                                    selectedRoles[user.id] !== currentRole?.id;

                                return (
                                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <h4 className="font-medium">{user.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                                {currentRole && (
                                                    <Badge className={getRoleBadgeColor(currentRole.name)}>
                                                        {currentRole.name}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-3">
                                            <Select
                                                value={selectedRoles[user.id]?.toString() || currentRole?.id.toString() || ''}
                                                onValueChange={(value) => handleRoleChange(user.id, parseInt(value))}
                                            >
                                                <SelectTrigger className="w-48">
                                                    <SelectValue placeholder="Seleccionar rol" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role.id} value={role.id.toString()}>
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            
                                            {isRoleChanged && (
                                                <Button
                                                    onClick={() => updateUserRole(user.id)}
                                                    disabled={isUpdating[user.id]}
                                                    size="sm"
                                                >
                                                    {isUpdating[user.id] ? 'Guardando...' : 'Guardar'}
                                                </Button>
                                            )}
                                        </div>
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
