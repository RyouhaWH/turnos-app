import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmployeeStatus } from '@/hooks/useEmployeeStatus';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Activity, AlertTriangle, RefreshCw, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Mapeo de roles - ahora se obtiene dinámicamente desde la API

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

// Componente especial para Alerta Móvil que separa por empresa
function AlertaMovilColumn({ roleId, roleName, employees, roleColor }: RoleColumnProps) {
    // Debug: Log para ver qué datos llegan
    console.log('AlertaMovilColumn - roleId:', roleId);
    console.log('AlertaMovilColumn - employees:', employees);

    // Filtrar empleados por rol y solo mostrar los que están trabajando
    const roleEmployees = employees.filter((emp) => emp.rol_id === roleId);
    console.log('AlertaMovilColumn - roleEmployees:', roleEmployees);
    console.log('AlertaMovilColumn - Total empleados recibidos:', employees.length);
    console.log('AlertaMovilColumn - Empleados por rol_id:', employees.reduce((acc, emp) => {
        acc[emp.rol_id] = (acc[emp.rol_id] || 0) + 1;
        return acc;
    }, {} as Record<number, number>));

    // Solo empleados trabajando (excluir turno administrativo A)
    const trabajando = roleEmployees.filter((emp) => emp.shift && ['M', 'T', 'N', '1', '2', '3'].includes(emp.shift));
    console.log('AlertaMovilColumn - trabajando:', trabajando);

    // Debug: Mostrar también todos los empleados del rol para verificar
    console.log('AlertaMovilColumn - TODOS los empleados del rol:', roleEmployees);

    // Debug: Ver valores de amzoma para cada empleado
    console.log('AlertaMovilColumn - Valores de amzoma por empleado:');
    trabajando.forEach(emp => {
        console.log(`  ${emp.name}: amzoma = ${emp.amzoma} (tipo: ${typeof emp.amzoma})`);
    });

    // Separar por empresa - usar comparación más flexible para boolean
    const amzomaEmployees = trabajando.filter((emp) => Boolean(emp.amzoma));
    const noAmzomaEmployees = trabajando.filter((emp) => !Boolean(emp.amzoma));
    console.log('AlertaMovilColumn - amzomaEmployees:', amzomaEmployees);
    console.log('AlertaMovilColumn - noAmzomaEmployees:', noAmzomaEmployees);

    // Agrupar por turnos para cada empresa
    const agruparPorTurnos = (empleados: typeof trabajando) => {
        const turnosMañanaTardeNoche = {
            M: { label: 'Mañana', emoji: '🌅', employees: empleados.filter((emp) => emp.shift === 'M') },
            T: { label: 'Tarde' , emoji: '🌇', employees: empleados.filter((emp) => emp.shift === 'T') },
            N: { label: 'Noche' , emoji: '🌙', employees: empleados.filter((emp) => emp.shift === 'N') },
        };

        const turnosNumericos = {
            '1': { label: '1er Turno', emoji: '1️⃣', employees: empleados.filter((emp) => emp.shift === '1') },
            '2': { label: '2do Turno', emoji: '2️⃣', employees: empleados.filter((emp) => emp.shift === '2') },
            '3': { label: '3er Turno', emoji: '3️⃣', employees: empleados.filter((emp) => emp.shift === '3') },
        };

        return { turnosMañanaTardeNoche, turnosNumericos };
    };

    const amzomaTurnos = agruparPorTurnos(amzomaEmployees);
    const noAmzomaTurnos = agruparPorTurnos(noAmzomaEmployees);

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
                    <div className="space-y-6">
                        {/* Tabla con dos columnas */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Columna izquierda - No AMZOMA */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 border-b border-blue-200 pb-1">
                                    Personal Municipal ({noAmzomaEmployees.length})
                                </h4>
                                {noAmzomaEmployees.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">Sin personal municipal trabajando</p>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Turnos Mañana, Tarde, Noche */}
                                        {Object.entries(noAmzomaTurnos.turnosMañanaTardeNoche).map(
                                            ([turno, data]) =>
                                                data.employees.length > 0 && (
                                                    <TurnoSection key={turno} title={`${data.emoji} ${data.label}`} employees={data.employees} showAll={showAll} />
                                                ),
                                        )}

                                        {/* Turnos Numéricos */}
                                        {Object.entries(noAmzomaTurnos.turnosNumericos).map(
                                            ([turno, data]) =>
                                                data.employees.length > 0 && (
                                                    <TurnoSection key={turno} title={`${data.emoji} ${data.label}`} employees={data.employees} showAll={showAll} />
                                                ),
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Columna derecha - AMZOMA */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 border-b border-red-200 pb-1">
                                    Personal AMZOMA ({amzomaEmployees.length})
                                </h4>
                                {amzomaEmployees.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">Sin personal AMZOMA trabajando</p>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Turnos Mañana, Tarde, Noche */}
                                        {Object.entries(amzomaTurnos.turnosMañanaTardeNoche).map(
                                            ([turno, data]) =>
                                                data.employees.length > 0 && (
                                                    <TurnoSection key={turno} title={`${data.emoji} ${data.label}`} employees={data.employees} showAll={showAll} />
                                                ),
                                        )}

                                        {/* Turnos Numéricos */}
                                        {Object.entries(amzomaTurnos.turnosNumericos).map(
                                            ([turno, data]) =>
                                                data.employees.length > 0 && (
                                                    <TurnoSection key={turno} title={`${data.emoji} ${data.label}`} employees={data.employees} showAll={showAll} />
                                                ),
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
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

export default function Dashboard() {
    const { employeeStatus, counts, totalActivos, totalEmpleados, roles, loading, error, refetch } = useEmployeeStatus();

    const today = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
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
                <div className="border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-900/80">
                    <div className="px-6 py-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            {/* Title Section */}
                            <div className="flex w-full items-start justify-between gap-4">
                                <div className="flex-1 text-center">
                                    <h1 className="text-2xl font-bold">Plantilla de Funcionarios para el Día de Hoy</h1>
                                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500">
                                        <Activity className="h-4 w-4" />
                                        <span>{new Date().toLocaleDateString('es-CL', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</span>
                                        {loading && (
                                            <div className="ml-2 flex items-center gap-1">
                                                <RefreshCw className="h-3 w-3 animate-spin" />
                                                <span className="text-xs">Actualizando...</span>
                                            </div>
                                        )}
                                    </div>
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

                {/* Resumen por roles */}
                {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/30">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-red-600 dark:text-red-300" />
                                <div>
                                    <p className="text-2xl font-bold text-red-700 dark:text-red-200">
                                        {counts.trabajando.byRole[1] || 0}
                                    </p>
                                    <p className="text-sm text-red-600 dark:text-red-300">Alerta Móvil</p>
                                    <p className="text-xs text-red-500 dark:text-red-400">
                                        trabajando hoy
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/30">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-amber-600 dark:text-amber-300" />
                                <div>
                                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-200">
                                        {counts.trabajando.byRole[2] || 0}
                                    </p>
                                    <p className="text-sm text-amber-600 dark:text-amber-300">Fiscalización</p>
                                    <p className="text-xs text-amber-500 dark:text-amber-400">
                                        trabajando hoy
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/30">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Coffee className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                                <div>
                                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-200">
                                        {counts.trabajando.byRole[3] || 0}
                                    </p>
                                    <p className="text-sm text-emerald-600 dark:text-emerald-300">Motorizado</p>
                                    <p className="text-xs text-emerald-500 dark:text-emerald-400">
                                        trabajando hoy
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gray-50 dark:bg-slate-800/30 border-gray-200 dark:border-slate-600/40">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-gray-600 dark:text-slate-300" />
                                <div>
                                    <p className="text-2xl font-bold text-gray-700 dark:text-slate-100">{counts.trabajando.total}</p>
                                    <p className="text-sm text-gray-600 dark:text-slate-300">Total Trabajando</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400">
                                        de {totalEmpleados} empleados
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div> */}
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
                                console.log(`Renderizando rol ${roleId} (${roleName}) con ${employeeStatus.trabajando.length} empleados trabajando`);
                                return (
                                    <RoleColumn
                                        key={roleId}
                                        roleId={parseInt(roleId)}
                                        roleName={roleName}
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
