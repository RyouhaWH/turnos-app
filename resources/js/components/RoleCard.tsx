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
}

export function RoleCard({ roleId, roleName, roleColor, employees }: RoleCardProps) {
    // Función para obtener el primer nombre y apellido paterno
    const getDisplayName = (fullName: string, lastName?: string) => {
        const firstName = fullName.split(' ')[0]; // Primer nombre
        const paternalLastName = lastName;
        const result = paternalLastName ? `${firstName} ${paternalLastName}` : firstName;
        return result.trim();
    };

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

    const [showAll, setShowAll] = React.useState(true);

    // Determinar si la caja está vacía
    const isEmpty = trabajando.length === 0;

    // Determinar la clase de altura
    const getHeightClass = () => {
        if (roleId === 1 || roleId === 2) return 'row-span-2';
        return 'h-full'; // Todas las cajas ocupan todo el espacio disponible
    };

    return (
        <Card className={`w-full border-l-4 ${getDashboardRoleColors(roleColor)}  ${getHeightClass()}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: roleColor }}></div>
                    <span className="font-semibold">{roleName === 'Alerta Móvil' ? 'Patrullaje y Proximidad' : roleName}</span>
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
                                    <div key={turno} className="space-y-2">
                                        <h5
                                            className={`flex flex-row items-center justify-center gap-2 rounded-lg border px-3 py-2 text-center text-sm font-semibold ${getTurnoTitleColors(roleColor)}`}
                                        >
                                            {data.emoji} {data.label} <p className="text-xs font-light">({data.employees.length})</p>
                                        </h5>
                                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                            {data.employees.slice(0, showAll ? undefined : 4).map((employee) => (
                                                <div
                                                    key={employee.id}
                                                    className="flex items-center justify-between rounded-md bg-white/50 p-1.5 dark:bg-slate-800/50"
                                                >
                                                    <span className="truncate text-xs font-medium">
                                                        {getDisplayName(employee.name, employee.paternal_lastname)}
                                                    </span>
                                                    <span
                                                        className={`rounded px-1 text-xs ${employee.amzoma ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}
                                                    >
                                                        {employee.amzoma ? 'Amz' : 'Mun'}
                                                    </span>
                                                </div>
                                            ))}
                                            {!showAll && data.employees.length > 4 && (
                                                <p className="col-span-full text-center text-xs italic opacity-75">
                                                    +{data.employees.length - 4} más...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ),
                        )}

                        {/* Turnos Numéricos */}
                        {Object.entries(turnosNumericos).map(
                            ([turno, data]) =>
                                data.employees.length > 0 && (
                                    <div key={turno} className="space-y-2">
                                        <h5
                                            className={`flex flex-row items-center justify-center gap-2 rounded-lg border px-3 py-2 text-center text-sm font-semibold ${getTurnoTitleColors(roleColor)}`}
                                        >
                                            {data.emoji} {data.label} <p className="text-xs font-light">({data.employees.length})</p>
                                        </h5>
                                        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                            {data.employees.slice(0, showAll ? undefined : 4).map((employee) => (
                                                <div
                                                    key={employee.id}
                                                    className="flex items-center justify-between rounded-md bg-white/50 p-1.5 dark:bg-slate-800/50"
                                                >
                                                    <span className="truncate text-xs font-medium">
                                                        {getDisplayName(employee.name, employee.paternal_lastname)}
                                                    </span>
                                                    <span
                                                        className={`rounded px-1 text-xs ${employee.amzoma ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}
                                                    >
                                                        {employee.amzoma ? 'Amz' : 'Mun'}
                                                    </span>
                                                </div>
                                            ))}
                                            {!showAll && data.employees.length > 4 && (
                                                <p className="col-span-full text-center text-xs italic opacity-75">
                                                    +{data.employees.length - 4} más...
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ),
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
