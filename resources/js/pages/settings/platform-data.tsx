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
    X,
    UserCheck,
    Search
} from 'lucide-react';

interface Rol {
    id: number;
    nombre: string;
    created_at: string;
    updated_at: string;
}

interface Empleado {
    id: number;
    name: string;
    rut: string;
    phone: string;
    rol_id: number;
    rol_nombre: string;
    created_at: string;
    updated_at: string;
}

interface PlatformData {
    roles: Rol[];
    empleados: Empleado[];
    // Aquí podemos agregar más tipos de datos según necesites
}

export default function PlatformData({ roles, empleados }: { roles: Rol[], empleados?: Empleado[] }) {
    const [data, setData] = useState<PlatformData>({
        roles: roles || [],
        empleados: empleados || []
    });
    const [editingRole, setEditingRole] = useState<number | null>(null);
    const [newRole, setNewRole] = useState({ nombre: '' });
    const [isAddingRole, setIsAddingRole] = useState(false);

    // Estados para empleados
    const [editingEmployee, setEditingEmployee] = useState<number | null>(null);
    const [searchEmployee, setSearchEmployee] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState<Empleado[]>(data.empleados);

    // Guardar rol
    const saveRole = (roleId: number, roleData: { nombre: string }) => {
        router.put(`/platform-data/roles/${roleId}`, roleData, {
            onSuccess: () => {
                // Actualizar el estado local inmediatamente
                const updatedRoles = data.roles.map(role => {
                    if (role.id === roleId) {
                        return { ...role, nombre: roleData.nombre };
                    }
                    return role;
                });

                // También actualizar empleados que usen este rol
                const updatedEmployees = data.empleados.map(emp => {
                    if (emp.rol_id === roleId) {
                        return { ...emp, rol_nombre: roleData.nombre };
                    }
                    return emp;
                });

                setData(prev => ({
                    ...prev,
                    roles: updatedRoles,
                    empleados: updatedEmployees
                }));
                setEditingRole(null);
                toast.success('Rol actualizado correctamente');
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
                // Recargar la página para obtener el nuevo rol con ID correcto
                router.reload();
                setNewRole({ nombre: '' });
                setIsAddingRole(false);
                toast.success('Rol creado correctamente');
            },
            onError: (errors) => {
                toast.error('Error al crear rol');
                console.error('Errores:', errors);
            }
        });
    };

    // Guardar empleado
    const saveEmployee = (employeeId: number, employeeData: { rol_id: number }) => {
        router.put(`/platform-data/employees/${employeeId}`, employeeData, {
            onSuccess: () => {
                // Actualizar el estado local inmediatamente
                const updatedEmployees = data.empleados.map(emp => {
                    if (emp.id === employeeId) {
                        const newRol = data.roles.find(role => role.id === employeeData.rol_id);
                        return {
                            ...emp,
                            rol_id: employeeData.rol_id,
                            rol_nombre: newRol?.nombre || 'Sin rol'
                        };
                    }
                    return emp;
                });

                setData(prev => ({ ...prev, empleados: updatedEmployees }));
                setEditingEmployee(null);
                toast.success('Empleado actualizado correctamente');
            },
            onError: (errors) => {
                toast.error('Error al actualizar empleado');
                console.error('Errores:', errors);
            }
        });
    };

    // Filtrar empleados
    useEffect(() => {
        const filtered = data.empleados.filter(employee =>
            employee.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
            (employee.rut && employee.rut.includes(searchEmployee))
        );
        setFilteredEmployees(filtered);
    }, [searchEmployee, data.empleados]);

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
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="roles" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Roles
                        </TabsTrigger>
                        <TabsTrigger value="employees" className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4" />
                            Empleados
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
                                                                                         <div>
                                                 <Label htmlFor="new-role-name">Nombre del Rol</Label>
                                                 <Input
                                                     id="new-role-name"
                                                     value={newRole.nombre}
                                                     onChange={(e) => setNewRole(prev => ({ ...prev, nombre: e.target.value }))}
                                                     placeholder="Ej: Alerta Móvil"
                                                 />
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
                                                         setNewRole({ nombre: '' });
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
                                                     <div>
                                                         <div className="mb-4">
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
                                                         <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => {
                                                                    const roleData = data.roles.find(r => r.id === role.id);
                                                                                                                                         if (roleData) {
                                                                         saveRole(role.id, {
                                                                             nombre: roleData.nombre
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

                    {/* Employees Tab */}
                    <TabsContent value="employees" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Gestión de Empleados</CardTitle>
                                        <CardDescription>
                                            Cambia el rol/facción de los funcionarios
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Buscador */}
                                <div className="mb-6">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Buscar por nombre (RUT opcional)..."
                                            value={searchEmployee}
                                            onChange={(e) => setSearchEmployee(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Lista de empleados */}
                                <div className="space-y-4">
                                    {filteredEmployees.map((employee) => (
                                        <Card key={employee.id} className="border">
                                            <CardContent className="pt-6">
                                                {editingEmployee === employee.id ? (
                                                    <div>
                                                        <div className="mb-4">
                                                            <Label htmlFor={`employee-role-${employee.id}`}>Rol/Facción</Label>
                                                            <select
                                                                id={`employee-role-${employee.id}`}
                                                                className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                                                defaultValue={employee.rol_id}
                                                                onChange={(e) => {
                                                                    const updatedEmployees = data.empleados.map(emp =>
                                                                        emp.id === employee.id ? { ...emp, rol_id: parseInt(e.target.value) } : emp
                                                                    );
                                                                    setData(prev => ({ ...prev, empleados: updatedEmployees }));
                                                                }}
                                                            >
                                                                {data.roles.map((role) => (
                                                                    <option key={role.id} value={role.id}>
                                                                        {role.nombre === "Alerta Móvil" ? "Patrullaje y Proximidad" : role.nombre}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => {
                                                                    const employeeData = data.empleados.find(emp => emp.id === employee.id);
                                                                    if (employeeData) {
                                                                        saveEmployee(employee.id, {
                                                                            rol_id: employeeData.rol_id
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
                                                                onClick={() => setEditingEmployee(null)}
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
                                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{employee.name}</h3>
                                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                                <span>RUT: {employee.rut || 'Sin RUT'}</span>
                                                                <span>•</span>
                                                                <span>Tel: {employee.phone || 'Sin teléfono'}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {employee.rol_nombre === "Alerta Móvil" ? "Patrullaje y Proximidad" : employee.rol_nombre}
                                                                </Badge>
                                                                <span className="text-xs text-gray-400">ID: {employee.id}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setEditingEmployee(employee.id)}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                                Cambiar Rol
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}

                                    {filteredEmployees.length === 0 && (
                                        <div className="text-center py-8 text-gray-500">
                                            <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                            <p>No se encontraron empleados</p>
                                        </div>
                                    )}
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
