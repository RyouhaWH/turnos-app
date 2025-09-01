import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Save, X, UserCheck, ChevronDown, ChevronUp, Plus } from 'lucide-react';

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
    user_id?: number;
    user_name?: string;
    user_roles?: string[];
    user_has_password?: boolean;
    created_at: string;
    updated_at: string;
}

interface Rol {
    id: number;
    nombre: string;
    color?: string;
}

interface EmployeesTabProps {
    empleados: Empleado[];
    roles: Rol[];
    onEmployeeUpdate: (employeeId: number, data: Partial<Empleado>) => void;
    onUserCreate: (employeeId: number, userData: any) => void;
    onUserUpdate: (employeeId: number, userData: any) => void;
    onUserDelete: (employeeId: number) => void;
    availableRoles: string[];
}

export default function EmployeesTab({
    empleados,
    roles,
    onEmployeeUpdate,
    onUserCreate,
    onUserUpdate,
    onUserDelete,
    availableRoles
}: EmployeesTabProps) {
    const [editingEmployee, setEditingEmployee] = useState<number | null>(null);
    const [editingEmployeeData, setEditingEmployeeData] = useState<Partial<Empleado>>({});
    const [searchEmployee, setSearchEmployee] = useState('');
    const [filteredEmployees, setFilteredEmployees] = useState<Empleado[]>(empleados);
    const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null);

    // Estados para gestión de usuario
    const [editingUserData, setEditingUserData] = useState<{
        name: string;
        email: string;
        password: string;
        roles: string[];
    }>({
        name: '',
        email: '',
        password: '',
        roles: []
    });
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [isEditingUser, setIsEditingUser] = useState(false);

    // Filtrar empleados cuando cambie la búsqueda
    useEffect(() => {
        if (searchEmployee.trim() === '') {
            setFilteredEmployees(empleados);
        } else {
            const filtered = empleados.filter(emp =>
                emp.name.toLowerCase().includes(searchEmployee.toLowerCase()) ||
                emp.rut?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
                emp.email?.toLowerCase().includes(searchEmployee.toLowerCase())
            );
            setFilteredEmployees(filtered);
        }
    }, [searchEmployee, empleados]);

    const handleStartEdit = (employee: Empleado) => {
        setEditingEmployee(employee.id);
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
    };

    const handleSaveEmployee = (employeeId: number) => {
        onEmployeeUpdate(employeeId, editingEmployeeData);
        setEditingEmployee(null);
        setEditingEmployeeData({});
    };

    const handleCancelEdit = () => {
        setEditingEmployee(null);
        setEditingEmployeeData({});
    };

    const handleStartCreateUser = (employee: Empleado) => {
        setIsCreatingUser(true);
        setEditingUserData({
            name: employee.name,
            email: employee.email || '',
            password: '',
            roles: []
        });
    };

    const handleStartEditUser = (employee: Empleado) => {
        setIsEditingUser(true);
        setEditingUserData({
            name: employee.user_name || employee.name,
            email: employee.email || '',
            password: '',
            roles: employee.user_roles || []
        });
    };

    const handleSaveUser = (employeeId: number) => {
        if (isCreatingUser) {
            onUserCreate(employeeId, editingUserData);
        } else {
            onUserUpdate(employeeId, editingUserData);
        }
        setIsCreatingUser(false);
        setIsEditingUser(false);
        setEditingUserData({ name: '', email: '', password: '', roles: [] });
    };

    const handleCancelUser = () => {
        setIsCreatingUser(false);
        setIsEditingUser(false);
        setEditingUserData({ name: '', email: '', password: '', roles: [] });
    };

    const getRoleColor = (roleName: string) => {
        const role = roles.find(r => r.nombre === roleName);
        return role?.color || '#3B82F6';
    };

    const getRoleBadgeStyles = (roleName: string) => {
        const color = getRoleColor(roleName);
        const isDarkMode = document.documentElement.classList.contains('dark');

        if (isDarkMode) {
            return {
                backgroundColor: color + '30',
                borderColor: color + '60',
                color: '#ffffff'
            };
        } else {
            return {
                backgroundColor: color + '20',
                borderColor: color + '40',
                color: color
            };
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5" />
                                Gestión de Empleados
                            </CardTitle>
                            <CardDescription>
                                Administra la información de los empleados y sus cuentas de usuario
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Barra de búsqueda */}
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Buscar empleados por nombre, RUT o email..."
                            value={searchEmployee}
                            onChange={(e) => setSearchEmployee(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Lista de empleados */}
                    <div className="space-y-4">
                        {filteredEmployees.map((empleado) => (
                            <Card key={empleado.id} className="border-l-4" style={{ borderLeftColor: getRoleColor(empleado.rol_nombre) }}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <h3 className="font-semibold text-lg">{empleado.name}</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {empleado.first_name} {empleado.paternal_lastname} {empleado.maternal_lastname}
                                                </p>
                                            </div>
                                            <Badge
                                                style={getRoleBadgeStyles(empleado.rol_nombre)}
                                                className="px-3 py-1 text-sm font-medium border"
                                            >
                                                {empleado.rol_nombre}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setExpandedEmployee(
                                                    expandedEmployee === empleado.id ? null : empleado.id
                                                )}
                                            >
                                                {expandedEmployee === empleado.id ? (
                                                    <ChevronUp className="h-4 w-4" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleStartEdit(empleado)}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Editar
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Información expandida */}
                                    {expandedEmployee === empleado.id && (
                                        <div className="border-t pt-4 space-y-4">
                                            {/* Información básica */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-600">RUT</Label>
                                                    <p className="text-sm">{empleado.rut || 'No especificado'}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-600">Teléfono</Label>
                                                    <p className="text-sm">{empleado.phone || 'No especificado'}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                                                    <p className="text-sm">{empleado.email || 'No especificado'}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-sm font-medium text-gray-600">Estado</Label>
                                                    <p className="text-sm">{empleado.status || 'Activo'}</p>
                                                </div>
                                            </div>

                                            {/* Gestión de usuario */}
                                            <div className="border-t pt-4">
                                                <h4 className="font-medium mb-3">Cuenta de Usuario</h4>
                                                {empleado.user_id ? (
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-sm font-medium">{empleado.user_name}</p>
                                                                <p className="text-xs text-gray-600">{empleado.email}</p>
                                                                <div className="flex gap-1 mt-1">
                                                                    {empleado.user_roles?.map((role) => (
                                                                        <Badge key={role} variant="secondary" className="text-xs">
                                                                            {role}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleStartEditUser(empleado)}
                                                                >
                                                                    <Edit className="h-4 w-4 mr-2" />
                                                                    Editar Usuario
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => onUserDelete(empleado.id)}
                                                                    className="text-red-600 hover:text-red-700"
                                                                >
                                                                    Eliminar Usuario
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm text-gray-600">Sin cuenta de usuario</p>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleStartCreateUser(empleado)}
                                                        >
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Crear Usuario
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Formulario de edición de empleado */}
                                    {editingEmployee === empleado.id && (
                                        <div className="border-t pt-4 mt-4">
                                            <h4 className="font-medium mb-3">Editar Empleado</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor={`name-${empleado.id}`}>Nombre</Label>
                                                    <Input
                                                        id={`name-${empleado.id}`}
                                                        value={editingEmployeeData.name || ''}
                                                        onChange={(e) => setEditingEmployeeData(prev => ({ ...prev, name: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor={`rut-${empleado.id}`}>RUT</Label>
                                                    <Input
                                                        id={`rut-${empleado.id}`}
                                                        value={editingEmployeeData.rut || ''}
                                                        onChange={(e) => setEditingEmployeeData(prev => ({ ...prev, rut: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor={`phone-${empleado.id}`}>Teléfono</Label>
                                                    <Input
                                                        id={`phone-${empleado.id}`}
                                                        value={editingEmployeeData.phone || ''}
                                                        onChange={(e) => setEditingEmployeeData(prev => ({ ...prev, phone: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor={`email-${empleado.id}`}>Email</Label>
                                                    <Input
                                                        id={`email-${empleado.id}`}
                                                        value={editingEmployeeData.email || ''}
                                                        onChange={(e) => setEditingEmployeeData(prev => ({ ...prev, email: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <Button onClick={() => handleSaveEmployee(empleado.id)}>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Guardar
                                                </Button>
                                                <Button variant="outline" onClick={handleCancelEdit}>
                                                    <X className="h-4 w-4 mr-2" />
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Formulario de creación/edición de usuario */}
                                    {(isCreatingUser || isEditingUser) && (
                                        <div className="border-t pt-4 mt-4">
                                            <h4 className="font-medium mb-3">
                                                {isCreatingUser ? 'Crear Usuario' : 'Editar Usuario'}
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor="user-name">Nombre de Usuario</Label>
                                                    <Input
                                                        id="user-name"
                                                        value={editingUserData.name}
                                                        onChange={(e) => setEditingUserData(prev => ({ ...prev, name: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="user-email">Email</Label>
                                                    <Input
                                                        id="user-email"
                                                        type="email"
                                                        value={editingUserData.email}
                                                        onChange={(e) => setEditingUserData(prev => ({ ...prev, email: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="user-password">Contraseña</Label>
                                                    <Input
                                                        id="user-password"
                                                        type="password"
                                                        value={editingUserData.password}
                                                        onChange={(e) => setEditingUserData(prev => ({ ...prev, password: e.target.value }))}
                                                        placeholder={isEditingUser ? 'Dejar en blanco para no cambiar' : ''}
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="user-roles">Roles</Label>
                                                    <select
                                                        id="user-roles"
                                                        multiple
                                                        value={editingUserData.roles}
                                                        onChange={(e) => {
                                                            const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                                            setEditingUserData(prev => ({ ...prev, roles: selectedOptions }));
                                                        }}
                                                        className="w-full p-2 border rounded-md"
                                                    >
                                                        {availableRoles.map((role) => (
                                                            <option key={role} value={role}>{role}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-4">
                                                <Button onClick={() => handleSaveUser(empleado.id)}>
                                                    <Save className="h-4 w-4 mr-2" />
                                                    {isCreatingUser ? 'Crear' : 'Guardar'}
                                                </Button>
                                                <Button variant="outline" onClick={handleCancelUser}>
                                                    <X className="h-4 w-4 mr-2" />
                                                    Cancelar
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
        </div>
    );
}
