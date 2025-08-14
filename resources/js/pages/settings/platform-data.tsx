import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
    Settings, 
    Users, 
    Building2, 
    Calendar,
    Plus,
    Edit,
    Trash2,
    Save,
    X
} from 'lucide-react';

interface Rol {
    id: number;
    nombre: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

interface PlatformData {
    roles: Rol[];
    // Aquí podemos agregar más tipos de datos según necesites
}

export default function PlatformData({ roles }: { roles: Rol[] }) {
    const [data, setData] = useState<PlatformData>({ roles: roles || [] });
    const [editingRole, setEditingRole] = useState<number | null>(null);
    const [newRole, setNewRole] = useState({ nombre: '', description: '' });
    const [isAddingRole, setIsAddingRole] = useState(false);

    // Guardar rol
    const saveRole = (roleId: number, roleData: { nombre: string; description: string }) => {
        router.put(`/platform-data/roles/${roleId}`, roleData, {
            onSuccess: () => {
                toast.success('Rol actualizado correctamente');
                setEditingRole(null);
                // Recargar la página para obtener los datos actualizados
                router.reload();
            },
            onError: (errors) => {
                toast.error('Error al actualizar rol');
                console.error('Errores:', errors);
            }
        });
    };

    // Eliminar rol
    const deleteRole = (roleId: number) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este rol?')) {
            return;
        }

        router.delete(`/platform-data/roles/${roleId}`, {
            onSuccess: () => {
                toast.success('Rol eliminado correctamente');
                // Recargar la página para obtener los datos actualizados
                router.reload();
            },
            onError: (errors) => {
                toast.error('Error al eliminar rol');
                console.error('Errores:', errors);
            }
        });
    };

    // Agregar nuevo rol
    const addRole = () => {
        if (!newRole.nombre.trim()) {
            toast.error('El nombre del rol es requerido');
            return;
        }

        router.post('/platform-data/roles', newRole, {
            onSuccess: () => {
                toast.success('Rol creado correctamente');
                setNewRole({ nombre: '', description: '' });
                setIsAddingRole(false);
                // Recargar la página para obtener los datos actualizados
                router.reload();
            },
            onError: (errors) => {
                toast.error('Error al crear rol');
                console.error('Errores:', errors);
            }
        });
    };

    return (
        <AppLayout>
            <Head title="Datos de Plataforma" />
            
            <div className="container mx-auto py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Datos de Plataforma
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Gestiona la configuración y datos del sistema
                        </p>
                    </div>
                    <Badge variant="secondary" className="text-sm">
                        Solo Administradores
                    </Badge>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="roles" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="roles" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Roles
                        </TabsTrigger>
                        <TabsTrigger value="departments" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Departamentos
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Configuración
                        </TabsTrigger>
                    </TabsList>

                    {/* Roles Tab */}
                    <TabsContent value="roles" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Roles de Turnos</CardTitle>
                                        <CardDescription>
                                            Gestiona los roles disponibles para asignar turnos
                                        </CardDescription>
                                    </div>
                                    <Button 
                                        onClick={() => setIsAddingRole(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Nuevo Rol
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Agregar nuevo rol */}
                                {isAddingRole && (
                                    <Card className="mb-6 border-dashed">
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="new-role-name">Nombre del Rol</Label>
                                                    <Input
                                                        id="new-role-name"
                                                                                                                 value={newRole.nombre}
                                                         onChange={(e) => setNewRole(prev => ({ ...prev, nombre: e.target.value }))}
                                                        placeholder="Ej: Alerta Móvil"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="new-role-description">Descripción</Label>
                                                    <Input
                                                        id="new-role-description"
                                                        value={newRole.description}
                                                        onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                                                        placeholder="Descripción opcional"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <Button onClick={addRole} className="flex items-center gap-2">
                                                    <Save className="h-4 w-4" />
                                                    Guardar
                                                </Button>
                                                <Button 
                                                    variant="outline" 
                                                                                                         onClick={() => {
                                                         setIsAddingRole(false);
                                                         setNewRole({ nombre: '', description: '' });
                                                     }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <X className="h-4 w-4" />
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Lista de roles */}
                                <div className="space-y-4">
                                    {data.roles.map((role) => (
                                        <Card key={role.id} className="border">
                                            <CardContent className="pt-6">
                                                {editingRole === role.id ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor={`role-name-${role.id}`}>Nombre</Label>
                                                                                                                         <Input
                                                                 id={`role-name-${role.id}`}
                                                                 defaultValue={role.nombre}
                                                                 onChange={(e) => {
                                                                     const updatedRoles = data.roles.map(r => 
                                                                         r.id === role.id ? { ...r, nombre: e.target.value } : r
                                                                     );
                                                                     setData(prev => ({ ...prev, roles: updatedRoles }));
                                                                 }}
                                                             />
                                                        </div>
                                                        <div>
                                                            <Label htmlFor={`role-description-${role.id}`}>Descripción</Label>
                                                            <Input
                                                                id={`role-description-${role.id}`}
                                                                defaultValue={role.description || ''}
                                                                onChange={(e) => {
                                                                    const updatedRoles = data.roles.map(r => 
                                                                        r.id === role.id ? { ...r, description: e.target.value } : r
                                                                    );
                                                                    setData(prev => ({ ...prev, roles: updatedRoles }));
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2 md:col-span-2">
                                                            <Button 
                                                                onClick={() => {
                                                                    const roleData = data.roles.find(r => r.id === role.id);
                                                                                                                                         if (roleData) {
                                                                         saveRole(role.id, {
                                                                             nombre: roleData.nombre,
                                                                             description: roleData.description || ''
                                                                         });
                                                                     }
                                                                }}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Save className="h-4 w-4" />
                                                                Guardar
                                                            </Button>
                                                            <Button 
                                                                variant="outline" 
                                                                onClick={() => setEditingRole(null)}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <X className="h-4 w-4" />
                                                                Cancelar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                                                                                         <h3 className="font-bold text-2xl text-gray-900 dark:text-white mb-2">{role.nombre}</h3>
                                                            {role.description && (
                                                                <p className="text-gray-600 dark:text-gray-400 text-base mb-3">
                                                                    {role.description}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                                <span>ID: {role.id}</span>
                                                                <span>•</span>
                                                                <span>Creado: {new Date(role.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setEditingRole(role.id)}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                                Editar
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => deleteRole(role.id)}
                                                                className="flex items-center gap-2 text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Eliminar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Departments Tab */}
                    <TabsContent value="departments" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Departamentos</CardTitle>
                                <CardDescription>
                                    Gestiona los departamentos de la organización
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-gray-500">
                                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Funcionalidad de departamentos en desarrollo</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuración General</CardTitle>
                                <CardDescription>
                                    Configuración general de la plataforma
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-gray-500">
                                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Configuración general en desarrollo</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
