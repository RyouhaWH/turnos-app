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
    Search,
    ChevronDown,
    ChevronUp,
    Link,
    Unlink,
    RefreshCw,
    AlertCircle,
    CheckCircle
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
    first_name?: string;
    paternal_lastname?: string;
    maternal_lastname?: string;
    rut: string;
    phone: string;
    email?: string;
    address?: string;
    position?: string;
    department?: string;
    start_date?: string;
    status?: string;
    rol_id: number;
    rol_nombre: string;
    created_at: string;
    updated_at: string;
}

interface UnlinkedEmployee {
    id: number;
    name: string;
    first_name?: string;
    paternal_lastname?: string;
    maternal_lastname?: string;
    rut?: string;
    phone?: string;
    email?: string;
    rol_nombre: string;
    amzoma: boolean;
}

interface AvailableUser {
    id: number;
    name: string;
    email: string;
    roles: Array<{ name: string }>;
}

interface LinkingData {
    unlinked_employees: UnlinkedEmployee[];
    available_users: AvailableUser[];
}

interface EmployeeWithMissingData {
    id: number;
    name: string;
    first_name?: string;
    paternal_lastname?: string;
    maternal_lastname?: string;
    rut?: string;
    phone?: string;
    email?: string;
    rol_nombre: string;
    amzoma: boolean;
    missing_fields: string[];
}

interface MissingDataCategories {
    missing_email: EmployeeWithMissingData[];
    missing_rut: EmployeeWithMissingData[];
    missing_phone: EmployeeWithMissingData[];
    missing_multiple: EmployeeWithMissingData[];
    complete_data: EmployeeWithMissingData[];
}

interface MissingDataStats {
    total_employees: number;
    complete_data: number;
    missing_email: number;
    missing_rut: number;
    missing_phone: number;
    missing_multiple: number;
    completion_percentage: number;
}

interface MissingDataResponse {
    categories: MissingDataCategories;
    stats: MissingDataStats;
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
    const [editingEmployeeData, setEditingEmployeeData] = useState<Partial<Empleado>>({});
    const [searchEmployee, setSearchEmployee] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState<Empleado[]>(data.empleados);
    const [loadingEmployee, setLoadingEmployee] = useState(false);
    const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null);

    // Estados para vinculación
    const [linkingData, setLinkingData] = useState<LinkingData>({ unlinked_employees: [], available_users: [] });
    const [loadingLinking, setLoadingLinking] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
    const [selectedUser, setSelectedUser] = useState<number | null>(null);
    const [searchUnlinked, setSearchUnlinked] = useState('');
    const [searchUsers, setSearchUsers] = useState('');

    // Estados para datos faltantes
    const [missingDataResponse, setMissingDataResponse] = useState<MissingDataResponse | null>(null);
    const [loadingMissingData, setLoadingMissingData] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<keyof MissingDataCategories | 'all'>('all');
    const [searchMissingData, setSearchMissingData] = useState('');

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
    const saveEmployee = (employeeId: number, employeeData: Partial<Empleado>) => {
        router.put(`/platform-data/employees/${employeeId}`, employeeData, {
            onSuccess: () => {
                // Actualizar el estado local inmediatamente
                const updatedEmployees = data.empleados.map(emp => {
                    if (emp.id === employeeId) {
                        const newRol = data.roles.find(role => role.id === employeeData.rol_id);
                        return {
                            ...emp,
                            ...employeeData,
                            rol_nombre: newRol?.nombre || emp.rol_nombre
                        };
                    }
                    return emp;
                });

                setData(prev => ({ ...prev, empleados: updatedEmployees }));
                setEditingEmployee(null);
                setExpandedEmployee(null);
                toast.success('Empleado actualizado correctamente');
            },
            onError: (errors) => {
                toast.error('Error al actualizar empleado');
                console.error('Errores:', errors);
            }
        });
    };

    // Función para iniciar edición de empleado
    const startEditingEmployee = async (employee: Empleado) => {
        // Si ya está expandido, cerrar
        if (expandedEmployee === employee.id) {
            setExpandedEmployee(null);
            setEditingEmployee(null);
            setEditingEmployeeData({});
            setLoadingEmployee(false);
            return;
        }

        // Expandir el empleado seleccionado
        setExpandedEmployee(employee.id);
        setEditingEmployee(employee.id);
        setLoadingEmployee(true);

        try {
            // Obtener datos completos del empleado desde el backend
            const response = await fetch(`/platform-data/employees/${employee.id}`);
            const result = await response.json();

            if (result.success && result.data) {
                const employeeData = result.data;
                setEditingEmployeeData({
                    name: employeeData.name,
                    first_name: employeeData.first_name,
                    paternal_lastname: employeeData.paternal_lastname,
                    maternal_lastname: employeeData.maternal_lastname,
                    rut: employeeData.rut,
                    phone: employeeData.phone,
                    email: employeeData.email,
                    address: employeeData.address,
                    position: employeeData.position,
                    department: employeeData.department,
                    start_date: employeeData.start_date,
                    status: employeeData.status,
                    rol_id: employeeData.rol_id
                });
            } else {
                // Fallback a los datos locales si falla la petición
                setEditingEmployeeData({
                    name: employee.name,
                    first_name: employee.first_name,
                    paternal_lastname: employee.paternal_lastname,
                    maternal_lastname: employee.maternal_lastname,
                    rut: employee.rut,
                    phone: employee.phone,
                    email: employee.email,
                    address: employee.address,
                    position: employee.position,
                    department: employee.department,
                    start_date: employee.start_date,
                    status: employee.status,
                    rol_id: employee.rol_id
                });
            }
        } catch (error) {
            console.error('Error al obtener datos del empleado:', error);
            // Fallback a los datos locales en caso de error
            setEditingEmployeeData({
                name: employee.name,
                first_name: employee.first_name,
                paternal_lastname: employee.paternal_lastname,
                maternal_lastname: employee.maternal_lastname,
                rut: employee.rut,
                phone: employee.phone,
                email: employee.email,
                address: employee.address,
                position: employee.position,
                department: employee.department,
                start_date: employee.start_date,
                status: employee.status,
                rol_id: employee.rol_id
            });
        } finally {
            setLoadingEmployee(false);
        }
    };

    // Función para cancelar edición
    const cancelEditingEmployee = () => {
        setEditingEmployee(null);
        setEditingEmployeeData({});
        setLoadingEmployee(false);
        setExpandedEmployee(null);
    };

    // Función para construir nombre completo automáticamente
    const buildFullName = (firstName: string, paternalLastname: string, maternalLastname: string) => {
        const parts = [firstName, paternalLastname, maternalLastname].filter(part => part && part.trim());
        return parts.join(' ').trim();
    };

    // Función para actualizar nombre completo cuando cambian los campos separados
    const updateFullName = () => {
        const { first_name, paternal_lastname, maternal_lastname } = editingEmployeeData;
        if (first_name && paternal_lastname) {
            const fullName = buildFullName(first_name, paternal_lastname, maternal_lastname || '');
            setEditingEmployeeData(prev => ({ ...prev, name: fullName }));
        }
    };

    // Filtrar empleados
    useEffect(() => {
        const filtered = data.empleados.filter(employee =>
            employee.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
            (employee.rut && employee.rut.includes(searchEmployee))
        );
        setFilteredEmployees(filtered);
    }, [searchEmployee, data.empleados]);

    // Actualizar nombre completo automáticamente
    useEffect(() => {
        if (editingEmployee && editingEmployeeData.first_name && editingEmployeeData.paternal_lastname) {
            updateFullName();
        }
    }, [editingEmployeeData.first_name, editingEmployeeData.paternal_lastname, editingEmployeeData.maternal_lastname]);

    // Funciones para vinculación
    const loadLinkingData = async () => {
        setLoadingLinking(true);
        try {
            const response = await fetch('/platform-data/employees/unlinked');
            const result = await response.json();
            if (result.success) {
                setLinkingData(result.data);
            }
        } catch (error) {
            console.error('Error loading linking data:', error);
            toast.error('Error al cargar datos de vinculación');
        } finally {
            setLoadingLinking(false);
        }
    };

    const linkEmployeeToUser = async () => {
        if (!selectedEmployee || !selectedUser) {
            toast.error('Selecciona un funcionario y un usuario');
            return;
        }

        try {
            const response = await fetch(`/platform-data/employees/${selectedEmployee}/link-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ user_id: selectedUser }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                setSelectedEmployee(null);
                setSelectedUser(null);
                loadLinkingData(); // Recargar datos
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Error linking employee to user:', error);
            toast.error('Error al vincular funcionario con usuario');
        }
    };

    const unlinkEmployee = async (employeeId: number) => {
        if (!confirm('¿Estás seguro de que quieres desvincular este funcionario?')) {
            return;
        }

        try {
            const response = await fetch(`/platform-data/employees/${employeeId}/unlink-user`, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                loadLinkingData(); // Recargar datos
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            console.error('Error unlinking employee:', error);
            toast.error('Error al desvincular funcionario');
        }
    };

    // Funciones para datos faltantes
    const loadMissingData = async () => {
        setLoadingMissingData(true);
        try {
            console.log('Fetching missing data from: /platform-data/employees/missing-data');

            // Usar axios que maneja automáticamente CSRF y cookies en Laravel
            const response = await window.axios.get('/platform-data/employees/missing-data');

            console.log('Response status:', response.status);
            console.log('Response data:', response.data);

            if (response.data.success) {
                setMissingDataResponse(response.data.data);
                toast.success('Datos cargados correctamente');
            } else {
                throw new Error(response.data.message || 'Error en la respuesta del servidor');
            }
        } catch (error) {
            console.error('Error loading missing data:', error);

            if (error.response) {
                // Error de respuesta del servidor
                const status = error.response.status;
                if (status === 403) {
                    toast.error('No tienes permisos para acceder a esta funcionalidad. Necesitas ser administrador.');
                } else if (status === 401) {
                    toast.error('No estás autenticado. Por favor, inicia sesión.');
                } else if (status === 404) {
                    toast.error('Endpoint no encontrado. Verifica la configuración de rutas.');
                } else {
                    toast.error(`Error del servidor (${status}): ${error.response.data.message || 'Error desconocido'}`);
                }
            } else if (error.request) {
                // Error de red
                toast.error('Error de conexión. Verifica tu conexión a internet.');
            } else {
                // Error de configuración
                toast.error(`Error al cargar datos faltantes: ${error.message}`);
            }
        } finally {
            setLoadingMissingData(false);
        }
    };

    const getMissingFieldIcon = (field: string) => {
        switch (field) {
            case 'email': return '📧';
            case 'rut': return '🆔';
            case 'phone': return '📱';
            default: return '❓';
        }
    };

    const getMissingFieldLabel = (field: string) => {
        switch (field) {
            case 'email': return 'Email';
            case 'rut': return 'RUT';
            case 'phone': return 'Teléfono';
            default: return field;
        }
    };

    const getCategoryEmployees = (): EmployeeWithMissingData[] => {
        if (!missingDataResponse) return [];

        if (selectedCategory === 'all') {
            return [
                ...missingDataResponse.categories.missing_email,
                ...missingDataResponse.categories.missing_rut,
                ...missingDataResponse.categories.missing_phone,
                ...missingDataResponse.categories.missing_multiple,
            ];
        }

        return missingDataResponse.categories[selectedCategory];
    };

    // Filtros para vinculación
    const filteredUnlinkedEmployees = linkingData.unlinked_employees.filter(emp =>
        emp.name.toLowerCase().includes(searchUnlinked.toLowerCase()) ||
        (emp.rut && emp.rut.includes(searchUnlinked))
    );

    const filteredAvailableUsers = linkingData.available_users.filter(user =>
        user.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
        user.email.toLowerCase().includes(searchUsers.toLowerCase())
    );

    // Filtros para datos faltantes
    const filteredMissingDataEmployees = getCategoryEmployees().filter(emp =>
        emp.name.toLowerCase().includes(searchMissingData.toLowerCase()) ||
        (emp.rut && emp.rut.includes(searchMissingData))
    );

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
                    <TabsList className="grid w-full grid-cols-5 bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                        <TabsTrigger value="roles" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300">
                            <Users className="h-4 w-4" />
                            Roles
                        </TabsTrigger>
                        <TabsTrigger value="employees" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300">
                            <UserCheck className="h-4 w-4" />
                            Empleados
                        </TabsTrigger>
                        <TabsTrigger value="missing-data" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300" onClick={loadMissingData}>
                            <AlertCircle className="h-4 w-4" />
                            Datos Faltantes
                        </TabsTrigger>
                        <TabsTrigger value="user-linking" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300" onClick={loadLinkingData}>
                            <Link className="h-4 w-4" />
                            Vinculación
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
                                    <Card className="mb-6 border-2 border-dashed border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20 backdrop-blur-sm">
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
                                                {/* Header del empleado - siempre visible y clickeable */}
                                                <div
                                                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 -m-2 rounded-lg transition-colors"
                                                    onClick={() => startEditingEmployee(employee)}
                                                >
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                                                            {employee.first_name && employee.paternal_lastname
                                                                ? `${employee.first_name} ${employee.paternal_lastname} ${employee.maternal_lastname || ''}`.trim()
                                                                : employee.name
                                                            }
                                                        </h3>
                                                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                            <span>RUT: {employee.rut || 'Sin RUT'}</span>
                                                            <span>•</span>
                                                            <span>Tel: {employee.phone || 'Sin teléfono'}</span>
                                                            {employee.email && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>Email: {employee.email}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={`text-xs border ${getRoleBadgeClasses(employee.rol_nombre)}`}
                                                                style={getRoleBadgeStyles(employee.rol_nombre)}
                                                            >
                                                                {employee.rol_nombre === "Alerta Móvil" ? "Patrullaje y Proximidad" : employee.rol_nombre}
                                                            </Badge>
                                                            {employee.position && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {employee.position}
                                                                </Badge>
                                                            )}
                                                            {employee.status && employee.status !== 'activo' && (
                                                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                                                                    {employee.status}
                                                                </Badge>
                                                            )}
                                                            <span className="text-xs text-gray-400 dark:text-gray-500">ID: {employee.id}</span>
                                                        </div>
                                                        {(employee.department || employee.start_date) && (
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                {employee.department && <span>Depto: {employee.department}</span>}
                                                                {employee.department && employee.start_date && <span> • </span>}
                                                                {employee.start_date && <span>Inicio: {new Date(employee.start_date).toLocaleDateString('es-CL')}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-4">
                                                        {loadingEmployee && editingEmployee === employee.id ? (
                                                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
                                                        ) : (
                                                            <div className="text-gray-400 dark:text-gray-500">
                                                                {expandedEmployee === employee.id ? (
                                                                    <ChevronUp className="h-5 w-5" />
                                                                ) : (
                                                                    <ChevronDown className="h-5 w-5" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Contenido expandible */}
                                                {expandedEmployee === employee.id && (
                                                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                                                        {editingEmployee === employee.id ? (
                                                    <div className="space-y-6">
                                                        {/* Información Personal */}
                                                        <div>
                                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información Personal</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <Label htmlFor={`employee-name-${employee.id}`}>Nombre Completo (se actualiza automáticamente)</Label>
                                                                    <Input
                                                                        id={`employee-name-${employee.id}`}
                                                                        value={editingEmployeeData.name || ''}
                                                                        onChange={(e) => setEditingEmployeeData(prev => ({ ...prev, name: e.target.value }))}
                                                                        placeholder="Se llena automáticamente"
                                                                        className="mt-1 bg-gray-50 dark:bg-gray-700"
                                                                        readOnly
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`employee-first-name-${employee.id}`}>Nombre</Label>
                                                                    <Input
                                                                        id={`employee-first-name-${employee.id}`}
                                                                        value={editingEmployeeData.first_name || ''}
                                                                        onChange={(e) => setEditingEmployeeData(prev => ({ ...prev, first_name: e.target.value }))}
                                                                        placeholder="Nombre"
                                                                        className="mt-1"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`employee-paternal-lastname-${employee.id}`}>Apellido Paterno</Label>
                                                                    <Input
                                                                        id={`employee-paternal-lastname-${employee.id}`}
                                                                        value={editingEmployeeData.paternal_lastname || ''}
                                                                        onChange={(e) => setEditingEmployeeData(prev => ({ ...prev, paternal_lastname: e.target.value }))}
                                                                        placeholder="Apellido paterno"
                                                                        className="mt-1"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`employee-maternal-lastname-${employee.id}`}>Apellido Materno</Label>
                                                                    <Input
                                                                        id={`employee-maternal-lastname-${employee.id}`}
                                                                        value={editingEmployeeData.maternal_lastname || ''}
                                                                        onChange={(e) => setEditingEmployeeData(prev => ({ ...prev, maternal_lastname: e.target.value }))}
                                                                        placeholder="Apellido materno"
                                                                        className="mt-1"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`employee-rut-${employee.id}`}>RUT</Label>
                                                                    <Input
                                                                        id={`employee-rut-${employee.id}`}
                                                                        value={editingEmployeeData.rut || ''}
                                                                        onChange={(e) => setEditingEmployeeData(prev => ({ ...prev, rut: e.target.value }))}
                                                                        placeholder="12.345.678-9"
                                                                        className="mt-1"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`employee-phone-${employee.id}`}>Teléfono</Label>
                                                                    <Input
                                                                        id={`employee-phone-${employee.id}`}
                                                                        value={editingEmployeeData.phone || ''}
                                                                        onChange={(e) => setEditingEmployeeData(prev => ({ ...prev, phone: e.target.value }))}
                                                                        placeholder="+56 9 1234 5678"
                                                                        className="mt-1"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`employee-email-${employee.id}`}>Email</Label>
                                                                    <Input
                                                                        id={`employee-email-${employee.id}`}
                                                                        type="email"
                                                                        value={editingEmployeeData.email || ''}
                                                                        onChange={(e) => setEditingEmployeeData(prev => ({ ...prev, email: e.target.value }))}
                                                                        placeholder="empleado@empresa.com"
                                                                        className="mt-1"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Información Laboral */}
                                                        <div>
                                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información Laboral</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div>
                                                                    <Label htmlFor={`employee-position-${employee.id}`}>Cargo</Label>
                                                                    <Input
                                                                        id={`employee-position-${employee.id}`}
                                                                        value={editingEmployeeData.position || ''}
                                                                        onChange={(e) => setEditingEmployeeData(prev => ({ ...prev, position: e.target.value }))}
                                                                        placeholder="Ej: Patrullero, Supervisor"
                                                                        className="mt-1"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`employee-department-${employee.id}`}>Departamento</Label>
                                                                    <Input
                                                                        id={`employee-department-${employee.id}`}
                                                                        value={editingEmployeeData.department || ''}
                                                                        onChange={(e) => setEditingEmployeeData(prev => ({ ...prev, department: e.target.value }))}
                                                                        placeholder="Ej: Operaciones"
                                                                        className="mt-1"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`employee-start-date-${employee.id}`}>Fecha de Inicio</Label>
                                                                    <Input
                                                                        id={`employee-start-date-${employee.id}`}
                                                                        type="date"
                                                                        value={editingEmployeeData.start_date || ''}
                                                                        onChange={(e) => setEditingEmployeeData(prev => ({ ...prev, start_date: e.target.value }))}
                                                                        className="mt-1"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label htmlFor={`employee-status-${employee.id}`}>Estado</Label>
                                                                    <select
                                                                        id={`employee-status-${employee.id}`}
                                                                        value={editingEmployeeData.status || 'activo'}
                                                                        onChange={(e) => setEditingEmployeeData(prev => ({ ...prev, status: e.target.value }))}
                                                                        className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white mt-1"
                                                                    >
                                                                        <option value="activo">Activo</option>
                                                                        <option value="inactivo">Inactivo</option>
                                                                        <option value="vacaciones">Vacaciones</option>
                                                                        <option value="licencia">Licencia</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Dirección */}
                                                        <div>
                                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dirección</h4>
                                                            <div>
                                                                <Label htmlFor={`employee-address-${employee.id}`}>Dirección</Label>
                                                                <Input
                                                                    id={`employee-address-${employee.id}`}
                                                                    value={editingEmployeeData.address || ''}
                                                                    onChange={(e) => setEditingEmployeeData(prev => ({ ...prev, address: e.target.value }))}
                                                                    placeholder="Dirección completa"
                                                                    className="mt-1"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Rol/Facción */}
                                                        <div>
                                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rol/Facción</h4>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                {data.roles.map((role) => {
                                                                    const isSelected = editingEmployeeData.rol_id === role.id;
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
                                                                            onClick={() => setEditingEmployeeData(prev => ({ ...prev, rol_id: role.id }))}
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

                                                        {/* Botones de acción */}
                                                        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
                                                            <Button
                                                                onClick={() => saveEmployee(employee.id, editingEmployeeData)}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <Save className="h-4 w-4" />
                                                                Guardar Cambios
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                onClick={cancelEditingEmployee}
                                                                className="flex items-center gap-2"
                                                            >
                                                                <X className="h-4 w-4" />
                                                                Cancelar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-500 dark:text-gray-400">
                                                        Haz clic para editar este empleado
                                                    </div>
                                                )}
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

                    {/* Missing Data Tab */}
                    <TabsContent value="missing-data" className="space-y-6">
                        <Card className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5" />
                                            Datos Faltantes de Funcionarios
                                        </CardTitle>
                                        <CardDescription>
                                            Revisa y completa la información faltante de email, RUT y teléfono de los funcionarios
                                        </CardDescription>
                                    </div>
                                    <Button
                                        onClick={loadMissingData}
                                        variant="outline"
                                        className="flex items-center gap-2"
                                        disabled={loadingMissingData}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${loadingMissingData ? 'animate-spin' : ''}`} />
                                        Actualizar
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingMissingData ? (
                                    <div className="flex items-center justify-center py-8">
                                        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                                    </div>
                                ) : missingDataResponse ? (
                                    <div className="space-y-6">
                                        {/* Estadísticas de completitud */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                            <Card className="border-2 border-green-200 dark:border-green-800">
                                                <CardContent className="pt-4 pb-4 text-center">
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {missingDataResponse.stats.completion_percentage}%
                                                    </div>
                                                    <div className="text-xs text-gray-600">Completitud</div>
                                                </CardContent>
                                            </Card>
                                            <Card className="border-2 border-blue-200 dark:border-blue-800">
                                                <CardContent className="pt-4 pb-4 text-center">
                                                    <div className="text-2xl font-bold text-blue-600">
                                                        {missingDataResponse.stats.complete_data}
                                                    </div>
                                                    <div className="text-xs text-gray-600">Completos</div>
                                                </CardContent>
                                            </Card>
                                            <Card className="border-2 border-orange-200 dark:border-orange-800">
                                                <CardContent className="pt-4 pb-4 text-center">
                                                    <div className="text-xl font-bold text-orange-600">
                                                        📧 {missingDataResponse.stats.missing_email}
                                                    </div>
                                                    <div className="text-xs text-gray-600">Sin Email</div>
                                                </CardContent>
                                            </Card>
                                            <Card className="border-2 border-orange-200 dark:border-orange-800">
                                                <CardContent className="pt-4 pb-4 text-center">
                                                    <div className="text-xl font-bold text-orange-600">
                                                        🆔 {missingDataResponse.stats.missing_rut}
                                                    </div>
                                                    <div className="text-xs text-gray-600">Sin RUT</div>
                                                </CardContent>
                                            </Card>
                                            <Card className="border-2 border-orange-200 dark:border-orange-800">
                                                <CardContent className="pt-4 pb-4 text-center">
                                                    <div className="text-xl font-bold text-orange-600">
                                                        📱 {missingDataResponse.stats.missing_phone}
                                                    </div>
                                                    <div className="text-xs text-gray-600">Sin Teléfono</div>
                                                </CardContent>
                                            </Card>
                                            <Card className="border-2 border-red-200 dark:border-red-800">
                                                <CardContent className="pt-4 pb-4 text-center">
                                                    <div className="text-xl font-bold text-red-600">
                                                        ⚠️ {missingDataResponse.stats.missing_multiple}
                                                    </div>
                                                    <div className="text-xs text-gray-600">Múltiples</div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Filtros de categoría */}
                                        <div className="flex flex-wrap gap-2">
                                            <Button
                                                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setSelectedCategory('all')}
                                            >
                                                Todos ({
                                                    missingDataResponse.stats.missing_email +
                                                    missingDataResponse.stats.missing_rut +
                                                    missingDataResponse.stats.missing_phone +
                                                    missingDataResponse.stats.missing_multiple
                                                })
                                            </Button>
                                            <Button
                                                variant={selectedCategory === 'missing_email' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setSelectedCategory('missing_email')}
                                                className="flex items-center gap-1"
                                            >
                                                📧 Sin Email ({missingDataResponse.stats.missing_email})
                                            </Button>
                                            <Button
                                                variant={selectedCategory === 'missing_rut' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setSelectedCategory('missing_rut')}
                                                className="flex items-center gap-1"
                                            >
                                                🆔 Sin RUT ({missingDataResponse.stats.missing_rut})
                                            </Button>
                                            <Button
                                                variant={selectedCategory === 'missing_phone' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setSelectedCategory('missing_phone')}
                                                className="flex items-center gap-1"
                                            >
                                                📱 Sin Teléfono ({missingDataResponse.stats.missing_phone})
                                            </Button>
                                            <Button
                                                variant={selectedCategory === 'missing_multiple' ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => setSelectedCategory('missing_multiple')}
                                                className="flex items-center gap-1"
                                            >
                                                ⚠️ Múltiples Faltantes ({missingDataResponse.stats.missing_multiple})
                                            </Button>
                                        </div>

                                        {/* Buscador */}
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Buscar funcionario..."
                                                value={searchMissingData}
                                                onChange={(e) => setSearchMissingData(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>

                                        {/* Lista de funcionarios con datos faltantes */}
                                        <div className="space-y-3">
                                            {filteredMissingDataEmployees.length === 0 ? (
                                                <div className="text-center py-8 text-gray-500">
                                                    <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                    <p>
                                                        {getCategoryEmployees().length === 0
                                                            ? '¡Todos los funcionarios tienen datos completos!'
                                                            : 'No se encontraron funcionarios con ese término de búsqueda'
                                                        }
                                                    </p>
                                                </div>
                                            ) : (
                                                filteredMissingDataEmployees.map((employee) => (
                                                    <Card key={employee.id} className="border-l-4" style={{ borderLeftColor: employee.missing_fields.length > 1 ? '#ef4444' : '#f59e0b' }}>
                                                        <CardContent className="pt-4 pb-4">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                                                                        {employee.name}
                                                                    </h3>
                                                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                                        {employee.rut && <span>RUT: {employee.rut}</span>}
                                                                        {employee.phone && (
                                                                            <>
                                                                                {employee.rut && <span>•</span>}
                                                                                <span>Tel: {employee.phone}</span>
                                                                            </>
                                                                        )}
                                                                        {employee.email && (
                                                                            <>
                                                                                {(employee.rut || employee.phone) && <span>•</span>}
                                                                                <span>Email: {employee.email}</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {employee.rol_nombre}
                                                                        </Badge>
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            {employee.amzoma ? 'Amzoma' : 'Temuco'}
                                                                        </Badge>
                                                                        <span className="text-xs text-gray-400 dark:text-gray-500">ID: {employee.id}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="flex flex-col gap-1">
                                                                        {employee.missing_fields.map((field) => (
                                                                            <Badge
                                                                                key={field}
                                                                                variant="outline"
                                                                                className="text-xs text-red-600 border-red-300 bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700"
                                                                            >
                                                                                {getMissingFieldIcon(field)} Falta {getMissingFieldLabel(field)}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            )}
                                        </div>

                                        {/* Resumen final */}
                                        <Card className="border-2 border-dashed border-blue-300 dark:border-blue-700">
                                            <CardContent className="pt-6 text-center">
                                                <h3 className="text-lg font-semibold mb-2">📊 Resumen de Datos</h3>
                                                <div className="text-sm text-gray-600 space-y-1">
                                                    <p><strong>{missingDataResponse.stats.total_employees}</strong> funcionarios en total</p>
                                                    <p><strong>{missingDataResponse.stats.complete_data}</strong> con datos completos</p>
                                                    <p><strong>{missingDataResponse.stats.total_employees - missingDataResponse.stats.complete_data}</strong> requieren completar información</p>
                                                    <p className="text-lg font-bold text-blue-600">
                                                        Completitud: {missingDataResponse.stats.completion_percentage}%
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Haz clic en "Actualizar" para cargar los datos</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* User Linking Tab */}
                    <TabsContent value="user-linking" className="space-y-6">
                        <Card className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Link className="h-5 w-5" />
                                            Vinculación Funcionario-Usuario
                                        </CardTitle>
                                        <CardDescription>
                                            Vincula funcionarios sin cuenta de usuario o usuarios sin funcionario asociado
                                        </CardDescription>
                                    </div>
                                    <Button
                                        onClick={loadLinkingData}
                                        variant="outline"
                                        className="flex items-center gap-2"
                                        disabled={loadingLinking}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${loadingLinking ? 'animate-spin' : ''}`} />
                                        Actualizar
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {loadingLinking ? (
                                    <div className="flex items-center justify-center py-8">
                                        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Funcionarios sin vincular */}
                                        <Card className="border-2 border-orange-200 dark:border-orange-800">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                                                    <AlertCircle className="h-5 w-5" />
                                                    Funcionarios sin Usuario ({filteredUnlinkedEmployees.length})
                                                </CardTitle>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        placeholder="Buscar funcionario..."
                                                        value={searchUnlinked}
                                                        onChange={(e) => setSearchUnlinked(e.target.value)}
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </CardHeader>
                                            <CardContent className="max-h-96 overflow-y-auto space-y-2">
                                                {filteredUnlinkedEmployees.map((employee) => (
                                                    <div
                                                        key={employee.id}
                                                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                                            selectedEmployee === employee.id
                                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                                : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                                                        }`}
                                                        onClick={() => setSelectedEmployee(employee.id)}
                                                    >
                                                        <div className="font-medium">{employee.name}</div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {employee.rut && <span>RUT: {employee.rut}</span>}
                                                            {employee.rut && employee.phone && <span> • </span>}
                                                            {employee.phone && <span>Tel: {employee.phone}</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <Badge variant="outline" className="text-xs">
                                                                {employee.rol_nombre}
                                                            </Badge>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {employee.amzoma ? 'Amzoma' : 'Temuco'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                                {filteredUnlinkedEmployees.length === 0 && (
                                                    <div className="text-center py-8 text-gray-500">
                                                        <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                        <p>¡Todos los funcionarios están vinculados!</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>

                                        {/* Usuarios disponibles */}
                                        <Card className="border-2 border-green-200 dark:border-green-800">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                                    <UserCheck className="h-5 w-5" />
                                                    Usuarios Disponibles ({filteredAvailableUsers.length})
                                                </CardTitle>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        placeholder="Buscar usuario..."
                                                        value={searchUsers}
                                                        onChange={(e) => setSearchUsers(e.target.value)}
                                                        className="pl-10"
                                                    />
                                                </div>
                                            </CardHeader>
                                            <CardContent className="max-h-96 overflow-y-auto space-y-2">
                                                {filteredAvailableUsers.map((user) => (
                                                    <div
                                                        key={user.id}
                                                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                                                            selectedUser === user.id
                                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                                : 'border-gray-200 hover:border-gray-300 dark:border-gray-600'
                                                        }`}
                                                        onClick={() => setSelectedUser(user.id)}
                                                    >
                                                        <div className="font-medium">{user.name}</div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {user.email}
                                                        </div>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {user.roles.map((role, index) => (
                                                                <Badge key={index} variant="outline" className="text-xs">
                                                                    {role.name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                {filteredAvailableUsers.length === 0 && (
                                                    <div className="text-center py-8 text-gray-500">
                                                        <UserCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                        <p>No hay usuarios disponibles</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Panel de vinculación */}
                                {!loadingLinking && (selectedEmployee || selectedUser) && (
                                    <Card className="mt-6 border-2 border-dashed border-blue-300 dark:border-blue-700">
                                        <CardContent className="pt-6">
                                            <div className="text-center">
                                                <h3 className="text-lg font-semibold mb-4">Panel de Vinculación</h3>

                                                {selectedEmployee && selectedUser ? (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-center gap-4">
                                                            <div className="text-center">
                                                                <div className="font-medium">Funcionario</div>
                                                                <div className="text-sm text-gray-600">
                                                                    {filteredUnlinkedEmployees.find(e => e.id === selectedEmployee)?.name}
                                                                </div>
                                                            </div>
                                                            <Link className="h-8 w-8 text-blue-500" />
                                                            <div className="text-center">
                                                                <div className="font-medium">Usuario</div>
                                                                <div className="text-sm text-gray-600">
                                                                    {filteredAvailableUsers.find(u => u.id === selectedUser)?.email}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button onClick={linkEmployeeToUser} className="w-full">
                                                            <Link className="h-4 w-4 mr-2" />
                                                            Vincular Funcionario con Usuario
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="text-gray-500">
                                                        <p>Selecciona un funcionario y un usuario para vincularlos</p>
                                                        {selectedEmployee && !selectedUser && (
                                                            <p className="text-sm mt-2">✓ Funcionario seleccionado, ahora selecciona un usuario</p>
                                                        )}
                                                        {!selectedEmployee && selectedUser && (
                                                            <p className="text-sm mt-2">✓ Usuario seleccionado, ahora selecciona un funcionario</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Estadísticas */}
                                {!loadingLinking && (
                                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Card>
                                            <CardContent className="pt-6 text-center">
                                                <div className="text-2xl font-bold text-orange-600">
                                                    {linkingData.unlinked_employees.length}
                                                </div>
                                                <div className="text-sm text-gray-600">Funcionarios sin usuario</div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-6 text-center">
                                                <div className="text-2xl font-bold text-green-600">
                                                    {linkingData.available_users.length}
                                                </div>
                                                <div className="text-sm text-gray-600">Usuarios disponibles</div>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardContent className="pt-6 text-center">
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {data.empleados.filter(emp => !linkingData.unlinked_employees.find(unlinked => unlinked.id === emp.id)).length}
                                                </div>
                                                <div className="text-sm text-gray-600">Funcionarios vinculados</div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
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
