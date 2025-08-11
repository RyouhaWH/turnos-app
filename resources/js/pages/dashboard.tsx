import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEmployeeStatus } from '@/hooks/useEmployeeStatus';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { RefreshCw, Users, UserCheck, Coffee, AlertTriangle, UserX } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Mapeo de roles
const ROLE_NAMES: Record<number, string> = {
    1: 'Alerta Móvil',
    2: 'Fiscalización',
    3: 'Motorizado'
};

// Mapeo de roles a colores
const ROLE_COLORS: Record<number, string> = {
    1: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700/30',      // Alerta Móvil - Rojo
    2: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/30', // Fiscalización - Ámbar
    3: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/30' // Motorizado - Esmeralda
};

// Componente para mostrar empleados por rol
interface RoleColumnProps {
    roleId: number;
    roleName: string;
    employees: Array<{
        id: number;
        name: string;
        rol_id: number;
        shift?: string;
        shift_label?: string;
        reason?: string;
    }>;
    roleColor: string;
}

function RoleColumn({ roleId, roleName, employees, roleColor }: RoleColumnProps) {
    // Filtrar empleados por rol y solo mostrar los que están trabajando
    const roleEmployees = employees.filter(emp => emp.rol_id === roleId);

    // Solo empleados trabajando (no mostrar descanso)
    const trabajando = roleEmployees.filter(emp =>
        emp.shift && ['M', 'T', 'N', '1', '2', '3', 'A'].includes(emp.shift)
    );

    // Agrupar por turnos
    const turnosMañanaTardeNoche = {
        'M': { label: 'Mañana', emoji: '🌅', employees: trabajando.filter(emp => emp.shift === 'M') },
        'T': { label: 'Tarde',  emoji: '🌇', employees: trabajando.filter(emp => emp.shift === 'T') },
        'N': { label: 'Noche',  emoji: '🌙', employees: trabajando.filter(emp => emp.shift === 'N') },
    };

    const turnosNumericos = {
        '1': { label: '1er Turno', emoji: '1️⃣', employees: trabajando.filter(emp => emp.shift === '1') },
        '2': { label: '2do Turno', emoji: '2️⃣', employees: trabajando.filter(emp => emp.shift === '2') },
        '3': { label: '3er Turno', emoji: '3️⃣', employees: trabajando.filter(emp => emp.shift === '3') }
    };

    const turnoAdministrativo = {
        'A': { label: 'Administrativo', emoji: '💼', employees: trabajando.filter(emp => emp.shift === 'A') }
    };

    const [showAll, setShowAll] = useState(false);

    return (
        <Card className="h-fit pb-6">
            <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${roleColor}`}>
                    <UserCheck className="h-5 w-5" />
                    {roleName}
                    <Badge variant="secondary" className="ml-auto">
                        {trabajando.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {trabajando.length === 0 ? (
                    <p className="text-muted-foreground text-xs italic">Sin personal trabajando</p>
                ) : (
                    <div className="space-y-3">
                        {/* Turnos Mañana, Tarde, Noche */}
                        {Object.entries(turnosMañanaTardeNoche).map(([turno, data]) =>
                            data.employees.length > 0 && (
                                <TurnoSection
                                    key={turno}
                                    title={`${data.emoji} ${data.label}`}
                                    employees={data.employees}
                                    showAll={showAll}
                                />
                            )
                        )}

                        {/* Turnos Numéricos */}
                        {Object.entries(turnosNumericos).map(([turno, data]) =>
                            data.employees.length > 0 && (
                                <TurnoSection
                                    key={turno}
                                    title={`${data.emoji} ${data.label}`}
                                    employees={data.employees}
                                    showAll={showAll}
                                />
                            )
                        )}

                        {/* Turno Administrativo */}
                        {turnoAdministrativo.A.employees.length > 0 && (
                            <TurnoSection
                                title={`${turnoAdministrativo.A.emoji} ${turnoAdministrativo.A.label}`}
                                employees={turnoAdministrativo.A.employees}
                                showAll={showAll}
                            />
                        )}

                        {trabajando.length > 8 && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="text-xs text-primary hover:underline mt-2"
                            >
                                {showAll ? 'Ver menos' : `Ver ${trabajando.length - 8} más...`}
                            </button>
                        )}
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
        shift?: string;
        shift_label?: string;
    }>;
    showAll: boolean;
}

function TurnoSection({ title, employees, showAll }: TurnoSectionProps) {
    const displayEmployees = showAll ? employees : employees.slice(0, 4);

    return (
        <div className="space-y-2">
            <h5 className="font-semibold text-sm text-green-700 dark:text-slate-200 text-center bg-green-100 dark:bg-slate-800/40 py-2 px-3 rounded-lg border border-green-200 dark:border-slate-600/40">
                {title} ({employees.length})
            </h5>
            <div className="space-y-1">
                {displayEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-center p-2 rounded-md bg-green-50 dark:bg-slate-800/20 border border-green-200 dark:border-slate-700/40">
                        <span className="font-medium text-xs text-green-900 dark:text-slate-200 text-center">{employee.name}</span>
                    </div>
                ))}
                {!showAll && employees.length > 4 && (
                    <p className="text-xs text-green-600 dark:text-slate-400 text-center italic">
                        +{employees.length - 4} más...
                    </p>
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
}

function BottomSection({ employees, title, icon, emptyMessage, bgColor, borderColor, textColor }: BottomSectionProps) {
    const [showAll, setShowAll] = useState(false);
    const displayEmployees = showAll ? employees : employees.slice(0, 6);

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
                    <p className="text-muted-foreground text-sm italic">{emptyMessage}</p>
                ) : (
                    <div className="space-y-2">
                                                                        {displayEmployees.map((employee) => (
                            <div key={employee.id} className={`flex items-center justify-between p-2 rounded-lg ${bgColor} border ${borderColor}`}>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-gray-900 dark:text-slate-200">{employee.name}</span>
                                                                        <Badge
                                        variant="outline"
                                        className={`text-xs ${ROLE_COLORS[employee.rol_id] || 'bg-gray-100 dark:bg-slate-700/30 text-gray-800 dark:text-slate-300'}`}
                                    >
                                        {ROLE_NAMES[employee.rol_id] || `Rol ${employee.rol_id}`}
                                    </Badge>
                                </div>
                                {employee.shift_label && (
                                    <Badge variant="secondary" className="text-xs dark:bg-slate-700/50 dark:text-slate-300">
                                        {employee.shift_label}
                                    </Badge>
                                )}
                                {employee.reason && (
                                    <span className="text-xs text-muted-foreground dark:text-slate-400">{employee.reason}</span>
                                )}
                            </div>
                        ))}
                        {employees.length > 6 && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="text-sm text-primary hover:underline mt-2"
                            >
                                {showAll ? 'Ver menos' : `Ver ${employees.length - 6} más...`}
                            </button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function Dashboard() {
    const {
        employeeStatus,
        counts,
        totalActivos,
        totalEmpleados,
        loading,
        error,
        refetch
    } = useEmployeeStatus();

    const today = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    if (loading) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Dashboard" />
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Cargando estado de empleados...</span>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 overflow-x-auto bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Dashboard - Estado de Personal</h1>
                        <p className="text-muted-foreground capitalize">{today}</p>
                    </div>
                    <button
                        onClick={refetch}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Actualizar
                    </button>
                </div>

                {/* Resumen por roles */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                </div>

                {/* Error message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 text-sm">{error}</p>
                    </div>
                )}

                                                {/* Columnas principales por roles - Solo trabajando */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <RoleColumn
                        roleId={1}
                        roleName="Alerta Móvil"
                        employees={employeeStatus.trabajando}
                        roleColor="text-red-700 dark:text-red-300"
                    />

                    <RoleColumn
                        roleId={2}
                        roleName="Fiscalización"
                        employees={employeeStatus.trabajando}
                        roleColor="text-amber-700 dark:text-amber-300"
                    />

                    <RoleColumn
                        roleId={3}
                        roleName="Motorizado"
                        employees={employeeStatus.trabajando}
                        roleColor="text-emerald-700 dark:text-emerald-300"
                    />
                </div>

                                {/* Sección inferior: Ausentes y Sin Turno */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 border-b dark:border-slate-600/50 pb-2">
                        Estado Especial del Personal
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <BottomSection
                            employees={employeeStatus.ausente}
                            title="Ausente"
                            icon={<AlertTriangle className="h-5 w-5" />}
                            emptyMessage="No hay empleados ausentes hoy"
                            bgColor="bg-red-50 dark:bg-slate-800/25"
                            borderColor="border-red-200 dark:border-slate-600/40"
                            textColor="text-red-700 dark:text-slate-300"
                        />

                        <BottomSection
                            employees={employeeStatus.sinTurno}
                            title="Sin Turno Asignado"
                            icon={<UserX className="h-5 w-5" />}
                            emptyMessage="Todos los empleados tienen turno asignado"
                            bgColor="bg-gray-50 dark:bg-slate-800/25"
                            borderColor="border-gray-200 dark:border-slate-600/40"
                            textColor="text-gray-700 dark:text-slate-300"
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
