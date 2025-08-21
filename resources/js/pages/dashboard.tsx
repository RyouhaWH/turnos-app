import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Activity, AlertTriangle, RefreshCw, UserCheck, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getDashboardRoleColors } from '@/lib/role-colors';

// Hook personalizado para obtener datos de una fecha específica
const useEmployeeStatusWithDate = (selectedDate: string) => {
    const [employeeStatus, setEmployeeStatus] = useState<{
        trabajando: Array<{
            id: number;
            name: string;
            rol_id: number;
            amzoma?: boolean;
            shift?: string;
            shift_label?: string;
        }>;
        descanso: Array<{
            id: number;
            name: string;
            rol_id: number;
            amzoma?: boolean;
            shift?: string;
            shift_label?: string;
        }>;
        ausente: Array<{
            id: number;
            name: string;
            rol_id: number;
            amzoma?: boolean;
            shift?: string;
            shift_label?: string;
        }>;
        sinTurno: Array<{
            id: number;
            name: string;
            rol_id: number;
            amzoma?: boolean;
            shift?: string;
            shift_label?: string;
        }>;
    }>({
        trabajando: [],
        descanso: [],
        ausente: [],
        sinTurno: [],
    });

    const [counts, setCounts] = useState<{
        trabajando: { total: number; byRole: Record<number, number> };
        descanso: { total: number; byRole: Record<number, number> };
        ausente: { total: number; byRole: Record<number, number> };
        sinTurno: { total: number; byRole: Record<number, number> };
    }>({
        trabajando: { total: 0, byRole: {} },
        descanso: { total: 0, byRole: {} },
        ausente: { total: 0, byRole: {} },
        sinTurno: { total: 0, byRole: {} },
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalActivos, setTotalActivos] = useState(0);
    const [totalEmpleados, setTotalEmpleados] = useState(0);
    const [roles, setRoles] = useState<Record<number, string>>({});
    const [roleColors, setRoleColors] = useState<Record<number, string>>({});

    const fetchEmployeeStatus = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/dashboard/employee-status?date=${selectedDate}`);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success) {
                setEmployeeStatus(data.data.status);
                setCounts(data.data.counts);
                setTotalActivos(data.data.totalActivos);
                setTotalEmpleados(data.data.totalEmpleados);
                setRoles(data.data.roles);
                setRoleColors(data.data.roleColors || {});
            } else {
                setError('Error al cargar estado de empleados del servidor');
            }
        } catch (err) {
            console.error('Error fetching employee status:', err);

            if (err instanceof TypeError && err.message.includes('fetch')) {
                setError('Error de conexión con el servidor');
            } else if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Error desconocido al cargar estado de empleados');
            }

            // Resetear datos en caso de error
            setEmployeeStatus({
                trabajando: [],
                descanso: [],
                ausente: [],
                sinTurno: [],
            });
            setCounts({
                trabajando: { total: 0, byRole: {} },
                descanso: { total: 0, byRole: {} },
                ausente: { total: 0, byRole: {} },
                sinTurno: { total: 0, byRole: {} },
            });
            setTotalActivos(0);
            setTotalEmpleados(0);
            setRoles({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployeeStatus();
    }, [selectedDate]);

    return {
        employeeStatus,
        counts,
        totalActivos,
        totalEmpleados,
        roles,
        roleColors,
        loading,
        error,
        refetch: fetchEmployeeStatus,
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboardv2',
    },
];

// Mapeo de roles a colores
const ROLE_COLORS: Record<number, string> = {
    1: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700/30', // Alerta Móvil - Rojo
    2: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/30', // Fiscalización - Ámbar
    3: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/30', // Motorizado - Esmeralda
};

// Mapeo de tipos de ausencia a colores
const ABSENCE_COLORS: Record<string, string> = {
    'Licencia Médica': 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/50',
    'Licencia Medica': 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700/50',
    Vacaciones: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700/50',
    'Día Sindical': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700/50',
    Administrativo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/50',
    Capacitación: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700/50',
    Permiso: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700/50',
    Suspendido: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700/50',
    Franco: 'bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600/50',
    Descanso: 'bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600/50',
};

// Función para obtener el color de ausencia
const getAbsenceColor = (shiftLabel: string): string => {
    // Buscar coincidencia exacta primero
    if (ABSENCE_COLORS[shiftLabel]) {
        return ABSENCE_COLORS[shiftLabel];
    }

    // Buscar coincidencia parcial para casos como "Licencia Médica por..."
    for (const [key, color] of Object.entries(ABSENCE_COLORS)) {
        if (shiftLabel.toLowerCase().includes(key.toLowerCase())) {
            return color;
        }
    }

    // Color por defecto si no encuentra coincidencia
    return 'bg-gray-100 dark:bg-slate-700/30 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-600/50';
};



// Componente para mostrar empleados por rol
interface RoleColumnProps {
    roleId: number;
    roleName: string;
    employees: Array<{
        id: number;
        name: string;
        rol_id: number;
        amzoma?: boolean;
        shift?: string;
        shift_label?: string;
        reason?: string;
    }>;
    roleColor: string;
}

function RoleColumn({ roleId, roleName, employees, roleColor }: RoleColumnProps) {
    // Si es Alerta Móvil, usar el componente especial
    if (roleId === 1) {
        return <AlertaMovilColumn roleId={roleId} roleName={roleName} employees={employees} roleColor={roleColor} />;
    }

    // Filtrar empleados por rol y solo mostrar los que están trabajando
    const roleEmployees = employees.filter((emp) => emp.rol_id === roleId);

    // Solo empleados trabajando (excluir turno administrativo A)
    const trabajando = roleEmployees.filter((emp) => emp.shift && ['M', 'T', 'N', '1', '2', '3'].includes(emp.shift));

    // Agrupar por turnos
    const turnosMañanaTardeNoche = {
        M: { label: 'Mañana', emoji: '🌅', employees: trabajando.filter((emp) => emp.shift === 'M') },
        T: { label: 'Tarde', emoji: '🌇', employees: trabajando.filter((emp) => emp.shift === 'T') },
        N: { label: 'Noche', emoji: '🌙', employees: trabajando.filter((emp) => emp.shift === 'N') },
    };

    const turnosNumericos = {
        '1': { label: '1er Turno', emoji: '1️⃣', employees: trabajando.filter((emp) => emp.shift === '1') },
        '2': { label: '2do Turno', emoji: '2️⃣', employees: trabajando.filter((emp) => emp.shift === '2') },
        '3': { label: '3er Turno', emoji: '3️⃣', employees: trabajando.filter((emp) => emp.shift === '3') },
    };

    const [showAll, setShowAll] = useState(true);

    return (
        <Card className={`h-fit pb-6 border-l-4 ${getDashboardRoleColors(roleColor)}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: roleColor }}></div>
                    <span className="font-semibold">
                        {roleName === 'Alerta Móvil' ? 'Patrullaje y Proximidad' : roleName}
                    </span>
                    <Badge variant="secondary" className="ml-auto items-center justify-between p-2 text-xs font-light">
                        Total: {trabajando.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {trabajando.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Sin personal trabajando</p>
                ) : (
                    <div className="space-y-3">
                        {/* Turnos Mañana, Tarde, Noche */}
                        {Object.entries(turnosMañanaTardeNoche).map(
                            ([turno, data]) =>
                                data.employees.length > 0 && (
                                    <TurnoSection key={turno} title={`${data.emoji} ${data.label}`} employees={data.employees} showAll={showAll} />
                                ),
                        )}

                        {/* Turnos Numéricos */}
                        {Object.entries(turnosNumericos).map(
                            ([turno, data]) =>
                                data.employees.length > 0 && (
                                    <TurnoSection key={turno} title={`${data.emoji} ${data.label}`} employees={data.employees} showAll={showAll} />
                                ),
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Componente especial para Alerta Móvil con lista unificada
function AlertaMovilColumn({ roleId, roleName, employees, roleColor }: RoleColumnProps) {
    // Filtrar empleados por rol y solo mostrar los que están trabajando
    const roleEmployees = employees.filter((emp) => emp.rol_id === roleId);

    // Solo empleados trabajando (excluir turno administrativo A)
    const trabajando = roleEmployees.filter((emp) => emp.shift && ['M', 'T', 'N', '1', '2', '3'].includes(emp.shift));

    // Agrupar por turnos (lista unificada)
    const turnosMañanaTardeNoche = {
        M: { label: 'Mañana', emoji: '🌅', employees: trabajando.filter((emp) => emp.shift === 'M') },
        T: { label: 'Tarde', emoji: '🌇', employees: trabajando.filter((emp) => emp.shift === 'T') },
        N: { label: 'Noche', emoji: '🌙', employees: trabajando.filter((emp) => emp.shift === 'N') },
    };

    const turnosNumericos = {
        '1': { label: '1er Turno', emoji: '1️⃣', employees: trabajando.filter((emp) => emp.shift === '1') },
        '2': { label: '2do Turno', emoji: '2️⃣', employees: trabajando.filter((emp) => emp.shift === '2') },
        '3': { label: '3er Turno', emoji: '3️⃣', employees: trabajando.filter((emp) => emp.shift === '3') },
    };

    const [showAll, setShowAll] = useState(true);

    return (
        <Card className={`h-fit pb-6 border-l-4 ${getDashboardRoleColors(roleColor)}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: roleColor }}></div>
                    <span className="font-semibold">
                        Patrullaje y Proximidad
                    </span>
                    <Badge variant="secondary" className="ml-auto items-center justify-between p-2 text-xs font-light">
                        Total: {trabajando.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {trabajando.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Sin personal trabajando</p>
                ) : (
                    <div className="space-y-3">
                        {/* Turnos Mañana, Tarde, Noche */}
                        {Object.entries(turnosMañanaTardeNoche).map(
                            ([turno, data]) =>
                                data.employees.length > 0 && (
                                    <TurnoSectionWithIndicator
                                        key={turno}
                                        title={`${data.emoji} ${data.label}`}
                                        employees={data.employees}
                                        showAll={showAll}
                                    />
                                ),
                        )}

                        {/* Turnos Numéricos */}
                        {Object.entries(turnosNumericos).map(
                            ([turno, data]) =>
                                data.employees.length > 0 && (
                                    <TurnoSectionWithIndicator
                                        key={turno}
                                        title={`${data.emoji} ${data.label}`}
                                        employees={data.employees}
                                        showAll={showAll}
                                    />
                                ),
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Componente para mostrar empleados de un turno específico con indicador de empresa
interface TurnoSectionWithIndicatorProps {
    title: string;
    employees: Array<{
        id: number;
        name: string;
        rol_id: number;
        amzoma?: boolean;
        shift?: string;
        shift_label?: string;
    }>;
    showAll: boolean;
}

function TurnoSectionWithIndicator({ title, employees, showAll }: TurnoSectionWithIndicatorProps) {
    const displayEmployees = showAll ? employees : employees.slice(0, 4);

    return (
        <div className="space-y-2">
            <h5 className="flex flex-row items-center justify-center gap-2 rounded-lg border bg-green-100 px-3 py-2 text-center text-sm font-semibold dark:bg-slate-800/40 dark:text-slate-200">
                {title} <p className="text-xs font-light">({employees.length})</p>
            </h5>
            <div className="space-y-1">
                {displayEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-center gap-2 rounded-md p-2">
                        <span className="text-center text-xs font-medium text-green-900 dark:text-slate-200">{employee.name}</span>
                        <Badge
                            variant="outline"
                            className={`px-1 py-0 text-xs ${
                                Boolean(employee.amzoma)
                                    ? 'border-red-300 bg-red-100 text-red-700 dark:border-red-700/50 dark:bg-red-900/30 dark:text-red-300'
                                    : 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700/50 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}
                        >
                            {Boolean(employee.amzoma) ? 'AMZ' : 'MUN'}
                        </Badge>
                    </div>
                ))}
                {!showAll && employees.length > 4 && (
                    <p className="text-center text-xs text-green-600 italic dark:text-slate-400">+{employees.length - 4} más...</p>
                )}
            </div>
        </div>
    );
}

// Componente para mostrar empleados de un turno específico
interface TurnoSectionProps {
    title: string;
    employees: Array<{
        id: number;
        name: string;
        rol_id: number;
        amzoma?: boolean;
        shift?: string;
        shift_label?: string;
    }>;
    showAll: boolean;
}

function TurnoSection({ title, employees, showAll }: TurnoSectionProps) {
    const displayEmployees = showAll ? employees : employees.slice(0, 4);

    return (
        <div className="space-y-2">
            <h5 className="flex flex-row items-center justify-center gap-2 rounded-lg border bg-green-100 px-3 py-2 text-center text-sm font-semibold dark:bg-slate-800/40 dark:text-slate-200">
                {title} <p className="text-xs font-light">({employees.length})</p>
            </h5>
            <div className="space-y-1">
                {displayEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-center rounded-md p-2">
                        <span className="text-center text-xs font-medium text-green-900 dark:text-slate-200">{employee.name}</span>
                    </div>
                ))}
                {!showAll && employees.length > 4 && (
                    <p className="text-center text-xs text-green-600 italic dark:text-slate-400">+{employees.length - 4} más...</p>
                )}
            </div>
        </div>
    );
}

// Componente para mostrar empleados ausentes y sin turno
interface BottomSectionProps {
    employees: Array<{
        id: number;
        name: string;
        rol_id: number;
        amzoma?: boolean;
        shift?: string;
        shift_label?: string;
        reason?: string;
    }>;
    title: string;
    icon: React.ReactNode;
    emptyMessage: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    roles: Record<number, string>;
}

function BottomSection({ employees, title, icon, emptyMessage, bgColor, borderColor, textColor, roles }: BottomSectionProps) {
    const [showAll, setShowAll] = useState(false);

    // Para "Sin Turno Asignado" mostrar solo 4, para otros mostrar 6
    const initialCount = title === 'Sin Turno Asignado' ? 4 : 6;
    const displayEmployees = showAll ? employees : employees.slice(0, initialCount);

    return (
        <Card>
            <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${textColor}`}>
                    {icon}
                    {title}
                    <Badge variant="secondary" className="ml-auto">
                        {employees.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {employees.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
                ) : (
                    <div className="space-y-2 pb-8">
                        {displayEmployees.map((employee) => (
                            <div key={employee.id} className={`flex items-center justify-between rounded-lg p-2 ${bgColor} border ${borderColor}`}>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-slate-200">{employee.name}</span>
                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${ROLE_COLORS[employee.rol_id] || 'bg-gray-100 text-gray-800 dark:bg-slate-700/30 dark:text-slate-300'}`}
                                    >
                                        {roles[employee.rol_id] || `Rol ${employee.rol_id}`}
                                    </Badge>
                                </div>
                                {employee.shift_label && (
                                    <Badge variant="outline" className={`text-xs font-medium ${getAbsenceColor(employee.shift_label)}`}>
                                        {employee.shift_label}
                                    </Badge>
                                )}
                                {employee.reason && <span className="text-xs text-muted-foreground dark:text-slate-400">{employee.reason}</span>}
                            </div>
                        ))}

                        {/* Botón dropdown solo para "Sin Turno Asignado" */}
                        {title === 'Sin Turno Asignado' && employees.length > 4 && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="mt-3 w-full rounded-lg border border-gray-200 p-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700/30 dark:hover:text-slate-200"
                            >
                                {showAll ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span>Ocultar empleados</span>
                                        <span className="text-xs">({employees.length - 4} menos)</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <span>Ver todos los empleados</span>
                                        <span className="text-xs">({employees.length - 4} más)</span>
                                    </span>
                                )}
                            </button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function DashboardV2() {
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }); // Formato YYYY-MM-DD

    // Hook personalizado para obtener datos de una fecha específica
    const { employeeStatus, counts, totalActivos, totalEmpleados, roles, roleColors, loading, error, refetch } = useEmployeeStatusWithDate(selectedDate);

    const selectedDateFormatted = (() => {
        const [year, month, day] = selectedDate.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month - 1 porque getMonth() devuelve 0-11
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    })();

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard v2" />
                <div className="flex h-64 items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Cargando estado de empleados...</span>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
                {/* header v2 */}
                <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/80 relative py-10">
                    <div className="px-6 py-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            {/* Title Section */}
                            <div className="flex w-full items-center justify-center gap-4 flex-col md:flex-row">

                                <div className="flex-1 text-center md:absolute left-0 right-0">
                                    <h1 className="text-2xl font-bold">Dotación diaria de fuerza operativa</h1>
                                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500">
                                        <Activity className="h-4 w-4" />
                                        <span>{selectedDateFormatted}</span>
                                        {loading && (
                                            <div className="ml-2 flex items-center gap-1">
                                                <RefreshCw className="h-3 w-3 animate-spin" />
                                                <span className="text-xs">Actualizando...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Caja de Total de Dotación */}
                                <div className="flex items-center gap-4 md:absolute right-6">
                                    <div className="flex gap-3">
                                        {/* Caja de Dotación Activa */}
                                        <Card className="border-green-200 bg-green-50 shadow-lg dark:border-green-700/30 dark:bg-green-900/20">
                                            <CardContent className="pt-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-full bg-green-100 p-2 dark:bg-green-800/30">
                                                        <UserCheck className="h-5 w-5 text-green-600 dark:text-green-300" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium text-green-700 dark:text-green-200">Dotación Activa Hoy</p>
                                                        <div className="flex items-baseline gap-1">
                                                            <p className="text-2xl font-bold text-green-700 dark:text-green-200">
                                                                {
                                                                    employeeStatus.trabajando.filter(
                                                                        (emp) => emp.shift && !['F', 'L', 'V', 'C', 'S'].includes(emp.shift),
                                                                    ).length
                                                                }
                                                            </p>
                                                            <p className="text-sm text-green-600 dark:text-green-300">/ {totalEmpleados}</p>
                                                        </div>
                                                        <p className="text-xs text-green-600 dark:text-green-300">Total por plantilla hoy</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Caja de Porcentaje de Dotación */}
                                        {/* <Card className="border-blue-200 bg-blue-50 shadow-lg dark:border-blue-700/30 dark:bg-blue-900/20">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-800/30">
                                                        <Activity className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-sm font-medium text-blue-700 dark:text-blue-200">Cobertura</p>
                                                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">
                                                            {totalEmpleados > 0
                                                                ? Math.round(
                                                                      (employeeStatus.trabajando.filter(
                                                                          (emp) => emp.shift && !['F', 'L', 'V', 'C', 'S'].includes(emp.shift),
                                                                      ).length /
                                                                          totalEmpleados) *
                                                                          100,
                                                                  )
                                                                : 0}
                                                            %
                                                        </p>
                                                        <p className="text-xs text-blue-600 dark:text-blue-300">Dotación activa</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total de funcionarios del día */}
                <div className="mx-6 my-8">
                    {/* Desglose de personal por rol */}
                    <div className="mb-6">
                        <div className="mb-4 flex items-center justify-between px-4 flex-col md:flex-row">
                            <h2 className="mb-4 text-xl font-semibold text-gray-700 dark:text-slate-200">
                                Desglose de Personal - {selectedDateFormatted}
                            </h2>

                            <div className="flex items-center justify-baseline gap-2">
                                {/* Selector de fecha */}
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="date-selector" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Fecha:
                                    </Label>
                                    <Input
                                        id="date-selector"
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-40"
                                    />
                                </div>

                                <button
                                    onClick={refetch}
                                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Actualizar
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                            {Object.entries(roles)
                                .filter(([roleId, roleName]) => {
                                    const lowerRoleName = roleName.toLowerCase();
                                    return (
                                        !lowerRoleName.includes('administrativo') &&
                                        !lowerRoleName.includes('servicio') &&
                                        !lowerRoleName.includes('personal de servicio')
                                    );
                                })
                                .map(([roleId, roleName]) => {
                                    const roleIdNum = parseInt(roleId);
                                    const roleColor = roleColors[roleIdNum] || '#3B82F6';
                                    const colorClasses = getDashboardRoleColors(roleColor);

                                    // Determinar los turnos según el rol
                                    const getShiftsForRole = (roleId: number) => {
                                        if (roleId === 1) { // Alerta Móvil/Patrullaje usa M, T, N
                                            return [
                                                { shift: 'M', label: 'Mañana' },
                                                { shift: 'T', label: 'Tarde' },
                                                { shift: 'N', label: 'Noche' }
                                            ];
                                        } else { // Otros roles usan 1, 2, 3
                                            return [
                                                { shift: '1', label: '1er Turno' },
                                                { shift: '2', label: '2do Turno' },
                                                { shift: '3', label: '3er Turno' }
                                            ];
                                        }
                                    };

                                    const shifts = getShiftsForRole(roleIdNum);
                                    const displayName = roleName === "Alerta Móvil" ? "Patrullaje y Proximidad" : roleName;

                                    return (
                                        <Card key={roleId} className={colorClasses}>
                                            <CardContent className="p-4">
                                                <div className="mb-3 flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: roleColor }}></div>
                                                    <div>
                                                        <p className="text-sm font-semibold">{displayName}</p>
                                                        <p className="text-xs opacity-75">Todos los turnos</p>
                                                    </div>
                                                </div>
                                                <div className="mb-3 grid grid-cols-3 gap-2">
                                                    {shifts.map((shiftInfo) => (
                                                        <div key={shiftInfo.shift} className="text-center">
                                                            <p className="text-lg font-bold">
                                                                {employeeStatus.trabajando.filter((emp) =>
                                                                    emp.rol_id === roleIdNum && emp.shift === shiftInfo.shift
                                                                ).length}
                                                            </p>
                                                            <p className="text-xs opacity-75">{shiftInfo.label}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="border-t pt-3 text-center" style={{ borderColor: roleColor + '40' }}>
                                                    <p className="text-3xl font-bold">
                                                        {employeeStatus.trabajando.filter((emp) => emp.rol_id === roleIdNum).length}
                                                    </p>
                                                    <p className="text-sm opacity-75">Total</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                        </div>
                    </div>
                </div>

                <div className="mx-6 my-8">
                    {/* Error message */}
                    {error && (
                        <div className="mx-6 rounded-lg border border-red-200 bg-red-50 p-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Columnas principales por roles - Solo trabajando */}
                    <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {Object.entries(roles)
                            .filter(([roleId, roleName]) => {
                                const lowerRoleName = roleName.toLowerCase();
                                return (
                                    !lowerRoleName.includes('administrativo') &&
                                    !lowerRoleName.includes('servicio') &&
                                    !lowerRoleName.includes('personal de servicio')
                                );
                            })
                            .map(([roleId, roleName]) => {
                                const roleIdNum = parseInt(roleId);
                                const roleNameStr = String(roleName);
                                console.log(
                                    `Renderizando rol ${roleIdNum} (${roleNameStr}) con ${employeeStatus.trabajando.length} empleados trabajando`,
                                );
                                return (
                                    <RoleColumn
                                        key={roleId}
                                        roleId={roleIdNum}
                                        roleName={roleNameStr}
                                        roleColor={roleColors[roleIdNum] || '#3B82F6'}
                                        employees={employeeStatus.trabajando}
                                    />
                                );
                            })}
                    </div>

                    {/* Sección inferior: Ausentes y Sin Turno */}
                    <div className="space-y-4">
                        <h2 className="border-b pb-2 text-xl font-semibold text-gray-700 dark:border-slate-600/50 dark:text-slate-200">
                            Estado Especial del Personal
                        </h2>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <BottomSection
                                employees={employeeStatus.ausente}
                                title="Ausente"
                                icon={<AlertTriangle className="h-5 w-5" />}
                                emptyMessage="No hay empleados ausentes hoy"
                                bgColor="bg-red-50 dark:bg-slate-800/25"
                                borderColor="border-red-200 dark:border-slate-600/40"
                                textColor="text-red-700 dark:text-slate-300"
                                roles={roles}
                            />

                            <BottomSection
                                employees={employeeStatus.sinTurno}
                                title="Sin Turno Asignado"
                                icon={<UserX className="h-5 w-5" />}
                                emptyMessage="Todos los empleados tienen turno asignado"
                                bgColor="bg-gray-50 dark:bg-slate-800/25"
                                borderColor="border-gray-200 dark:border-slate-600/40"
                                textColor="text-gray-700 dark:text-slate-300"
                                roles={roles}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
