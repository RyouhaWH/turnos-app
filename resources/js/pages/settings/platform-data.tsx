import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
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
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
}

interface PlatformData {
    roles: Rol[];
    // Aquí podemos agregar más tipos de datos según necesites
}

export default function PlatformData() {
    const [data, setData] = useState<PlatformData>({ roles: [] });
    const [loading, setLoading] = useState(true);
    const [editingRole, setEditingRole] = useState<number | null>(null);
    const [newRole, setNewRole] = useState({ name: '', description: '' });
    const [isAddingRole, setIsAddingRole] = useState(false);

    // Cargar datos de la plataforma
    const loadPlatformData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/platform-data');
            const platformData = await response.json();
            setData(platformData);
        } catch (error) {
            console.error('Error al cargar datos de la plataforma:', error);
            toast.error('Error al cargar datos de la plataforma');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPlatformData();
    }, []);

    // Guardar rol
    const saveRole = async (roleId: number, roleData: { name: string; description: string }) => {
        try {
            const response = await fetch(`/api/platform-data/roles/${roleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(roleData)
            });

            if (response.ok) {
                toast.success('Rol actualizado correctamente');
                setEditingRole(null);
                loadPlatformData(); // Recargar datos
            } else {
                throw new Error('Error al actualizar rol');
            }
        } catch (error) {
            console.error('Error al guardar rol:', error);
            toast.error('Error al guardar rol');
        }
    };

    // Eliminar rol
    const deleteRole = async (roleId: number) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este rol?')) {
            return;
        }

        try {
            const response = await fetch(`/api/platform-data/roles/${roleId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                }
            });

            if (response.ok) {
                toast.success('Rol eliminado correctamente');
                loadPlatformData(); // Recargar datos
            } else {
                throw new Error('Error al eliminar rol');
            }
        } catch (error) {
            console.error('Error al eliminar rol:', error);
            toast.error('Error al eliminar rol');
        }
    };

    // Agregar nuevo rol
    const addRole = async () => {
        if (!newRole.name.trim()) {
            toast.error('El nombre del rol es requerido');
            return;
        }

        try {
            const response = await fetch('/api/platform-data/roles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(newRole)
            });

            if (response.ok) {
                toast.success('Rol creado correctamente');
                setNewRole({ name: '', description: '' });
                setIsAddingRole(false);
                loadPlatformData(); // Recargar datos
            } else {
                throw new Error('Error al crear rol');
            }
        } catch (error) {
            console.error('Error al crear rol:', error);
            toast.error('Error al crear rol');
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <Head title="Datos de Plataforma" />
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Cargando datos de la plataforma...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

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
                                                        value={newRole.name}
                                                        onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
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
                                                        setNewRole({ name: '', description: '' });
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
                                                                defaultValue={role.name}
                                                                onChange={(e) => {
                                                                    const updatedRoles = data.roles.map(r => 
                                                                        r.id === role.id ? { ...r, name: e.target.value } : r
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
                                                                            name: roleData.name,
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
                                                        <div>
                                                            <h3 className="font-semibold text-lg">{role.name}</h3>
                                                            {role.description && (
                                                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                                                    {role.description}
                                                                </p>
                                                            )}
                                                            <p className="text-xs text-gray-500 mt-2">
                                                                ID: {role.id} • Creado: {new Date(role.created_at).toLocaleDateString()}
                                                            </p>
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
