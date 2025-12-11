import React, { useState, useEffect, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
    CheckCircle,
    Eye,
    EyeOff
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
    amzoma?: boolean;
    rol_id: number;
    rol_nombre: string;
    user_id?: number;
    user_name?: string;
    user_roles?: string[];
    user_has_password?: boolean;
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

    // Sincronizar estado cuando cambien los props
    useEffect(() => {
        setData(prev => ({
            ...prev,
            empleados: empleados || []
        }));
    }, [empleados]);

    // Actualizar empleados filtrados cuando cambien los empleados o la búsqueda
    useEffect(() => {
        if (searchEmployee.trim() === '') {
            setFilteredEmployees(data.empleados);
        } else {
            const filtered = data.empleados.filter(emp =>
                emp.name?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
                emp.rut?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
                emp.email?.toLowerCase().includes(searchEmployee.toLowerCase()) ||
                `${emp.first_name || ''} ${emp.paternal_lastname || ''} ${emp.maternal_lastname || ''}`.toLowerCase().includes(searchEmployee.toLowerCase())
            );
            setFilteredEmployees(filtered);
        }
    }, [searchEmployee, data.empleados]);
    const [loadingEmployee, setLoadingEmployee] = useState(false);
    const [expandedEmployee, setExpandedEmployee] = useState<number | null>(null);
    const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
    const [newEmployeeData, setNewEmployeeData] = useState<Partial<Empleado>>({
        rol_id: data.roles[0]?.id || undefined,
        amzoma: true,
        status: 'activo'
    });
    const [createUserForNewEmployee, setCreateUserForNewEmployee] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [emailDomain, setEmailDomain] = useState('@amzoma.cl');
    const [customDomain, setCustomDomain] = useState('');
    const [isCustomDomain, setIsCustomDomain] = useState(false);
    const [availableRoles, setAvailableRoles] = useState<string[]>([]);
    const [loadingUser, setLoadingUser] = useState(false);

    const defaultUserRole = useMemo(() => {
        if (!availableRoles || availableRoles.length === 0) return null;
        const match = availableRoles.find(role => role.toLowerCase() === 'usuario');
        return match || availableRoles[0];
    }, [availableRoles]);

    const [newEmployeeUserData, setNewEmployeeUserData] = useState<{
        name: string;
        email: string;
        password: string;
        roles: string[];
    }>({
        name: '',
        email: '',
        password: '',
        roles: ['usuario'] // Se ajustará cuando se carguen los roles reales
    });

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
    const [selectedEmployeeForCompletion, setSelectedEmployeeForCompletion] = useState<EmployeeWithMissingData | null>(null);
    const [completionFormData, setCompletionFormData] = useState<{
        rut?: string;
        phone?: string;
        email?: string;
    }>({});
    const [loadingCompletion, setLoadingCompletion] = useState(false);

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
                setEditingRole(null);
                toast.success('Rol actualizado correctamente');
                // Refrescar solo los roles sin recargar la página
                refreshRoles();
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
                // Refrescar solo los roles sin recargar la página
                refreshRoles();
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
                // Reset form state
                setNewRole({ nombre: '', is_operational: true, color: '#3B82F6' });
                setIsAddingRole(false);
                toast.success('Rol creado correctamente');
                // Refrescar solo los roles sin recargar la página
                refreshRoles();
            },
            onError: (errors) => {
                toast.error('Error al crear rol');
                console.error('Errores:', errors);
            }
        });
    };

    // Crear empleado
    const createEmployee = (employeeData: Partial<Empleado>) => {
        if (!employeeData.rol_id) {
            toast.error('Debes seleccionar un rol para el empleado');
            return;
        }

        // Preparar datos para enviar
        const dataToSend: any = {
            ...employeeData,
            create_user: createUserForNewEmployee
        };

        // Si se va a crear usuario, agregar los datos del usuario
        if (createUserForNewEmployee) {
            if (!newEmployeeUserData.name || !newEmployeeUserData.email || !newEmployeeUserData.password) {
                toast.error('Debes completar todos los campos del usuario (nombre, email y contraseña)');
                return;
            }
            if (!defaultUserRole) {
                toast.error('No hay roles disponibles para crear la cuenta de usuario. Configura roles en Spatie antes de continuar.');
                return;
            }

            dataToSend.user_name = newEmployeeUserData.name;
            dataToSend.user_email = newEmployeeUserData.email;
            dataToSend.user_password = newEmployeeUserData.password;
            dataToSend.user_roles = [defaultUserRole];
        }

        router.post('/platform-data/employees', dataToSend, {
            onSuccess: () => {
                setIsCreatingEmployee(false);
                setCreateUserForNewEmployee(false);
                setShowPassword(false);
                setEmailDomain('@amzoma.cl');
                setCustomDomain('');
                setIsCustomDomain(false);
                setNewEmployeeData({
                    rol_id: data.roles[0]?.id || undefined,
                    amzoma: true,
                    status: 'activo'
                });
                setNewEmployeeUserData({
                    name: '',
                    email: '',
                    password: '',
                    roles: defaultUserRole ? [defaultUserRole] : []
                });
                toast.success(createUserForNewEmployee ? 'Empleado y usuario creados correctamente' : 'Empleado creado correctamente');
                // Recargar solo los empleados
                router.reload({ only: ['empleados'] });
            },
            onError: (errors) => {
                toast.error('Error al crear empleado');
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
                console.log('📊 Datos del empleado recibidos:', {
                    email: employeeData.email,
                    user_id: employeeData.user_id,
                    user_name: employeeData.user_name,
                    user_roles: employeeData.user_roles
                });

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

                // Inicializar datos del usuario si existe
                if (employeeData.user_id) {
                    console.log('🔍 Usuario existente encontrado:', {
                        user_id: employeeData.user_id,
                        user_name: employeeData.user_name,
                        user_roles: employeeData.user_roles
                    });
                    setEditingUserData({
                        name: employeeData.user_name || '',
                        email: employeeData.email || '',
                        password: '',
                        roles: employeeData.user_roles || []
                    });
                } else {
                    console.log('🔍 No hay usuario vinculado');
                    setEditingUserData({
                        name: '',
                        email: '',
                        password: '',
                        roles: []
                    });
                }
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

                // Inicializar datos del usuario si existe
                if (employee.user_id) {
                    console.log('🔍 Usuario existente (fallback local):', {
                        user_id: employee.user_id,
                        user_name: employee.user_name,
                        user_roles: employee.user_roles
                    });
                    setEditingUserData({
                        name: employee.user_name || '',
                        email: employee.email || '',
                        password: '',
                        roles: employee.user_roles || []
                    });
                } else {
                    console.log('🔍 No hay usuario vinculado (fallback local)');
                    setEditingUserData({
                        name: '',
                        email: '',
                        password: '',
                        roles: []
                    });
                }
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

            // Inicializar datos del usuario si existe
            if (employee.user_id) {
                console.log('🔍 Usuario existente (catch):', {
                    user_id: employee.user_id,
                    user_name: employee.user_name,
                    user_roles: employee.user_roles
                });
                setEditingUserData({
                    name: employee.user_name || '',
                    email: employee.email || '',
                    password: '',
                    roles: employee.user_roles || []
                });
            } else {
                console.log('🔍 No hay usuario vinculado (catch)');
                setEditingUserData({
                    name: '',
                    email: '',
                    password: '',
                    roles: []
                });
            }
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
        setEditingUserData({
            name: '',
            email: '',
            password: '',
            roles: []
        });
    };

        // Función para cargar roles disponibles
    const loadAvailableRoles = async () => {
        try {
            console.log('🔄 Cargando roles de Spatie disponibles...');
            const response = await window.axios.get('/platform-data/spatie-roles');
            console.log('📡 Response de /platform-data/spatie-roles:', response);

            if (response.data.success) {
                const roles = response.data.data;
                console.log('✅ Roles de Spatie cargados:', roles);
                setAvailableRoles(roles);
            } else {
                console.error('❌ Error en response:', response.data);
            }
        } catch (error) {
            console.error('❌ Error loading Spatie roles:', error);
        }
    };

    // Función para actualizar usuario
    const updateUser = async (employeeId: number) => {
        setLoadingUser(true);
        try {
            const response = await window.axios.put(`/platform-data/employees/${employeeId}/update-user`, editingUserData);
            if (response.data.success) {
                toast.success('Usuario actualizado correctamente');
                // Recargar la página para obtener datos actualizados
                router.reload();
            }
        } catch (error: any) {
            console.error('Error updating user:', error);
            toast.error(error.response?.data?.message || 'Error al actualizar usuario');
        } finally {
            setLoadingUser(false);
        }
    };

    // Función para crear usuario
    const createUser = async (employeeId: number) => {
        setLoadingUser(true);
        try {
            const response = await window.axios.post(`/platform-data/employees/${employeeId}/create-user`, editingUserData);
            if (response.data.success) {
                toast.success('Usuario creado correctamente');
                // Recargar la página para obtener datos actualizados
                router.reload();
            }
        } catch (error: any) {
            console.error('Error creating user:', error);
            toast.error(error.response?.data?.message || 'Error al crear usuario');
        } finally {
            setLoadingUser(false);
        }
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


    // Actualizar nombre completo automáticamente
    useEffect(() => {
        if (editingEmployee && editingEmployeeData.first_name && editingEmployeeData.paternal_lastname) {
            updateFullName();
        }
    }, [editingEmployeeData.first_name, editingEmployeeData.paternal_lastname, editingEmployeeData.maternal_lastname]);

    // Generar nombre y email automáticamente cuando se activa crear usuario o cambian los datos del empleado
    useEffect(() => {
        if (createUserForNewEmployee && newEmployeeData.first_name && newEmployeeData.paternal_lastname) {
            // Generar nombre completo automáticamente
            const firstName = (newEmployeeData.first_name || '').trim();
            const paternalLastname = (newEmployeeData.paternal_lastname || '').trim();
            const fullName = buildFullName(firstName, paternalLastname, newEmployeeData.maternal_lastname || '');

            setNewEmployeeUserData(prev => ({
                ...prev,
                name: fullName,
                roles: defaultUserRole ? [defaultUserRole] : prev.roles
            }));

            // Generar email automáticamente: nombre.apellido_paterno@dominio
            if (firstName && paternalLastname) {
                const domain = isCustomDomain && customDomain ? customDomain : emailDomain;
                const emailLocal = `${firstName.toLowerCase()}.${paternalLastname.toLowerCase().replace(/\s+/g, '')}${domain}`;
                setNewEmployeeUserData(prev => ({ ...prev, email: emailLocal }));
            }
        }
    }, [createUserForNewEmployee, newEmployeeData.first_name, newEmployeeData.paternal_lastname, newEmployeeData.maternal_lastname, emailDomain, isCustomDomain, customDomain]);

    // Asegurar que siempre tenga un rol válido para el usuario
    useEffect(() => {
        if (!createUserForNewEmployee) {
            return;
        }

        if (!defaultUserRole) {
            toast.error('No hay roles disponibles para crear cuentas de usuario. Solicita a un administrador que configure roles en Spatie.');
            setCreateUserForNewEmployee(false);
            return;
        }

        setNewEmployeeUserData(prev => ({
            ...prev,
            roles: [defaultUserRole]
        }));
    }, [createUserForNewEmployee, defaultUserRole]);

    // Cargar roles disponibles al montar el componente
    useEffect(() => {
        console.log('🚀 Componente montado, cargando roles...');
        loadAvailableRoles();
    }, []);

    // Log para debuggear el estado de availableRoles
    useEffect(() => {
        console.log('📊 Estado actual de availableRoles:', availableRoles);
    }, [availableRoles]);

    // Log para debuggear el estado de editingUserData
    useEffect(() => {
        console.log('👤 Estado actual de editingUserData:', editingUserData);
    }, [editingUserData]);

    // Log para debuggear el estado de editingEmployeeData
    useEffect(() => {
        console.log('👷 Estado actual de editingEmployeeData:', editingEmployeeData);
    }, [editingEmployeeData]);

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
    const loadMissingData = async (showToast: boolean = true) => {
        setLoadingMissingData(true);
        try {
            console.log('Fetching missing data from: /platform-data/employees/missing-data');
            console.log('User authenticated:', !!window.axios.defaults.headers.common['X-CSRF-TOKEN']);
            console.log('CSRF Token:', window.axios.defaults.headers.common['X-CSRF-TOKEN']);

            // Usar axios que maneja automáticamente CSRF y cookies en Laravel
            const response = await window.axios.get('/platform-data/employees/missing-data');

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            console.log('Response data:', response.data);

            if (response.data.success) {
                setMissingDataResponse(response.data.data);
                const totalMissing = response.data.data.stats.total_employees - response.data.data.stats.complete_data;

                // Solo mostrar toast si se solicita explícitamente
                if (showToast) {
                    toast.success(`Datos cargados correctamente. ${totalMissing} funcionarios tienen datos faltantes.`);
                }
            } else {
                throw new Error(response.data.message || 'Error en la respuesta del servidor');
            }
        } catch (error: any) {
            console.error('Error loading missing data:', error);

            // Solo mostrar errores si se solicita el toast
            if (showToast) {
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
                        toast.error(`Error del servidor (${status}): ${error.response.data?.message || 'Error desconocido'}`);
                    }
                } else if (error.request) {
                    // Error de red
                    toast.error('Error de conexión. Verifica tu conexión a internet.');
                } else {
                    // Error de configuración
                    toast.error(`Error al cargar datos faltantes: ${error.message || 'Error desconocido'}`);
                }
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
            // Usar un Map para eliminar duplicados basándose en el ID del empleado
            const uniqueEmployees = new Map<number, EmployeeWithMissingData>();

            // Agregar empleados de todas las categorías, manteniendo solo la primera aparición
            const allCategories = [
                ...missingDataResponse.categories.missing_email,
                ...missingDataResponse.categories.missing_rut,
                ...missingDataResponse.categories.missing_phone,
                ...missingDataResponse.categories.missing_multiple,
            ];

            allCategories.forEach(employee => {
                if (!uniqueEmployees.has(employee.id)) {
                    uniqueEmployees.set(employee.id, employee);
                }
            });

            return Array.from(uniqueEmployees.values());
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

    // Función para abrir formulario de completar datos
    const openCompletionForm = (employee: EmployeeWithMissingData) => {
        setSelectedEmployeeForCompletion(employee);
        // Inicializar formulario solo con campos faltantes
        const formData: { rut?: string; phone?: string; email?: string } = {};
        employee.missing_fields.forEach(field => {
            if (field === 'rut') formData.rut = '';
            if (field === 'phone') formData.phone = '+569';
            if (field === 'email') formData.email = '';
        });
        setCompletionFormData(formData);
    };

    // Función para cerrar formulario de completar datos
    const closeCompletionForm = () => {
        setSelectedEmployeeForCompletion(null);
        setCompletionFormData({});
    };

    // Función para guardar datos completados
    const saveCompletionData = (employeeId: number) => {
        if (!selectedEmployeeForCompletion) {
            toast.error('No se ha seleccionado un funcionario.');
            return;
        }

        setLoadingCompletion(true);
        const employee = selectedEmployeeForCompletion;

        router.put(`/platform-data/employees/${employeeId}`, completionFormData, {
            preserveScroll: true,
            onSuccess: () => {
                closeCompletionForm();

                const employeeName = employee?.name || 'el funcionario';
                const completedFields = employee?.missing_fields.map(field => {
                    if (field === 'rut') return 'RUT';
                    if (field === 'phone') return 'Teléfono';
                    if (field === 'email') return 'Email';
                    return field;
                }).join(', ') || 'datos';

                toast.success(`✅ Datos de ${employeeName} actualizados correctamente (${completedFields})`, {
                    duration: 4000,
                });

                setTimeout(() => {
                    loadMissingData(false);
                }, 500);
            },
            onError: (errors) => {
                console.error('Error saving completion data:', errors);
                const message = errors?.rut?.[0] || errors?.phone?.[0] || errors?.email?.[0] || 'Error al guardar los datos';
                toast.error(message);
            },
            onFinish: () => {
                setLoadingCompletion(false);
            }
        });
    };

    // Inicializar configuración de roles operativos


    const colorPalette = AVAILABLE_COLORS;

    // Función para refrescar roles desde la API
    const refreshRoles = async () => {
        try {
            const response = await fetch('/api/roles');
            const result = await response.json();

            if (result.success && result.data) {
                setData(prev => ({
                    ...prev,
                    roles: result.data
                }));
            }
        } catch (error) {
            console.error('Error al refrescar roles:', error);
        }
    };

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
                        <TabsTrigger value="missing-data" className="flex items-center gap-2 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/30 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300" onClick={() => loadMissingData(true)}>
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
                                                        placeholder="Ej: Patrullaje y Proximidad"
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
                                        <CardTitle>Gestión de Empleados y Usuarios</CardTitle>
                                        <CardDescription>
                                            Gestiona funcionarios, sus datos y cuentas de usuario asociadas
                                        </CardDescription>
                                    </div>
                                    <Button
                                        onClick={() => setIsCreatingEmployee(true)}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Añadir Empleado
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Formulario de creación de empleado */}
                                {isCreatingEmployee && (
                                    <Card className="mb-6 border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Nuevo Empleado</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            {/* Información Personal */}
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Información Personal</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="new-employee-first-name">Nombre</Label>
                                                        <Input
                                                            id="new-employee-first-name"
                                                            value={newEmployeeData.first_name || ''}
                                                            onChange={(e) => setNewEmployeeData(prev => ({ ...prev, first_name: e.target.value }))}
                                                            placeholder="Nombre"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="new-employee-paternal-lastname">Apellido Paterno</Label>
                                                        <Input
                                                            id="new-employee-paternal-lastname"
                                                            value={newEmployeeData.paternal_lastname || ''}
                                                            onChange={(e) => setNewEmployeeData(prev => ({ ...prev, paternal_lastname: e.target.value }))}
                                                            placeholder="Apellido paterno"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="new-employee-maternal-lastname">Apellido Materno</Label>
                                                        <Input
                                                            id="new-employee-maternal-lastname"
                                                            value={newEmployeeData.maternal_lastname || ''}
                                                            onChange={(e) => setNewEmployeeData(prev => ({ ...prev, maternal_lastname: e.target.value }))}
                                                            placeholder="Apellido materno"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="new-employee-rut">RUT</Label>
                                                        <Input
                                                            id="new-employee-rut"
                                                            value={newEmployeeData.rut || ''}
                                                            onChange={(e) => setNewEmployeeData(prev => ({ ...prev, rut: e.target.value }))}
                                                            placeholder="12.345.678-9"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="new-employee-phone">Teléfono</Label>
                                                        <Input
                                                            id="new-employee-phone"
                                                            value={newEmployeeData.phone || ''}
                                                            onChange={(e) => setNewEmployeeData(prev => ({ ...prev, phone: e.target.value }))}
                                                            placeholder="+56 9 1234 5678"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="new-employee-email">Email</Label>
                                                        <Input
                                                            id="new-employee-email"
                                                            type="email"
                                                            value={newEmployeeData.email || ''}
                                                            onChange={(e) => setNewEmployeeData(prev => ({ ...prev, email: e.target.value }))}
                                                            placeholder="email@ejemplo.com"
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
                                                        <Label htmlFor="new-employee-position">Cargo</Label>
                                                        <Input
                                                            id="new-employee-position"
                                                            value={newEmployeeData.position || ''}
                                                            onChange={(e) => setNewEmployeeData(prev => ({ ...prev, position: e.target.value }))}
                                                            placeholder="Ej: Patrullero, Supervisor"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="new-employee-department">Departamento</Label>
                                                        <Input
                                                            id="new-employee-department"
                                                            value={newEmployeeData.department || ''}
                                                            onChange={(e) => setNewEmployeeData(prev => ({ ...prev, department: e.target.value }))}
                                                            placeholder="Ej: Operaciones"
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="new-employee-start-date">Fecha de Inicio</Label>
                                                        <Input
                                                            id="new-employee-start-date"
                                                            type="date"
                                                            value={newEmployeeData.start_date || ''}
                                                            onChange={(e) => setNewEmployeeData(prev => ({ ...prev, start_date: e.target.value }))}
                                                            className="mt-1"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="new-employee-status">Estado</Label>
                                                        <select
                                                            id="new-employee-status"
                                                            value={newEmployeeData.status || 'activo'}
                                                            onChange={(e) => setNewEmployeeData(prev => ({ ...prev, status: e.target.value }))}
                                                            className="w-full p-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white mt-1"
                                                        >
                                                            <option value="activo">Activo</option>
                                                            <option value="inactivo">Inactivo</option>
                                                            <option value="vacaciones">Vacaciones</option>
                                                            <option value="licencia">Licencia</option>
                                                        </select>
                                                    </div>
                                                    <div className="flex items-center space-x-2 pt-6">
                                                        <Checkbox
                                                            id="new-employee-amzoma"
                                                            checked={newEmployeeData.amzoma || false}
                                                            onCheckedChange={(checked) => setNewEmployeeData(prev => ({ ...prev, amzoma: checked === true }))}
                                                        />
                                                        <Label htmlFor="new-employee-amzoma" className="cursor-pointer">
                                                            Es AMZOMA
                                                        </Label>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dirección */}
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dirección</h4>
                                                <div>
                                                    <Label htmlFor="new-employee-address">Dirección</Label>
                                                    <Input
                                                        id="new-employee-address"
                                                        value={newEmployeeData.address || ''}
                                                        onChange={(e) => setNewEmployeeData(prev => ({ ...prev, address: e.target.value }))}
                                                        placeholder="Dirección completa"
                                                        className="mt-1"
                                                    />
                                                </div>
                                            </div>

                                            {/* Rol/Facción */}
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rol/Facción *</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                    {data.roles.map((role) => {
                                                        const isSelected = newEmployeeData.rol_id === role.id;
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
                                                                onClick={() => setNewEmployeeData(prev => ({ ...prev, rol_id: role.id }))}
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
                                                {data.roles.length === 0 && (
                                                    <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                                                        Debes crear al menos un rol antes de añadir empleados
                                                    </p>
                                                )}
                                            </div>

                                            {/* Crear/Vincular Usuario */}
                                            <div className="border-t pt-4">
                                                <div className="flex items-center space-x-2 mb-4">
                                                    <Checkbox
                                                        id="create-user-checkbox"
                                                        checked={createUserForNewEmployee}
                                                        onCheckedChange={(checked) => setCreateUserForNewEmployee(checked === true)}
                                                    />
                                                    <Label htmlFor="create-user-checkbox" className="cursor-pointer text-lg font-semibold">
                                                        Crear cuenta de usuario para este empleado
                                                    </Label>
                                                </div>

                                                {createUserForNewEmployee && (
                                                    <div className="ml-6 space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <Label htmlFor="new-user-name">Nombre de Usuario *</Label>
                                                                <Input
                                                                    id="new-user-name"
                                                                    value={newEmployeeUserData.name}
                                                                    readOnly
                                                                    className="mt-1 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                                                                    placeholder="Se genera automáticamente"
                                                                />
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                    Generado automáticamente desde nombre y apellido paterno
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="new-user-email">Email *</Label>
                                                                <div className="flex gap-2 mt-1">
                                                                    <Input
                                                                        id="new-user-email"
                                                                        type="email"
                                                                        value={newEmployeeUserData.email.split('@')[0] || ''}
                                                                        onChange={(e) => {
                                                                            const localPart = e.target.value.toLowerCase().replace(/\s+/g, '');
                                                                            const domain = isCustomDomain && customDomain ? customDomain : emailDomain;
                                                                            setNewEmployeeUserData(prev => ({
                                                                                ...prev,
                                                                                email: `${localPart}${domain}`
                                                                            }));
                                                                        }}
                                                                        placeholder="nombre.apellido"
                                                                        className="flex-1"
                                                                    />
                                                                    <select
                                                                        value={isCustomDomain ? 'other' : emailDomain}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (value === 'other') {
                                                                                setIsCustomDomain(true);
                                                                                setCustomDomain('');
                                                                            } else {
                                                                                setIsCustomDomain(false);
                                                                                setEmailDomain(value);
                                                                                const localPart = newEmployeeUserData.email.split('@')[0] || '';
                                                                                setNewEmployeeUserData(prev => ({
                                                                                    ...prev,
                                                                                    email: `${localPart}${value}`
                                                                                }));
                                                                            }
                                                                        }}
                                                                        className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                                                    >
                                                                        <option value="@amzoma.cl">@amzoma.cl</option>
                                                                        <option value="@temuco.cl">@temuco.cl</option>
                                                                        <option value="@gmail.com">@gmail.com</option>
                                                                        <option value="@outlook.com">@outlook.com</option>
                                                                        <option value="other">Otro</option>
                                                                    </select>
                                                                </div>
                                                                {isCustomDomain && (
                                                                    <div className="mt-2">
                                                                        <Input
                                                                            type="text"
                                                                            value={customDomain}
                                                                            onChange={(e) => {
                                                                                let domain = e.target.value.trim();
                                                                                if (domain && !domain.startsWith('@')) {
                                                                                    domain = '@' + domain;
                                                                                }
                                                                                setCustomDomain(domain);
                                                                                const localPart = newEmployeeUserData.email.split('@')[0] || '';
                                                                                setNewEmployeeUserData(prev => ({
                                                                                    ...prev,
                                                                                    email: `${localPart}${domain || '@'}`
                                                                                }));
                                                                            }}
                                                                            placeholder="@ejemplo.com"
                                                                            className="w-full"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                    Formato: nombre.apellido_paterno@dominio
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <Label htmlFor="new-user-password">Contraseña *</Label>
                                                                <div className="relative mt-1">
                                                                    <Input
                                                                        id="new-user-password"
                                                                        type={showPassword ? "text" : "password"}
                                                                        value={newEmployeeUserData.password}
                                                                        onChange={(e) => setNewEmployeeUserData(prev => ({ ...prev, password: e.target.value }))}
                                                                        placeholder="Mínimo 8 caracteres"
                                                                        className="pr-10"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowPassword(!showPassword)}
                                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                                                    >
                                                                        {showPassword ? (
                                                                            <EyeOff className="h-4 w-4" />
                                                                        ) : (
                                                                            <Eye className="h-4 w-4" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Label>Rol del Usuario</Label>
                                                                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                                                    <div className="flex items-center space-x-2">
                                                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                                            {defaultUserRole || 'Sin rol disponible'}
                                                                        </Badge>
                                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                            (Asignado automáticamente)
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                                    {defaultUserRole
                                                                        ? `Todos los empleados reciben el rol "${defaultUserRole}" por defecto`
                                                                        : 'Configura un rol en Spatie para poder crear cuentas de usuario'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Botones */}
                                            <div className="flex gap-2 pt-4 border-t">
                                                <Button
                                                    onClick={() => createEmployee(newEmployeeData)}
                                                    disabled={!newEmployeeData.rol_id || data.roles.length === 0}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    Guardar Empleado
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setIsCreatingEmployee(false);
                                                        setCreateUserForNewEmployee(false);
                                                        setShowPassword(false);
                                                        setEmailDomain('@amzoma.cl');
                                                        setCustomDomain('');
                                                        setIsCustomDomain(false);
                                                        setNewEmployeeData({
                                                            rol_id: data.roles[0]?.id || undefined,
                                                            amzoma: false,
                                                            status: 'activo'
                                                        });
                                                        setNewEmployeeUserData({
                                                            name: '',
                                                            email: '',
                                                            password: '',
                                                            roles: ['usuario']
                                                        });
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
                                                                    <span className="flex items-center gap-1">
                                                                        <UserCheck className="h-3 w-3 text-blue-500" />
                                                                        Email: {employee.email}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {employee.user_id && (
                                                            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mb-2">
                                                                <UserCheck className="h-4 w-4" />
                                                                <span>Usuario: {employee.user_name}</span>
                                                                {employee.user_roles && employee.user_roles.length > 0 && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>Roles: {employee.user_roles.join(', ')}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
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
                                                            <Badge
                                                                variant={employee.amzoma ? "default" : "outline"}
                                                                className={`text-xs ${employee.amzoma ? 'bg-green-500 text-white border-green-500' : 'text-gray-600 border-gray-300'}`}
                                                            >
                                                                {employee.amzoma ? 'Amzoma' : 'No Amzoma'}
                                                            </Badge>
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
                                                                        <option value="desvinculado">Desvinculado</option>
                                                                    </select>
                                                                </div>
                                                                <div className="flex items-center space-x-2 pt-6">
                                                                    <Checkbox
                                                                        id={`employee-amzoma-${employee.id}`}
                                                                        checked={editingEmployeeData.amzoma ?? true}
                                                                        onCheckedChange={(checked) => setEditingEmployeeData(prev => ({ ...prev, amzoma: checked === true }))}
                                                                    />
                                                                    <Label htmlFor={`employee-amzoma-${employee.id}`} className="cursor-pointer">
                                                                        Es AMZOMA
                                                                    </Label>
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

                                                        {/* Gestión de Usuario */}
                                                        <div>
                                                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gestión de Usuario</h4>

                                                            {employee.user_id ? (
                                                                // Usuario existente - mostrar opciones de edición
                                                                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                                                                        <UserCheck className="h-5 w-5" />
                                                                        <span className="font-medium">Usuario vinculado: {employee.email}</span>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <div>
                                                                            <Label htmlFor={`user-name-${employee.id}`}>Nombre del Usuario</Label>
                                                                            <Input
                                                                                id={`user-name-${employee.id}`}
                                                                                value={editingUserData.name || employee.user_name || ''}
                                                                                onChange={(e) => setEditingUserData(prev => ({ ...prev, name: e.target.value }))}
                                                                                placeholder="Nombre del usuario"
                                                                                className="mt-1"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <Label htmlFor={`user-email-${employee.id}`}>Email del Usuario</Label>
                                                                            <Input
                                                                                id={`user-email-${employee.id}`}
                                                                                type="email"
                                                                                value={editingUserData.email || employee.email || ''}
                                                                                onChange={(e) => setEditingUserData(prev => ({ ...prev, email: e.target.value }))}
                                                                                placeholder="email@ejemplo.com"
                                                                                className="mt-1"
                                                                            />
                                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                                Email actual del usuario: {employee.email}
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <Label htmlFor={`user-password-${employee.id}`}>Nueva Contraseña (dejar en blanco para no cambiar)</Label>
                                                                            <Input
                                                                                id={`user-password-${employee.id}`}
                                                                                type="password"
                                                                                value={editingUserData.password}
                                                                                onChange={(e) => setEditingUserData(prev => ({ ...prev, password: e.target.value }))}
                                                                                placeholder="Nueva contraseña"
                                                                                className="mt-1"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <Label>Roles del Usuario</Label>
                                                                            {editingUserData.roles.length > 0 && (
                                                                                <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                                                                                    {editingUserData.roles.length} rol(es) seleccionado(s): {editingUserData.roles.join(', ')}
                                                                                </div>
                                                                            )}
                                                                            <div className="mt-2 space-y-2">
                                                                                {availableRoles.length > 0 ? (
                                                                                    availableRoles.map((role) => (
                                                                                        <label key={role} className="flex items-center space-x-2 cursor-pointer">
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={editingUserData.roles.includes(role)}
                                                                                                onChange={(e) => {
                                                                                                    if (e.target.checked) {
                                                                                                        setEditingUserData(prev => ({
                                                                                                            ...prev,
                                                                                                            roles: [...prev.roles, role]
                                                                                                        }));
                                                                                                    } else {
                                                                                                        setEditingUserData(prev => ({
                                                                                                            ...prev,
                                                                                                            roles: prev.roles.filter(r => r !== role)
                                                                                                        }));
                                                                                                    }
                                                                                                }}
                                                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                                            />
                                                                                            <span className="text-sm text-gray-700 dark:text-gray-300">{role}</span>
                                                                                        </label>
                                                                                    ))
                                                                                ) : (
                                                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                                        Cargando roles...
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            onClick={() => updateUser(employee.id)}
                                                                            disabled={loadingUser}
                                                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                                                                        >
                                                                            {loadingUser ? (
                                                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                                            ) : (
                                                                                <Save className="h-4 w-4" />
                                                                            )}
                                                                            Actualizar Usuario
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                // Sin usuario - mostrar opciones de creación
                                                                <div className="space-y-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                                                    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                                                                        <AlertCircle className="h-5 w-5" />
                                                                        <span className="font-medium">Sin usuario vinculado</span>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        <div>
                                                                            <Label htmlFor={`new-user-name-${employee.id}`}>Nombre del Usuario</Label>
                                                                            <Input
                                                                                id={`new-user-name-${employee.id}`}
                                                                                value={editingUserData.name}
                                                                                onChange={(e) => setEditingUserData(prev => ({ ...prev, name: e.target.value }))}
                                                                                placeholder="Nombre del usuario"
                                                                                className="mt-1"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <Label htmlFor={`new-user-email-${employee.id}`}>Email del Usuario</Label>
                                                                            <Input
                                                                                id={`new-user-email-${employee.id}`}
                                                                                type="email"
                                                                                value={editingUserData.email}
                                                                                onChange={(e) => setEditingUserData(prev => ({ ...prev, email: e.target.value }))}
                                                                                placeholder="email@ejemplo.com"
                                                                                className="mt-1"
                                                                            />
                                                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                                Ingresa el email que usará el usuario para acceder a la plataforma
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <Label htmlFor={`new-user-password-${employee.id}`}>Contraseña</Label>
                                                                            <Input
                                                                                id={`new-user-password-${employee.id}`}
                                                                                type="password"
                                                                                value={editingUserData.password}
                                                                                onChange={(e) => setEditingUserData(prev => ({ ...prev, password: e.target.value }))}
                                                                                placeholder="Contraseña del usuario"
                                                                                className="mt-1"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <Label>Roles del Usuario</Label>
                                                                            {editingUserData.roles.length > 0 && (
                                                                                <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                                                                                    {editingUserData.roles.length} rol(es) seleccionado(s): {editingUserData.roles.join(', ')}
                                                                                </div>
                                                                            )}
                                                                            <div className="mt-2 space-y-2">
                                                                                {availableRoles.length > 0 ? (
                                                                                    availableRoles.map((role) => (
                                                                                        <label key={role} className="flex items-center space-x-2 cursor-pointer">
                                                                                            <input
                                                                                                type="checkbox"
                                                                                                checked={editingUserData.roles.includes(role)}
                                                                                                onChange={(e) => {
                                                                                                    if (e.target.checked) {
                                                                                                        setEditingUserData(prev => ({
                                                                                                            ...prev,
                                                                                                            roles: [...prev.roles, role]
                                                                                                        }));
                                                                                                    } else {
                                                                                                        setEditingUserData(prev => ({
                                                                                                            ...prev,
                                                                                                            roles: prev.roles.filter(r => r !== role)
                                                                                                        }));
                                                                                                    }
                                                                                                }}
                                                                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                                            />
                                                                                            <span className="text-sm text-gray-700 dark:text-gray-300">{role}</span>
                                                                                        </label>
                                                                                    ))
                                                                                ) : (
                                                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                                        Cargando roles...
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            onClick={() => createUser(employee.id)}
                                                                            disabled={loadingUser}
                                                                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                                                                        >
                                                                            {loadingUser ? (
                                                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                                            ) : (
                                                                                <Plus className="h-4 w-4" />
                                                                            )}
                                                                            Crear Usuario
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
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
                                        onClick={() => loadMissingData(true)}
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
                                    <div className="flex flex-col items-center justify-center py-8">
                                        <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                                        <p className="text-gray-600 dark:text-gray-400">Cargando datos de funcionarios...</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Esto puede tomar unos segundos</p>
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
                                                    <div className="text-xs text-gray-600">Completado</div>
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
                                                    missingDataResponse.stats.total_employees - missingDataResponse.stats.complete_data
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
                                                    <div key={employee.id}>
                                                        <Card
                                                            className={`border-l-4 cursor-pointer transition-all hover:shadow-md ${selectedEmployeeForCompletion?.id === employee.id ? 'ring-2 ring-blue-500' : ''}`}
                                                            style={{ borderLeftColor: employee.missing_fields.length > 1 ? '#ef4444' : '#f59e0b' }}
                                                            onClick={() => openCompletionForm(employee)}
                                                        >
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
                                                                                {employee.amzoma ? 'Amzoma' : 'Municipal'}
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

                                                        {/* Formulario de completar datos */}
                                                        {selectedEmployeeForCompletion?.id === employee.id && (
                                                            <Card className="mt-2 border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
                                                                <CardHeader>
                                                                    <CardTitle className="text-lg flex items-center justify-between">
                                                                        <span>Completar Datos Faltantes</span>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                closeCompletionForm();
                                                                            }}
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </CardTitle>
                                                                    <CardDescription>
                                                                        Completa solo los campos que faltan para este funcionario
                                                                    </CardDescription>
                                                                </CardHeader>
                                                                <CardContent className="space-y-4">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        {employee.missing_fields.includes('rut') && (
                                                                            <div>
                                                                                <Label htmlFor={`completion-rut-${employee.id}`}>RUT *</Label>
                                                                                <Input
                                                                                    id={`completion-rut-${employee.id}`}
                                                                                    value={completionFormData.rut || ''}
                                                                                    onChange={(e) => setCompletionFormData(prev => ({ ...prev, rut: e.target.value }))}
                                                                                    placeholder="12.345.678-9"
                                                                                    className="mt-1"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                        {employee.missing_fields.includes('phone') && (
                                                                            <div>
                                                                                <Label htmlFor={`completion-phone-${employee.id}`}>Teléfono *</Label>
                                                                                <Input
                                                                                    id={`completion-phone-${employee.id}`}
                                                                                    value={completionFormData.phone || '+569'}
                                                                                    onChange={(e) => {
                                                                                        let value = e.target.value.replace(/\s+/g, '');
                                                                                        if (!value.startsWith('+569')) {
                                                                                            value = '+569' + value.replace(/^\+?56?9?/, '');
                                                                                        }
                                                                                        setCompletionFormData(prev => ({ ...prev, phone: value }));
                                                                                    }}
                                                                                    placeholder="+569XXXXXXXX"
                                                                                    className="mt-1"
                                                                                />
                                                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                                    Todos los teléfonos deben comenzar con +569
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                        {employee.missing_fields.includes('email') && (
                                                                            <div>
                                                                                <Label htmlFor={`completion-email-${employee.id}`}>Email *</Label>
                                                                                <Input
                                                                                    id={`completion-email-${employee.id}`}
                                                                                    type="email"
                                                                                    value={completionFormData.email || ''}
                                                                                    onChange={(e) => setCompletionFormData(prev => ({ ...prev, email: e.target.value }))}
                                                                                    placeholder="email@ejemplo.com"
                                                                                    className="mt-1"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex gap-2 pt-2 border-t">
                                                                        <Button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                saveCompletionData(employee.id);
                                                                            }}
                                                                            disabled={loadingCompletion}
                                                                            className="flex items-center gap-2"
                                                                        >
                                                                            {loadingCompletion ? (
                                                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                                                            ) : (
                                                                                <Save className="h-4 w-4" />
                                                                            )}
                                                                            Guardar Datos
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                closeCompletionForm();
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
                                                    </div>
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
                                                        Completado: {missingDataResponse.stats.completion_percentage}%
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium mb-2">No hay datos cargados</p>
                                        <p className="mb-4">Haz clic en "Actualizar" para cargar los datos de funcionarios con información faltante</p>
                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
                                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                                <strong>Tip:</strong> Esta funcionalidad requiere permisos de administrador y cargará automáticamente todos los funcionarios que tengan datos faltantes como email, RUT o teléfono.
                                            </p>
                                        </div>
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
                                                                {employee.amzoma ? 'Amzoma' : 'Municipal'}
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
