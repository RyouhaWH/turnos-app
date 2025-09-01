import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Link, Unlink, Search, Users, UserCheck, RefreshCw } from 'lucide-react';

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

interface UserLinkingTabProps {
    onLoadLinkingData: () => void;
    linkingData: LinkingData;
    loading: boolean;
    onLinkEmployee: (employeeId: number, userId: number) => void;
    onUnlinkEmployee: (employeeId: number) => void;
}

export default function UserLinkingTab({
    onLoadLinkingData,
    linkingData,
    loading,
    onLinkEmployee,
    onUnlinkEmployee
}: UserLinkingTabProps) {
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
    const [selectedUser, setSelectedUser] = useState<number | null>(null);
    const [searchUnlinked, setSearchUnlinked] = useState('');
    const [searchUsers, setSearchUsers] = useState('');
    const [filteredUnlinkedEmployees, setFilteredUnlinkedEmployees] = useState<UnlinkedEmployee[]>([]);
    const [filteredAvailableUsers, setFilteredAvailableUsers] = useState<AvailableUser[]>([]);

    useEffect(() => {
        // Filtrar empleados sin vincular
        if (searchUnlinked.trim() === '') {
            setFilteredUnlinkedEmployees(linkingData.unlinked_employees);
        } else {
            const filtered = linkingData.unlinked_employees.filter(emp =>
                emp.name.toLowerCase().includes(searchUnlinked.toLowerCase()) ||
                emp.rut?.toLowerCase().includes(searchUnlinked.toLowerCase()) ||
                emp.email?.toLowerCase().includes(searchUnlinked.toLowerCase())
            );
            setFilteredUnlinkedEmployees(filtered);
        }

        // Filtrar usuarios disponibles
        if (searchUsers.trim() === '') {
            setFilteredAvailableUsers(linkingData.available_users);
        } else {
            const filtered = linkingData.available_users.filter(user =>
                user.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
                user.email.toLowerCase().includes(searchUsers.toLowerCase())
            );
            setFilteredAvailableUsers(filtered);
        }
    }, [searchUnlinked, searchUsers, linkingData]);

    const handleLink = () => {
        if (selectedEmployee && selectedUser) {
            onLinkEmployee(selectedEmployee, selectedUser);
            setSelectedEmployee(null);
            setSelectedUser(null);
        }
    };

    const handleUnlink = (employeeId: number) => {
        onUnlinkEmployee(employeeId);
    };

    const getRoleColor = (roleName: string) => {
        // Colores predefinidos para roles comunes
        const roleColors: { [key: string]: string } = {
            'admin': '#ef4444',
            'supervisor': '#f59e0b',
            'empleado': '#10b981',
            'operador': '#3b82f6',
            'default': '#6b7280'
        };
        return roleColors[roleName.toLowerCase()] || roleColors.default;
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

    if (!linkingData.unlinked_employees.length && !linkingData.available_users.length && !loading) {
        return (
            <div className="space-y-6">
                <Card className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <Link className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No hay datos de vinculación
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Haz clic en "Cargar Datos de Vinculación" para ver empleados y usuarios disponibles
                            </p>
                            <Button onClick={onLoadLinkingData} className="bg-blue-600 hover:bg-blue-700">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Cargar Datos de Vinculación
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link className="h-5 w-5" />
                        Vinculación de Usuarios
                    </CardTitle>
                    <CardDescription>
                        Vincula empleados sin cuenta de usuario con usuarios disponibles del sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                            {linkingData.unlinked_employees.length} empleados sin vincular • {linkingData.available_users.length} usuarios disponibles
                        </p>
                        <Button
                            onClick={onLoadLinkingData}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? (
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            {loading ? 'Cargando...' : 'Recargar'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Contenedor principal con dos columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Columna izquierda - Empleados sin vincular */}
                <Card className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5" />
                            Empleados Sin Vincular
                        </CardTitle>
                        <CardDescription>
                            Empleados que no tienen una cuenta de usuario asociada
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Búsqueda */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Buscar empleados..."
                                value={searchUnlinked}
                                onChange={(e) => setSearchUnlinked(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Lista de empleados */}
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {filteredUnlinkedEmployees.map((employee) => (
                                <Card
                                    key={employee.id}
                                    className={`cursor-pointer transition-all ${
                                        selectedEmployee === employee.id
                                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                    }`}
                                    onClick={() => setSelectedEmployee(employee.id)}
                                >
                                    <CardContent className="pt-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-medium">{employee.name}</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {employee.first_name} {employee.paternal_lastname} {employee.maternal_lastname}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {employee.rol_nombre}
                                                    </Badge>
                                                    <Badge variant="outline" className={`text-xs ${
                                                        employee.amzoma ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'
                                                    }`}>
                                                        {employee.amzoma ? 'Amzoma' : 'Municipal'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="text-right text-sm text-gray-500">
                                                {employee.rut && <div>RUT: {employee.rut}</div>}
                                                {employee.phone && <div>Tel: {employee.phone}</div>}
                                                {employee.email && <div>Email: {employee.email}</div>}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {filteredUnlinkedEmployees.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    {searchUnlinked.trim() !== ''
                                        ? 'No se encontraron empleados con los criterios de búsqueda'
                                        : 'No hay empleados sin vincular'
                                    }
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Columna derecha - Usuarios disponibles */}
                <Card className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <UserCheck className="h-5 w-5" />
                            Usuarios Disponibles
                        </CardTitle>
                        <CardDescription>
                            Usuarios del sistema que no están vinculados a ningún empleado
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Búsqueda */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Buscar usuarios..."
                                value={searchUsers}
                                onChange={(e) => setSearchUsers(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Lista de usuarios */}
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {filteredAvailableUsers.map((user) => (
                                <Card
                                    key={user.id}
                                    className={`cursor-pointer transition-all ${
                                        selectedUser === user.id
                                            ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                    }`}
                                    onClick={() => setSelectedUser(user.id)}
                                >
                                    <CardContent className="pt-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-medium">{user.name}</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {user.roles.map((role) => (
                                                        <Badge
                                                            key={role.name}
                                                            variant="outline"
                                                            className="text-xs"
                                                            style={getRoleBadgeStyles(role.name)}
                                                        >
                                                            {role.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            {filteredAvailableUsers.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    {searchUsers.trim() !== ''
                                        ? 'No se encontraron usuarios con los criterios de búsqueda'
                                        : 'No hay usuarios disponibles'
                                    }
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Panel de acciones */}
            {(selectedEmployee || selectedUser) && (
                <Card className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {selectedEmployee && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Empleado seleccionado:</span>
                                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                                            {linkingData.unlinked_employees.find(emp => emp.id === selectedEmployee)?.name}
                                        </Badge>
                                    </div>
                                )}
                                {selectedUser && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Usuario seleccionado:</span>
                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                            {linkingData.available_users.find(user => user.id === selectedUser)?.name}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                {selectedEmployee && selectedUser ? (
                                    <Button
                                        onClick={handleLink}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <Link className="h-4 w-4 mr-2" />
                                        Vincular
                                    </Button>
                                ) : (
                                    <Button variant="outline" disabled>
                                        Selecciona un empleado y un usuario para vincular
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedEmployee(null);
                                        setSelectedUser(null);
                                    }}
                                >
                                    Limpiar Selección
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
