import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardRoleColors, getTurnoTitleColors } from '@/lib/role-colors';
import React from 'react';

interface RoleCardProps {
    roleId: number;
    roleName: string;
    roleColor: string;
    employees: Array<{
        id: number;
        name: string;
        paternal_lastname?: string;
        rol_id: number;
        amzoma?: boolean;
        shift?: string;
        shift_label?: string;
        reason?: string;
    }>;
    compact?: boolean;
}

export function RoleCard({ roleId, roleName, roleColor, employees, compact = false }: RoleCardProps) {
    // Función para obtener el primer nombre y apellido paterno
    const getDisplayName = (fullName: string, lastName?: string) => {
        const firstName = fullName.split(' ')[0]; // Primer nombre
        const paternalLastName = lastName;
        const result = paternalLastName ? `${firstName} ${paternalLastName}` : firstName;
        return result.trim();
    };

    // Filtrar empleados por rol y solo mostrar los que están trabajando
    const roleEmployees = employees.filter((emp) => emp.rol_id === roleId);

    // Solo empleados trabajando (incluir turnos extras)
    const trabajando = roleEmployees.filter((emp) => emp.shift &&
        ['M', 'T', 'N', '1', '2', '3', 'Me', 'Te', 'Ne', '1e', '2e', '3e', 'ME', 'TE', 'NE', '1E', '2E', '3E'].includes(emp.shift));

    // Función helper para agrupar turnos incluyendo extras (unificados)
    const groupShiftsWithExtras = (employees: any[]) => {
        const turnosMañanaTardeNoche: Record<string, any> = {};
        const turnosNumericos: Record<string, any> = {};

        employees.forEach(emp => {
            if (!emp.shift) return;

            const isExtra = emp.shift.endsWith('e') || emp.shift.endsWith('E');
            const baseShift = isExtra ? emp.shift.slice(0, -1) : emp.shift;

            // Turnos de mañana, tarde, noche
            if (['M', 'T', 'N', 'Me', 'Te', 'Ne', 'ME', 'TE', 'NE'].includes(emp.shift)) {
                const key = baseShift;
                if (!turnosMañanaTardeNoche[key]) {
                    const labels = { M: 'Mañana', T: 'Tarde', N: 'Noche' };
                    const emojis = { M: '🌅', T: '🌇', N: '🌙' };
                    turnosMañanaTardeNoche[key] = {
                        label: labels[key as keyof typeof labels],
                        emoji: emojis[key as keyof typeof emojis],
                        allEmployees: []
                    };
                }
                turnosMañanaTardeNoche[key].allEmployees.push({
                    ...emp,
                    is_extra: isExtra
                });
            }

            // Turnos numéricos
            if (['1', '2', '3', '1e', '2e', '3e', '1E', '2E', '3E'].includes(emp.shift)) {
                const key = baseShift;
                if (!turnosNumericos[key]) {
                    const labels = { '1': '1er Turno', '2': '2do Turno', '3': '3er Turno' };
                    const emojis = { '1': '1️⃣', '2': '2️⃣', '3': '3️⃣' };
                    turnosNumericos[key] = {
                        label: labels[key as keyof typeof labels],
                        emoji: emojis[key as keyof typeof emojis],
                        allEmployees: []
                    };
                }
                turnosNumericos[key].allEmployees.push({
                    ...emp,
                    is_extra: isExtra
                });
            }
        });

        return { turnosMañanaTardeNoche, turnosNumericos };
    };

    // Agrupar por turnos usando la función helper
    const { turnosMañanaTardeNoche, turnosNumericos } = groupShiftsWithExtras(trabajando);

    const [showAll, setShowAll] = React.useState(true);

    // Determinar si la caja está vacía
    const isEmpty = trabajando.length === 0;

    // Determinar la clase de altura
    const getHeightClass = () => {
        if (compact) return 'h-fit';
        if (roleId === 1 || roleId === 2) return 'row-span-2';
        return 'h-full'; // Todas las cajas ocupan todo el espacio disponible
    };

    return (
        <Card className={`w-full border-l-4 ${getDashboardRoleColors(roleColor)} ${getHeightClass()}`}>
            <CardHeader className={compact ? "pb-2" : ""}>
                <CardTitle className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: roleColor }}></div>
                    <span className={`font-semibold ${compact ? "text-sm" : ""}`}>{roleName === 'Alerta Móvil' ? 'Patrullaje y Proximidad' : roleName}</span>
                    <Badge variant="secondary" className={`ml-auto items-center justify-between ${compact ? "p-1 text-xs" : "p-2 text-xs"} font-light`}>
                        Total: {trabajando.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className={compact ? "pt-0" : ""}>
                {trabajando.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Sin personal trabajando</p>
                ) : (
                    <div className={`${compact ? "space-y-2" : "space-y-3"}`}>
                        {/* Turnos Mañana, Tarde, Noche - Ordenados: M, T, N */}
                        {(['M', 'T', 'N'] as const)
                            .filter((turno) => turnosMañanaTardeNoche[turno] && turnosMañanaTardeNoche[turno].allEmployees.length > 0)
                            .map((turno) => {
                                const data = turnosMañanaTardeNoche[turno];
                                return (
                                    <div key={turno} className={`${compact ? "space-y-1" : "space-y-2"}`}>
                                        <h5
                                            className={`flex flex-row items-center justify-center gap-2 rounded-lg border ${compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"} font-semibold ${getTurnoTitleColors(roleColor)}`}
                                        >
                                            {data.emoji} {data.label} <p className={`${compact ? "text-xs" : "text-xs"} font-light`}>({data.allEmployees.length})</p>
                                        </h5>
                                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                            {data.allEmployees.slice(0, showAll ? undefined : 4).map((employee: any) => (
                                                <div
                                                    key={employee.id}
                                                    className={`flex items-center justify-between rounded-md bg-white/50 ${compact ? "p-1" : "p-1.5"} dark:bg-slate-800/50`}
                                                >
                                                    <span className="truncate text-xs font-medium">
                                                        {getDisplayName(employee.name, employee.paternal_lastname)}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        {employee.is_extra && (
                                                            <Badge variant="outline" className="px-1 py-0 text-xs bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700/50">
                                                                EX
                                                            </Badge>
                                                        )}
                                                        <span
                                                            className={`rounded px-1 text-xs ${employee.amzoma ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}
                                                        >
                                                            {employee.amzoma ? 'Amz' : 'Mun'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {!showAll && data.allEmployees.length > 4 && (
                                                <p className="col-span-full text-center text-xs italic opacity-75">
                                                    +{data.allEmployees.length - 4} más...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                        {/* Turnos Numéricos - Ordenados: 1, 2, 3 */}
                        {(['1', '2', '3'] as const)
                            .filter((turno) => turnosNumericos[turno] && turnosNumericos[turno].allEmployees.length > 0)
                            .map((turno) => {
                                const data = turnosNumericos[turno];
                                return (
                                    <div key={turno} className={`${compact ? "space-y-1" : "space-y-2"}`}>
                                        <h5
                                            className={`flex flex-row items-center justify-center gap-2 rounded-lg border ${compact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"} font-semibold ${getTurnoTitleColors(roleColor)}`}
                                        >
                                            {data.emoji} {data.label} <p className={`${compact ? "text-xs" : "text-xs"} font-light`}>({data.allEmployees.length})</p>
                                        </h5>
                                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                            {data.allEmployees.slice(0, showAll ? undefined : 4).map((employee: any) => (
                                                <div
                                                    key={employee.id}
                                                    className={`flex items-center justify-between rounded-md bg-white/50 ${compact ? "p-1" : "p-1.5"} dark:bg-slate-800/50`}
                                                >
                                                    <span className="truncate text-xs font-medium">
                                                        {getDisplayName(employee.name, employee.paternal_lastname)}
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        {employee.is_extra && (
                                                            <Badge variant="outline" className="rounded px-1 py-0 text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-none">
                                                                Extra
                                                            </Badge>
                                                        )}
                                                        <span
                                                            className={`rounded px-1 text-xs ${employee.amzoma ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}
                                                        >
                                                            {employee.amzoma ? 'Amz' : 'Mun'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {!showAll && data.allEmployees.length > 4 && (
                                                <p className="col-span-full text-center text-xs italic opacity-75">
                                                    +{data.allEmployees.length - 4} más...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
