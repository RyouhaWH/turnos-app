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
import { AVAILABLE_COLORS } from '@/lib/role-colors';
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
    is_operational: boolean;
    color?: string;
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
    const [newRole, setNewRole] = useState({ nombre: '', is_operational: true, color: '#3B82F6' });
    const [isAddingRole, setIsAddingRole] = useState(false);

    // Estados para empleados
    const [editingEmployee, setEditingEmployee] = useState<number | null>(null);
    const [searchEmployee, setSearchEmployee] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState<Empleado[]>(data.empleados);

    // Función para obtener el color del rol
    const getRoleColor = (roleName: string) => {
        const role = data.roles.find(r => r.nombre === roleName);
        return role?.color || '#3B82F6'; // Color por defecto azul
    };

    // Función para obtener estilos de badge con mejor contraste en modo oscuro
    const getRoleBadgeStyles = (roleName: string) => {
        const color = getRoleColor(roleName);

        // Detectar si estamos en modo oscuro
        const isDarkMode = document.documentElement.classList.contains('dark');

        if (isDarkMode) {
            // En modo oscuro, usar colores más claros para mejor contraste
            return {
                backgroundColor: color + '30', // Más opaco para mejor contraste
                borderColor: color + '60',     // Borde más visible
                color: '#ffffff'               // Texto blanco para mejor legibilidad
            };
        } else {
            // En modo claro, usar colores originales
            return {
                backgroundColor: color + '20',
                borderColor: color + '40'
            };
        }
    };

    // Función para obtener las clases CSS del badge según el color
    const getRoleBadgeClasses = (roleName: string) => {
        const color = getRoleColor(roleName);

        // Mapeo de colores hex a clases de Tailwind con soporte para modo oscuro
        const colorMap: Record<string, string> = {
            '#3B82F6': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50',
            '#EF4444': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50',
            '#10B981': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700/50',
            '#F59E0B': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700/50',
            '#8B5CF6': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50',
            '#06B6D4': 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700/50',
            '#EC4899': 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700/50',
            '#F97316': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50',
            '#6366F1': 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700/50',
            '#84CC16': 'bg-lime-100 text-lime-800 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-700/50'
        };

        return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-600';
    };

    // Estados para configuración de roles operativos


    // Guardar rol
    const saveRole = (roleId: number, roleData: { nombre: string; is_operational?: boolean; color?: string }) => {
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

        router.post('/platform-data/roles', {
            nombre: newRole.nombre,
            is_operational: newRole.is_operational,
            color: newRole.color
        }, {
            onSuccess: () => {
                // Recargar la página para obtener el nuevo rol con ID correcto
                router.reload();
                setNewRole({ nombre: '', is_operational: true, color: '#3B82F6' });
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

    // Inicializar configuración de roles operativos


    const colorPalette = AVAILABLE_COLORS;

    return (
        <AppLayout>
            <Head title="Datos de Plataforma" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
                <div className="container mx-auto py-6 space-y-6">
                {/* Header con fondo similar al dashboard */}
                <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/80 relative py-6 mb-8">
                    <div className="px-6">
                        <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Datos de Plataforma
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            Gestiona la configuración y datos del sistema
                        </p>
                    </div>
                    <Badge variant="secondary" className="text-sm bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30 text-slate-700 dark:text-slate-300">
                        Solo Administradores
                    </Badge>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="roles" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3 bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                        <TabsTrigger value="roles" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300">
                            <Users className="h-4 w-4" />
                            Roles
                        </TabsTrigger>
                        <TabsTrigger value="employees" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300">
                            <UserCheck className="h-4 w-4" />
                            Empleados
                        </TabsTrigger>
                        <TabsTrigger value="departments" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300">
                            <Building2 className="h-4 w-4" />
                            Departamentos
                        </TabsTrigger>
                    </TabsList>

                    {/* Roles Tab */}
                    <TabsContent value="roles" className="space-y-6">
                        <Card className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            Gestión de Roles
                                        </CardTitle>
                                        <CardDescription>
                                            Crea, edita y configura roles operativos con colores personalizados
                                        </CardDescription>
                                    </div>
                                    <Button
                                        onClick={() => setIsAddingRole(true)}
                                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Nuevo Rol
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                                                {/* Agregar nuevo rol */}
                                {isAddingRole && (
                                    <Card className="mb-6 border-2 border-dashed border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20 bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm">
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="new-role-name" className="text-sm font-medium">Nombre del Rol</Label>
                                                    <Input
                                                        id="new-role-name"
                                                        value={newRole.nombre}
                                                        onChange={(e) => setNewRole(prev => ({ ...prev, nombre: e.target.value }))}
                                                        placeholder="Ej: Alerta Móvil"
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-medium">Color del Rol</Label>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {colorPalette.map((color) => (
                                                            <button
                                                                key={color.hex}
                                                                type="button"
                                                                onClick={() => setNewRole(prev => ({ ...prev, color: color.hex }))}
                                                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                                                    newRole.color === color.hex
                                                                        ? 'border-gray-800 scale-110'
                                                                        : 'border-gray-300 hover:scale-105'
                                                                }`}
                                                                style={{ backgroundColor: color.hex }}
                                                                title={color.name}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2 mt-4">
                                                <input
                                                    type="checkbox"
                                                    id="new-role-operational"
                                                    checked={newRole.is_operational}
                                                    onChange={(e) => setNewRole(prev => ({ ...prev, is_operational: e.target.checked }))}
                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                />
                                                <Label htmlFor="new-role-operational" className="text-sm">
                                                    Rol operativo (desempeña funciones de prevención de delito)
                                                </Label>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <Button onClick={addRole} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                                                    <Save className="h-4 w-4" />
                                                    Crear Rol
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setIsAddingRole(false);
                                                        setNewRole({ nombre: '', is_operational: true, color: '#3B82F6' });
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
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                                    {data.roles.map((role) => (
                                    <Card key={role.id} className="group hover:shadow-lg transition-all duration-300 border-l-4 bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30" style={{ borderLeftColor: role.color || '#3B82F6' }}>
                                            <CardContent className="p-4">
                                                {editingRole === role.id ? (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label htmlFor={`role-name-${role.id}`} className="text-sm font-medium">Nombre</Label>
                                                            <Input
                                                                id={`role-name-${role.id}`}
                                                                defaultValue={role.nombre}
                                                                onChange={(e) => {
                                                                    const updatedRoles = data.roles.map(r =>
                                                                        r.id === role.id ? { ...r, nombre: e.target.value } : r
                                                                    );
                                                                    setData(prev => ({ ...prev, roles: updatedRoles }));
                                                                }}
                                                                className="mt-1"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-sm font-medium">Color</Label>
                                                            <div className="flex flex-wrap gap-2 mt-1">
                                                                                                                        {colorPalette.map((color) => (
                                                            <button
                                                                key={color.hex}
                                                                type="button"
                                                                onClick={() => {
                                                                    const updatedRoles = data.roles.map(r =>
                                                                        r.id === role.id ? { ...r, color: color.hex } : r
                                                                    );
                                                                    setData(prev => ({ ...prev, roles: updatedRoles }));
                                                                }}
                                                                className={`w-6 h-6 rounded-full border-2 transition-all ${
                                                                    role.color === color.hex
                                                                        ? 'border-gray-800 scale-110'
                                                                        : 'border-gray-300 hover:scale-105'
                                                                }`}
                                                                style={{ backgroundColor: color.hex }}
                                                                title={color.name}
                                                            />
                                                        ))}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                id={`role-operational-${role.id}`}
                                                                checked={role.is_operational}
                                                                onChange={(e) => {
                                                                    const updatedRoles = data.roles.map(r =>
                                                                        r.id === role.id ? { ...r, is_operational: e.target.checked } : r
                                                                    );
                                                                    setData(prev => ({ ...prev, roles: updatedRoles }));
                                                                }}
                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                            />
                                                            <Label htmlFor={`role-operational-${role.id}`} className="text-sm">
                                                                Operativo
                                                            </Label>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => {
                                                                    const roleData = data.roles.find(r => r.id === role.id);
                                                                    if (roleData) {
                                                                        saveRole(role.id, {
                                                                            nombre: roleData.nombre,
                                                                            is_operational: roleData.is_operational,
                                                                            color: roleData.color
                                                                        });
                                                                    }
                                                                }}
                                                                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
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
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div
                                                                    className="w-4 h-4 rounded-full shadow-sm"
                                                                    style={{ backgroundColor: role.color || '#3B82F6' }}
                                                                />
                                                                <h3 className="font-semibold text-lg">
                                                                    {role.nombre === "Alerta Móvil" ? "Patrullaje y Proximidad" : role.nombre}
                                                                </h3>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setEditingRole(role.id)}
                                                                    className="flex items-center gap-1 h-8 px-2"
                                                                >
                                                                    <Edit className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => deleteRole(role.id)}
                                                                    className="flex items-center gap-1 h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-xs ${
                                                                    role.is_operational
                                                                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30'
                                                                        : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-600/30'
                                                                }`}
                                                            >
                                                                {role.is_operational ? 'Operativo' : 'No Operativo'}
                                                            </Badge>
                                                            <span className="text-xs text-gray-500">ID: {role.id}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {data.roles.length === 0 && (
                                    <div className="text-center py-12">
                                        <Users className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No hay roles configurados</h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-4">Crea tu primer rol para comenzar</p>
                                        <Button
                                            onClick={() => setIsAddingRole(true)}
                                            className="flex items-center gap-2 mx-auto"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Crear Primer Rol
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Employees Tab */}
                    <TabsContent value="employees" className="space-y-6">
                        <Card className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
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
                                        <Card key={employee.id} className="border bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                                            <CardContent className="pt-6">
                                                {editingEmployee === employee.id ? (
                                                    <div>
                                                        <div className="mb-4">
                                                            <Label htmlFor={`employee-role-${employee.id}`}>Rol/Facción</Label>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                                                                {data.roles.map((role) => {
                                                                    const isSelected = employee.rol_id === role.id;
                                                                    return (
                                                                        <div
                                                                            key={role.id}
                                                                            className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                                                                                isSelected
                                                                                    ? 'ring-2 ring-blue-500 border-blue-500 dark:ring-blue-400 dark:border-blue-400'
                                                                                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                                                                            }`}
                                                                            style={{
                                                                                backgroundColor: isSelected ? role.color + '10' : 'transparent',
                                                                                borderColor: isSelected ? role.color : undefined
                                                                            }}
                                                                            onClick={() => {
                                                                                const updatedEmployees = data.empleados.map(emp =>
                                                                                    emp.id === employee.id ? { ...emp, rol_id: role.id, rol_nombre: role.nombre } : emp
                                                                                );
                                                                                setData(prev => ({ ...prev, empleados: updatedEmployees }));
                                                                            }}
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <div
                                                                                    className="w-4 h-4 rounded-full"
                                                                                    style={{ backgroundColor: role.color || '#3B82F6' }}
                                                                                ></div>
                                                                                <span className={`text-sm font-medium ${
                                                                                    isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                                                                                }`}>
                                                                                    {role.nombre === "Alerta Móvil" ? "Patrullaje y Proximidad" : role.nombre}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
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
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`text-xs border ${getRoleBadgeClasses(employee.rol_nombre)}`}
                                                                    style={getRoleBadgeStyles(employee.rol_nombre)}
                                                                >
                                                                    {employee.rol_nombre === "Alerta Móvil" ? "Patrullaje y Proximidad" : employee.rol_nombre}
                                                                </Badge>
                                                                <span className="text-xs text-gray-400 dark:text-gray-500">ID: {employee.id}</span>
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
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
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
                        <Card className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                            <CardHeader>
                                <CardTitle>Departamentos</CardTitle>
                                <CardDescription>
                                    Gestiona los departamentos de la organización
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Funcionalidad de departamentos en desarrollo</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>


                </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}
