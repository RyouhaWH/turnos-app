import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmployeeStatus } from '@/hooks/useEmployeeStatus';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Activity, AlertTriangle, RefreshCw, UserCheck, UserX, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
        sinTurno: []
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
        sinTurno: { total: 0, byRole: {} }
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalActivos, setTotalActivos] = useState(0);
    const [totalEmpleados, setTotalEmpleados] = useState(0);
    const [roles, setRoles] = useState<Record<number, string>>({});

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
                sinTurno: []
            });
            setCounts({
                trabajando: { total: 0, byRole: {} },
                descanso: { total: 0, byRole: {} },
                ausente: { total: 0, byRole: {} },
                sinTurno: { total: 0, byRole: {} }
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
        loading,
        error,
        refetch: fetchEmployeeStatus
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard v2',
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
        T: { label: 'Tarde' , emoji: '🌇', employees: trabajando.filter((emp) => emp.shift === 'T') },
        N: { label: 'Noche' , emoji: '🌙', employees: trabajando.filter((emp) => emp.shift === 'N') },
    };

    const turnosNumericos = {
        '1': { label: '1er Turno', emoji: '1️⃣', employees: trabajando.filter((emp) => emp.shift === '1') },
        '2': { label: '2do Turno', emoji: '2️⃣', employees: trabajando.filter((emp) => emp.shift === '2') },
        '3': { label: '3er Turno', emoji: '3️⃣', employees: trabajando.filter((emp) => emp.shift === '3') },
    };

    const [showAll, setShowAll] = useState(true);

    return (
        <Card className="h-fit pb-6">
            <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${roleColor}`}>
                    <UserCheck className="h-5 w-5" />
                    {roleName === "Alerta Móvil" ? "Patrullaje y Proximidad" : roleName}
                    <Badge variant="secondary" className="ml-auto text-xs font-light p-2 justify-between items-center">
                        Total:   {trabajando.length}
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
        T: { label: 'Tarde' , emoji: '🌇', employees: trabajando.filter((emp) => emp.shift === 'T') },
        N: { label: 'Noche' , emoji: '🌙', employees: trabajando.filter((emp) => emp.shift === 'N') },
    };

    const turnosNumericos = {
        '1': { label: '1er Turno', emoji: '1️⃣', employees: trabajando.filter((emp) => emp.shift === '1') },
        '2': { label: '2do Turno', emoji: '2️⃣', employees: trabajando.filter((emp) => emp.shift === '2') },
        '3': { label: '3er Turno', emoji: '3️⃣', employees: trabajando.filter((emp) => emp.shift === '3') },
    };

    const [showAll, setShowAll] = useState(true);

    return (
        <Card className="h-fit pb-6">
            <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${roleColor}`}>
                    <UserCheck className="h-5 w-5" />
                    Patrullaje y Proximidad
                    <Badge variant="secondary" className="ml-auto text-xs font-light p-2 justify-between items-center">
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
                                    <TurnoSectionWithIndicator key={turno} title={`${data.emoji} ${data.label}`} employees={data.employees} showAll={showAll} />
                                ),
                        )}

                        {/* Turnos Numéricos */}
                        {Object.entries(turnosNumericos).map(
                            ([turno, data]) =>
                                data.employees.length > 0 && (
                                    <TurnoSectionWithIndicator key={turno} title={`${data.emoji} ${data.label}`} employees={data.employees} showAll={showAll} />
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
            <h5 className="rounded-lg border bg-green-100 flex flex-row justify-center gap-2 items-center px-3 py-2 text-center text-sm font-semibold dark:bg-slate-800/40 dark:text-slate-200">
                {title} <p className="text-xs font-light">({employees.length})</p>
            </h5>
            <div className="space-y-1">
                {displayEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-center gap-2 rounded-md p-2">
                        <span className="text-center text-xs font-medium text-green-900 dark:text-slate-200">
                            {employee.name}
                        </span>
                        <Badge
                            variant="outline"
                            className={`text-xs px-1 py-0 ${
                                Boolean(employee.amzoma)
                                    ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700/50'
                                    : 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50'
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
            <h5 className="rounded-lg border bg-green-100 flex flex-row justify-center gap-2 items-center px-3 py-2 text-center text-sm font-semibold dark:bg-slate-800/40 dark:text-slate-200">
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
    const initialCount = title === "Sin Turno Asignado" ? 4 : 6;
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
                        {title === "Sin Turno Asignado" && employees.length > 4 && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="w-full mt-3 p-2 text-sm text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
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
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // Formato YYYY-MM-DD

    // Hook personalizado para obtener datos de una fecha específica
    const { employeeStatus, counts, totalActivos, totalEmpleados, roles, loading, error, refetch } = useEmployeeStatusWithDate(selectedDate);

    const selectedDateFormatted = new Date(selectedDate).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

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
            <Head title="Dashboard v2" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
                {/* header v2 */}
                <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/80">
                    <div className="px-6 py-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            {/* Title Section */}
                            <div className="flex w-full items-start justify-between gap-4">
                                <div className="flex-1 text-center">
                                    <h1 className="text-2xl font-bold">Plantilla de Funcionarios (v2)</h1>
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

                                <div className="flex items-center gap-4">
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
                        </div>
                    </div>
                </div>

                {/* Total de funcionarios del día */}
                <div className="mx-6 my-8">

                    {/* Desglose de personal por rol */}
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4">
                            Desglose de Personal - {selectedDateFormatted}
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {/* Patrullaje y Proximidad - Todos los turnos */}
                            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <UserCheck className="h-4 w-4 text-red-600 dark:text-red-300" />
                                        <div>
                                            <p className="text-sm font-semibold text-red-700 dark:text-red-200">Patrullaje y Proximidad</p>
                                            <p className="text-xs text-red-600 dark:text-red-300">Todos los turnos</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-red-700 dark:text-red-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 1 && emp.shift === 'M').length}
                                            </p>
                                            <p className="text-xs text-red-600 dark:text-red-300">Mañana</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-red-700 dark:text-red-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 1 && emp.shift === 'T').length}
                                            </p>
                                            <p className="text-xs text-red-600 dark:text-red-300">Tarde</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-red-700 dark:text-red-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 1 && emp.shift === 'N').length}
                                            </p>
                                            <p className="text-xs text-red-600 dark:text-red-300">Noche</p>
                                        </div>
                                    </div>
                                    <div className="text-center pt-3 border-t border-red-200 dark:border-red-700/30">
                                        <p className="text-3xl font-bold text-red-700 dark:text-red-200">
                                            {employeeStatus.trabajando.filter(emp => emp.rol_id === 1).length}
                                        </p>
                                        <p className="text-sm text-red-600 dark:text-red-300">Total</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Fiscalización - Todos los turnos */}
                            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <UserCheck className="h-4 w-4 text-amber-600 dark:text-amber-300" />
                                        <div>
                                            <p className="text-sm font-semibold text-amber-700 dark:text-amber-200">Fiscalización</p>
                                            <p className="text-xs text-amber-600 dark:text-amber-300">Todos los turnos</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-amber-700 dark:text-amber-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 2 && emp.shift === '1').length}
                                            </p>
                                            <p className="text-xs text-amber-600 dark:text-amber-300">1er Turno</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-amber-700 dark:text-amber-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 2 && emp.shift === '2').length}
                                            </p>
                                            <p className="text-xs text-amber-600 dark:text-amber-300">2do Turno</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-amber-700 dark:text-amber-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 2 && emp.shift === '3').length}
                                            </p>
                                            <p className="text-xs text-amber-600 dark:text-amber-300">3er Turno</p>
                                        </div>
                                    </div>
                                    <div className="text-center pt-3 border-t border-amber-200 dark:border-amber-700/30">
                                        <p className="text-3xl font-bold text-amber-700 dark:text-amber-200">
                                            {employeeStatus.trabajando.filter(emp => emp.rol_id === 2).length}
                                        </p>
                                        <p className="text-sm text-amber-600 dark:text-amber-300">Total</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Motorizado - Todos los turnos */}
                            <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                                        <div>
                                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">Motorizado</p>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-300">Todos los turnos</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 3 && emp.shift === '1').length}
                                            </p>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-300">1er Turno</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 3 && emp.shift === '2').length}
                                            </p>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-300">2do Turno</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 3 && emp.shift === '3').length}
                                            </p>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-300">3er Turno</p>
                                        </div>
                                    </div>
                                    <div className="text-center pt-3 border-t border-emerald-200 dark:border-emerald-700/30">
                                        <p className="text-3xl font-bold text-emerald-700 dark:text-emerald-200">
                                            {employeeStatus.trabajando.filter(emp => emp.rol_id === 3).length}
                                        </p>
                                        <p className="text-sm text-emerald-600 dark:text-emerald-300">Total</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Ciclopatrullaje - Todos los turnos */}
                            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                                        <div>
                                            <p className="text-sm font-semibold text-blue-700 dark:text-blue-200">Ciclopatrullaje</p>
                                            <p className="text-xs text-blue-600 dark:text-blue-300">Todos los turnos</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-blue-700 dark:text-blue-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 6 && emp.shift === '1').length}
                                            </p>
                                            <p className="text-xs text-blue-600 dark:text-blue-300">1er Turno</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-blue-700 dark:text-blue-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 6 && emp.shift === '2').length}
                                            </p>
                                            <p className="text-xs text-blue-600 dark:text-blue-300">2do Turno</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-blue-700 dark:text-blue-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 6 && emp.shift === '3').length}
                                            </p>
                                            <p className="text-xs text-blue-600 dark:text-blue-300">3er Turno</p>
                                        </div>
                                    </div>
                                    <div className="text-center pt-3 border-t border-blue-200 dark:border-blue-700/30">
                                        <p className="text-3xl font-bold text-blue-700 dark:text-blue-200">
                                            {employeeStatus.trabajando.filter(emp => emp.rol_id === 6).length}
                                        </p>
                                        <p className="text-sm text-blue-600 dark:text-blue-300">Total</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Dron - Todos los turnos */}
                            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-300" />
                                        <div>
                                            <p className="text-sm font-semibold text-purple-700 dark:text-purple-200">Dron</p>
                                            <p className="text-xs text-purple-600 dark:text-purple-300">Todos los turnos</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-purple-700 dark:text-purple-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 5 && emp.shift === '1').length}
                                            </p>
                                            <p className="text-xs text-purple-600 dark:text-purple-300">1er Turno</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-purple-700 dark:text-purple-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 5 && emp.shift === '2').length}
                                            </p>
                                            <p className="text-xs text-purple-600 dark:text-purple-300">2do Turno</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-purple-700 dark:text-purple-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 5 && emp.shift === '3').length}
                                            </p>
                                            <p className="text-xs text-purple-600 dark:text-purple-300">3er Turno</p>
                                        </div>
                                    </div>
                                    <div className="text-center pt-3 border-t border-purple-200 dark:border-purple-700/30">
                                        <p className="text-3xl font-bold text-purple-700 dark:text-purple-200">
                                            {employeeStatus.trabajando.filter(emp => emp.rol_id === 5).length}
                                        </p>
                                        <p className="text-sm text-purple-600 dark:text-purple-300">Total</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Coordinador Despacho - Todos los turnos */}
                            <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/30">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <UserCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                        <div>
                                            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-200">Coordinador Despacho</p>
                                            <p className="text-xs text-indigo-600 dark:text-indigo-300">Todos los turnos</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-indigo-700 dark:text-indigo-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 8 && emp.shift === '1').length}
                                            </p>
                                            <p className="text-xs text-indigo-600 dark:text-indigo-300">1er Turno</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-indigo-700 dark:text-indigo-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 8 && emp.shift === '2').length}
                                            </p>
                                            <p className="text-xs text-indigo-600 dark:text-indigo-300">2do Turno</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-bold text-indigo-700 dark:text-indigo-200">
                                                {employeeStatus.trabajando.filter(emp => emp.rol_id === 8 && emp.shift === '3').length}
                                            </p>
                                            <p className="text-xs text-indigo-600 dark:text-indigo-300">3er Turno</p>
                                        </div>
                                    </div>
                                    <div className="text-center pt-3 border-t border-indigo-200 dark:border-indigo-700/30">
                                        <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-200">
                                            {employeeStatus.trabajando.filter(emp => emp.rol_id === 8).length}
                                        </p>
                                        <p className="text-sm text-indigo-600 dark:text-indigo-300">Total</p>
                                    </div>
                                </CardContent>
                            </Card>
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
                                return !lowerRoleName.includes('administrativo') &&
                                       !lowerRoleName.includes('servicio') &&
                                       !lowerRoleName.includes('personal de servicio');
                            })
                            .map(([roleId, roleName]) => {
                                const roleIdNum = parseInt(roleId);
                                const roleNameStr = String(roleName);
                                console.log(`Renderizando rol ${roleIdNum} (${roleNameStr}) con ${employeeStatus.trabajando.length} empleados trabajando`);
                                return (
                                    <RoleColumn
                                        key={roleId}
                                        roleId={roleIdNum}
                                        roleName={roleNameStr}
                                        employees={employeeStatus.trabajando}
                                        roleColor="text-red-700 dark:text-red-300"
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
