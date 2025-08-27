import { RoleCard } from '@/components/RoleCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayout from '@/layouts/app-layout';
import { getDashboardRoleColors, getTurnoTitleColors } from '@/lib/role-colors';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Activity, AlertTriangle, ChevronLeft, ChevronRight, RefreshCw, UserCheck, UserX } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// Hook personalizado para obtener datos de una fecha específica
const useEmployeeStatusWithDate = (selectedDate: string) => {
    const [employeeStatus, setEmployeeStatus] = useState<{
        trabajando: Array<{
            id: number;
            name: string;
            paternal_lastname?: string;
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
                // Procesar los datos para extraer solo el primer nombre
                const processedStatus = {
                    trabajando: data.data.status.trabajando.map((emp: any) => ({
                        ...emp,
                        name: emp.name.split(' ')[0], // Solo el primer nombre
                    })),
                    descanso: data.data.status.descanso.map((emp: any) => ({
                        ...emp,
                        name: emp.name.split(' ')[0], // Solo el primer nombre
                    })),
                    ausente: data.data.status.ausente.map((emp: any) => ({
                        ...emp,
                        name: emp.name.split(' ')[0], // Solo el primer nombre
                    })),
                    sinTurno: data.data.status.sinTurno.map((emp: any) => ({
                        ...emp,
                        name: emp.name.split(' ')[0], // Solo el primer nombre
                    })),
                };

                setEmployeeStatus(processedStatus);
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

// Función helper para agrupar turnos incluyendo extras (unificados)
const groupShiftsWithExtras = (employees: any[]) => {
    const turnosMañanaTardeNoche: Record<string, any> = {};
    const turnosNumericos: Record<string, any> = {};

    employees.forEach((emp) => {
        if (!emp.shift) return;

        const isExtra = emp.shift.endsWith('e') || emp.shift.endsWith('E');
        const baseShift = isExtra ? emp.shift.slice(0, -1) : emp.shift;

        // Debug: Log para cada empleado procesado
        console.log(`🔍 Procesando en agrupación: ${emp.name} - Turno: ${emp.shift} - Es extra: ${isExtra} - Base: ${baseShift}`);

        // Turnos de mañana, tarde, noche
        if (['M', 'T', 'N', 'Me', 'Te', 'Ne', 'ME', 'TE', 'NE'].includes(emp.shift)) {
            const key = baseShift;
            if (!turnosMañanaTardeNoche[key]) {
                const labels = { M: 'Mañana', T: 'Tarde', N: 'Noche' };
                const emojis = { M: '🌅', T: '🌇', N: '🌙' };
                turnosMañanaTardeNoche[key] = {
                    label: labels[key as keyof typeof labels],
                    emoji: emojis[key as keyof typeof emojis],
                    allEmployees: [], // Un solo array con todos los empleados
                };
            }

            // Agregar empleado con información de si es extra
            turnosMañanaTardeNoche[key].allEmployees.push({
                ...emp,
                is_extra: isExtra,
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
                    allEmployees: [], // Un solo array con todos los empleados
                };
            }

            // Agregar empleado con información de si es extra
            turnosNumericos[key].allEmployees.push({
                ...emp,
                is_extra: isExtra,
            });
        }
    });

    return { turnosMañanaTardeNoche, turnosNumericos };
};

function RoleColumn({ roleId, roleName, employees, roleColor }: RoleColumnProps) {
    // Si es Alerta Móvil, usar el componente especial
    if (roleId === 1) {
        return <AlertaMovilColumn roleId={roleId} roleName={roleName} employees={employees} roleColor={roleColor} />;
    }

    // Filtrar empleados por rol y solo mostrar los que están trabajando
    const roleEmployees = employees.filter((emp) => emp.rol_id === roleId);

    // Solo empleados trabajando (incluir turnos extras)
    const trabajando = roleEmployees.filter(
        (emp) =>
            emp.shift && ['M', 'T', 'N', '1', '2', '3', 'Me', 'Te', 'Ne', '1e', '2e', '3e', 'ME', 'TE', 'NE', '1E', '2E', '3E'].includes(emp.shift),
    );

    // Agrupar por turnos usando la función helper
    const { turnosMañanaTardeNoche, turnosNumericos } = groupShiftsWithExtras(trabajando);

    const [showAll, setShowAll] = useState(true);

    return (
        <Card className={`border-l-4 ${getDashboardRoleColors(roleColor)} h-full w-full border-2 border-red-500`}>
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
                        {Object.entries(turnosMañanaTardeNoche).map(([turno, data]) => {
                            if (data.allEmployees.length === 0) return null;

                            return (
                                <TurnoSection
                                    key={turno}
                                    title={`${data.emoji} ${data.label}`}
                                    employees={data.allEmployees}
                                    showAll={showAll}
                                    roleColor={roleColor}
                                />
                            );
                        })}

                        {/* Turnos Numéricos */}
                        {Object.entries(turnosNumericos).map(([turno, data]) => {
                            if (data.allEmployees.length === 0) return null;

                            return (
                                <TurnoSection
                                    key={turno}
                                    title={`${data.emoji} ${data.label}`}
                                    employees={data.allEmployees}
                                    showAll={showAll}
                                    roleColor={roleColor}
                                />
                            );
                        })}
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

    // Solo empleados trabajando (incluir turnos extras)
    const trabajando = roleEmployees.filter(
        (emp) =>
            emp.shift && ['M', 'T', 'N', '1', '2', '3', 'Me', 'Te', 'Ne', '1e', '2e', '3e', 'ME', 'TE', 'NE', '1E', '2E', '3E'].includes(emp.shift),
    );

    // Agrupar por turnos usando la función helper
    const { turnosMañanaTardeNoche, turnosNumericos } = groupShiftsWithExtras(trabajando);

    const [showAll, setShowAll] = useState(true);

    return (
        <Card className={`border-l-4 ${getDashboardRoleColors(roleColor)}`}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: roleColor }}></div>
                    <span className="font-semibold">Patrullaje y Proximidad</span>
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
                        {Object.entries(turnosMañanaTardeNoche).map(([turno, data]) => {
                            if (data.allEmployees.length === 0) return null;

                            return (
                                <TurnoSectionWithIndicator
                                    key={turno}
                                    title={`${data.emoji} ${data.label}`}
                                    employees={data.allEmployees}
                                    showAll={showAll}
                                    roleColor={roleColor}
                                />
                            );
                        })}

                        {/* Turnos Numéricos */}
                        {Object.entries(turnosNumericos).map(([turno, data]) => {
                            if (data.allEmployees.length === 0) return null;

                            return (
                                <TurnoSectionWithIndicator
                                    key={turno}
                                    title={`${data.emoji} ${data.label}`}
                                    employees={data.allEmployees}
                                    showAll={showAll}
                                    roleColor={roleColor}
                                />
                            );
                        })}
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
        is_extra?: boolean;
        base_shift?: string;
    }>;
    showAll: boolean;
    roleColor?: string;
    isExtra?: boolean;
}

function TurnoSectionWithIndicator({ title, employees, showAll, roleColor = '#3B82F6', isExtra = false }: TurnoSectionWithIndicatorProps) {
    const displayEmployees = showAll ? employees : employees.slice(0, 4);
    const colorClasses = getTurnoTitleColors(roleColor);

    return (
        <div className="space-y-2">
            <h5
                className={`flex flex-row items-center justify-center gap-2 rounded-lg border px-3 py-2 text-center text-sm font-semibold ${colorClasses}`}
            >
                {title} <p className="text-xs font-light">({employees.length})</p>
            </h5>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {displayEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between gap-2 rounded-md bg-white/50 p-1.5 dark:bg-slate-800/50">
                        <div className="flex items-center gap-1">
                            <span className="truncate text-xs font-medium">{employee.name}</span>
                            {employee.is_extra && (
                                <Badge
                                    variant="outline"
                                    className="border-orange-300 bg-orange-100 px-1 py-0 text-xs text-orange-700 dark:border-orange-700/50 dark:bg-orange-900/30 dark:text-orange-300"
                                >
                                    EX
                                </Badge>
                            )}
                        </div>
                        <Badge
                            variant="outline"
                            className={`flex-shrink-0 px-1 py-0 text-xs ${
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
                    <p className="col-span-full text-center text-xs italic opacity-75">+{employees.length - 4} más...</p>
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
        is_extra?: boolean;
        base_shift?: string;
    }>;
    showAll: boolean;
    roleColor?: string;
    isExtra?: boolean;
}

function TurnoSection({ title, employees, showAll, roleColor = '#3B82F6', isExtra = false }: TurnoSectionProps) {
    const displayEmployees = showAll ? employees : employees.slice(0, 4);
    const colorClasses = getTurnoTitleColors(roleColor);

    return (
        <div className="space-y-2">
            <h5
                className={`flex flex-row items-center justify-center gap-2 rounded-lg border px-3 py-2 text-center text-sm font-semibold ${colorClasses}`}
            >
                {title} <p className="text-xs font-light">({employees.length})</p>
            </h5>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {displayEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-center rounded-md bg-white/50 p-1.5 dark:bg-slate-800/50">
                        <span className="truncate text-xs font-medium">{employee.name}</span>
                        {employee.is_extra && (
                            <Badge
                                variant="outline"
                                className="ml-1 border-orange-300 bg-orange-100 px-1 py-0 text-xs text-orange-700 dark:border-orange-700/50 dark:bg-orange-900/30 dark:text-orange-300"
                            >
                                EX
                            </Badge>
                        )}
                    </div>
                ))}
                {!showAll && employees.length > 4 && (
                    <p className="col-span-full text-center text-xs italic opacity-75">+{employees.length - 4} más...</p>
                )}
            </div>
        </div>
    );
}

// Componente de carrusel para móviles
interface CarouselProps {
    children: React.ReactNode;
    className?: string;
    onCardChange?: () => void;
    dropdownState?: string | null;
}

function Carousel({ children, className = '', onCardChange, dropdownState }: CarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [maxHeight, setMaxHeight] = useState<number>(0);

    const checkScrollButtons = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        checkScrollButtons();
        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            const handleScroll = () => {
                checkScrollButtons();
                // Cerrar dropdowns cuando se hace scroll manual
                onCardChange?.();
            };
            scrollContainer.addEventListener('scroll', handleScroll);
            return () => scrollContainer.removeEventListener('scroll', handleScroll);
        }
    }, [children, onCardChange]);

    // Calcular altura máxima de las tarjetas
    useEffect(() => {
        const calculateHeight = () => {
            if (scrollContainerRef.current) {
                const container = scrollContainerRef.current;
                const cards = container.children;
                let maxCardHeight = 0;

                for (let i = 0; i < cards.length; i++) {
                    const card = cards[i] as HTMLElement;
                    const cardHeight = card.offsetHeight;
                    if (cardHeight > maxCardHeight) {
                        maxCardHeight = cardHeight;
                    }
                }

                // Agregar un pequeño margen para evitar que se vea muy ajustado
                setMaxHeight(maxCardHeight + 16);
            }
        };

        // Si hay cambio en dropdownState, esperar a que termine la animación
        if (dropdownState !== undefined) {
            const timeoutId = setTimeout(calculateHeight, 350); // 300ms de animación + 50ms de margen
            return () => clearTimeout(timeoutId);
        } else {
            calculateHeight();
        }
    }, [children, dropdownState]);

    const scrollTo = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const childrenArray = React.Children.toArray(children);

            if (direction === 'left') {
                if (currentIndex === 0) {
                    // Si estamos al inicio, ir al final
                    setCurrentIndex(childrenArray.length - 1);
                    const lastChild = container.children[childrenArray.length - 1] as HTMLElement;
                    lastChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                } else {
                    // Ir al anterior
                    setCurrentIndex(prev => prev - 1);
                    const prevChild = container.children[currentIndex - 1] as HTMLElement;
                    prevChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                }
            } else {
                if (currentIndex === childrenArray.length - 1) {
                    // Si estamos al final, ir al inicio
                    setCurrentIndex(0);
                    const firstChild = container.children[0] as HTMLElement;
                    firstChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                } else {
                    // Ir al siguiente
                    setCurrentIndex(prev => prev + 1);
                    const nextChild = container.children[currentIndex + 1] as HTMLElement;
                    nextChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
                }
            }

            // Cerrar dropdowns cuando cambie la tarjeta
            onCardChange?.();
        }
    };

    return (
        <div className={`relative transition-all duration-300 ease-in-out ${className}`}>
            {/* Botón izquierdo */}
            {canScrollLeft && (
                <button
                    onClick={() => scrollTo('left')}
                    className="absolute top-1/2 -left-3 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
            )}

            {/* Contenedor de scroll */}
            <div
                ref={scrollContainerRef}
                className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto px-2 transition-all duration-300 ease-in-out"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    minHeight: maxHeight > 0 ? `${maxHeight}px` : 'auto'
                }}
            >
                {children}
            </div>

            {/* Botón derecho */}
            {canScrollRight && (
                <button
                    onClick={() => scrollTo('right')}
                    className="absolute top-1/2 -right-3 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-white dark:bg-slate-800/90 dark:hover:bg-slate-800"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}

// Componente para mostrar empleados ausentes y sin turno
interface BottomSectionProps {
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
    title: string;
    icon: React.ReactNode;
    emptyMessage: string;
    bgColor: string;
    borderColor: string;
    textColor: string;
    roles: Record<number, string>;
    mobile?: boolean;
}

function BottomSection({ employees, title, icon, emptyMessage, bgColor, borderColor, textColor, roles, mobile = false }: BottomSectionProps) {
    const [showAll, setShowAll] = useState(false);

    // Función para obtener el nombre completo
    const getDisplayName = (fullName: string, lastName?: string) => {
        const firstName = fullName.split(' ')[0]; // Primer nombre
        const paternalLastName = lastName;
        const result = paternalLastName ? `${firstName} ${paternalLastName}` : firstName;
        return result.trim();
    };

    // Para "Sin Turno Asignado" mostrar solo 4, para otros mostrar 6
    const initialCount = title === 'Sin Turno Asignado' ? 4 : 6;
    const displayEmployees = showAll ? employees : employees.slice(0, initialCount);

    return (
        <Card className={mobile ? 'h-fit' : ''}>
            <CardHeader className={mobile ? 'pb-2' : ''}>
                <CardTitle className={`flex items-center gap-2 ${textColor} ${mobile ? 'text-base' : ''}`}>
                    {icon}
                    {title}
                    <Badge variant="secondary" className={`ml-auto ${mobile ? 'px-2 py-1 text-xs' : ''}`}>
                        {employees.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className={mobile ? 'pt-0' : ''}>
                {employees.length === 0 ? (
                    <p className={`${mobile ? 'text-xs' : 'text-sm'} text-muted-foreground italic`}>{emptyMessage}</p>
                ) : (
                    <div className={`${mobile ? 'space-y-1 pb-4' : 'space-y-2 pb-8'}`}>
                        {displayEmployees.map((employee) => (
                            <div
                                key={employee.id}
                                className={`${mobile ? 'flex flex-col gap-1.5' : 'flex items-center justify-between'} rounded-lg ${mobile ? 'p-2' : 'p-2'} ${bgColor} border ${borderColor}`}
                            >
                                {mobile ? (
                                    // Layout móvil: Nombre completo arriba, información abajo
                                    <>
                                        <div className="flex items-center justify-between">
                                            <span className="truncate text-sm font-medium text-gray-900 dark:text-slate-200">
                                                {getDisplayName(employee.name, employee.paternal_lastname)}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            <Badge
                                                variant="outline"
                                                className={`text-xs ${ROLE_COLORS[employee.rol_id] || 'bg-gray-100 text-gray-800 dark:bg-slate-700/30 dark:text-slate-300'} px-1 py-0`}
                                            >
                                                {roles[employee.rol_id] || `Rol ${employee.rol_id}`}
                                            </Badge>
                                            {employee.shift_label && (
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs font-medium ${getAbsenceColor(employee.shift_label)} px-1 py-0`}
                                                >
                                                    {employee.shift_label}
                                                </Badge>
                                            )}
                                        </div>
                                        {employee.reason && (
                                            <span className="text-xs text-muted-foreground dark:text-slate-400">{employee.reason}</span>
                                        )}
                                    </>
                                ) : (
                                    // Layout desktop: Información horizontal
                                    <>
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-sm font-medium text-gray-900 dark:text-slate-200">
                                                {getDisplayName(employee.name, employee.paternal_lastname)}
                                            </span>
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
                                        {employee.reason && (
                                            <span className="text-xs text-muted-foreground dark:text-slate-400">{employee.reason}</span>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}

                        {/* Botón dropdown solo para "Sin Turno Asignado" */}
                        {title === 'Sin Turno Asignado' && employees.length > 4 && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className={`${mobile ? 'mt-2' : 'mt-3'} w-full rounded-lg border border-gray-200 ${mobile ? 'p-1.5 text-xs' : 'p-2 text-sm'} text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-800 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700/30 dark:hover:text-slate-200`}
                            >
                                {showAll ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span>{mobile ? 'Ocultar' : 'Ocultar empleados'}</span>
                                        <span className="text-xs">({employees.length - 4} menos)</span>
                                    </span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        <span>{mobile ? 'Ver todos' : 'Ver todos los empleados'}</span>
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

    // Estado para controlar qué dropdown está abierto (solo uno a la vez)
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

    // Hook personalizado para obtener datos de una fecha específica
    const { employeeStatus, counts, totalActivos, totalEmpleados, roles, roleColors, loading, error, refetch } =
        useEmployeeStatusWithDate(selectedDate);
    const isMobile = useIsMobile();
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
                <div className="relative border-b border-slate-200 bg-white/80 py-6 backdrop-blur-md lg:py-10 dark:border-slate-700/50 dark:bg-slate-900/80">
                    <div className="px-4 py-4 lg:px-6 lg:py-8">
                        {isMobile ? (
                            /* Vista móvil */
                            <div className="flex flex-col gap-4">
                                {/* Título y fecha */}
                                <div className="text-center">
                                    <h1 className="text-xl font-bold lg:text-2xl">Dotación diaria de fuerza operativa</h1>
                                    <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-500">
                                        <Activity className="h-4 w-4" />
                                        <span className="text-xs lg:text-sm">{selectedDateFormatted}</span>
                                        {loading && (
                                            <div className="ml-2 flex items-center gap-1">
                                                <RefreshCw className="h-3 w-3 animate-spin" />
                                                <span className="text-xs">Actualizando...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Caja de Dotación Activa - Móvil */}
                                <div className="flex justify-center">
                                    <Card className="w-full max-w-sm border-green-200 bg-green-50 shadow-lg dark:border-green-700/30 dark:bg-green-900/20">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-full bg-green-100 p-2 dark:bg-green-800/30">
                                                    <UserCheck className="h-5 w-5 text-green-600 dark:text-green-300" />
                                                </div>
                                                <div className="flex-1 text-center">
                                                    <p className="text-sm font-medium text-green-700 dark:text-green-200">Dotación Activa Hoy</p>
                                                    <div className="flex items-baseline justify-center gap-1">
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
                                </div>
                            </div>
                        ) : (
                            /* Vista desktop */
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                {/* Title Section */}
                                <div className="flex w-full flex-col items-center justify-center gap-4 lg:flex-row">
                                    <div className="right-0 left-0 flex-1 text-center xl:absolute">
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
                                    <div className="right-6 flex items-center gap-4 xl:absolute">
                                        <div className="flex gap-3">
                                            {/* Caja de Dotación Activa */}
                                            <Card className="border-green-200 bg-green-50 shadow-lg dark:border-green-700/30 dark:bg-green-900/20">
                                                <CardContent className="pt-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="rounded-full bg-green-100 p-2 dark:bg-green-800/30">
                                                            <UserCheck className="h-5 w-5 text-green-600 dark:text-green-300" />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-sm font-medium text-green-700 dark:text-green-200">
                                                                Dotación Activa Hoy
                                                            </p>
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
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Total de funcionarios del día */}
                <div className="mx-0 my-8 lg:mx-6">
                    {/* Desglose de personal por rol */}
                    <div className="mb-6 px-6">
                        {isMobile ? (
                            /* Vista móvil */
                            <div className="space-y-4">
                                {/* Título */}
                                <div className="text-center">
                                    <h2 className="text-lg font-semibold text-gray-700 dark:text-slate-200">Desglose de Personal</h2>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{selectedDateFormatted}</p>
                                </div>

                                {/* Controles móviles */}
                                <div className="flex flex-col gap-3">
                                    {/* Selector de fecha */}
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="date-selector-mobile" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            Seleccionar fecha:
                                        </Label>
                                        <Input
                                            id="date-selector-mobile"
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>

                                    {/* Botón actualizar */}
                                    <button
                                        onClick={refetch}
                                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-primary-foreground transition-colors hover:bg-primary/90"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Actualizar datos
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Vista desktop */
                            <div className="flex flex-col items-center justify-between px-4 pb-4 lg:flex-row">
                                <h2 className="mb-4 text-xl font-semibold text-gray-700 dark:text-slate-200">
                                    Desglose de Personal - {selectedDateFormatted}
                                </h2>

                                <div className="flex flex-col items-center justify-center gap-2 pb-4 sm:flex-row">
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
                        )}

                        {isMobile ? (
                            // <Carousel className="pb-4">
                            //     {Object.entries(roles)
                            //         .filter(([roleId, roleName]) => {
                            //             const lowerRoleName = roleName.toLowerCase();
                            //             return (
                            //                 !lowerRoleName.includes('administrativo') &&
                            //                 !lowerRoleName.includes('servicio') &&
                            //                 !lowerRoleName.includes('personal de servicio')
                            //             );
                            //         })
                            //         .map(([roleId, roleName]) => {
                            //             const roleIdNum = parseInt(roleId);
                            //             const roleColor = roleColors[roleIdNum] || '#3B82F6';
                            //             const colorClasses = getDashboardRoleColors(roleColor);

                            //             // Determinar los turnos según el rol
                            //             const getShiftsForRole = (roleId: number) => {
                            //                 if (roleId === 1) { // Alerta Móvil/Patrullaje usa M, T, N
                            //                     return [
                            //                         { shift: 'M', label: 'Mañana' },
                            //                         { shift: 'T', label: 'Tarde' },
                            //                         { shift: 'N', label: 'Noche' }
                            //                     ];
                            //                 } else { // Otros roles usan 1, 2, 3
                            //                     return [
                            //                         { shift: '1', label: '1er Turno' },
                            //                         { shift: '2', label: '2do Turno' },
                            //                         { shift: '3', label: '3er Turno' }
                            //                     ];
                            //                 }
                            //             };

                            //             const shifts = getShiftsForRole(roleIdNum);
                            //             const displayName = roleName === "Alerta Móvil" ? "Patrullaje y Proximidad" : roleName;

                            //             return (
                            //                 <Card key={roleId} className={`${colorClasses} w-[calc(50vw-2.5rem)] min-w-[200px] max-w-[280px] snap-start flex-shrink-0`}>
                            //                     <CardContent className="p-3">
                            //                         <div className="mb-2 flex items-center gap-2">
                            //                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: roleColor }}></div>
                            //                             <div>
                            //                                 <p className="text-sm font-semibold">{displayName}</p>
                            //                                 <p className="text-xs opacity-75">Todos los turnos</p>
                            //                             </div>
                            //                         </div>
                            //                         <div className="mb-2 grid grid-cols-3 gap-1">
                            //                             {shifts.map((shiftInfo) => (
                            //                                 <div key={shiftInfo.shift} className="text-center">
                            //                                     <p className="text-base font-bold">
                            //                                         {employeeStatus.trabajando.filter((emp) =>
                            //                                             emp.rol_id === roleIdNum && emp.shift === shiftInfo.shift
                            //                                         ).length}
                            //                                     </p>
                            //                                     <p className="text-xs opacity-75">{shiftInfo.label}</p>
                            //                                 </div>
                            //                             ))}
                            //                         </div>
                            //                         <div className="border-t pt-2 text-center" style={{ borderColor: roleColor + '40' }}>
                            //                             <p className="text-2xl font-bold">
                            //                                 {employeeStatus.trabajando.filter((emp) => emp.rol_id === roleIdNum).length}
                            //                             </p>
                            //                             <p className="text-xs opacity-75">Total</p>
                            //                         </div>
                            //                     </CardContent>
                            //                 </Card>
                            //             );
                            //         })}
                            // </Carousel>
                            <></>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
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
                                            if (roleId === 1) {
                                                // Alerta Móvil/Patrullaje usa M, T, N
                                                return [
                                                    { shift: 'M', label: 'Mañana' },
                                                    { shift: 'T', label: 'Tarde' },
                                                    { shift: 'N', label: 'Noche' },
                                                ];
                                            } else {
                                                // Otros roles usan 1, 2, 3
                                                return [
                                                    { shift: '1', label: '1er Turno' },
                                                    { shift: '2', label: '2do Turno' },
                                                    { shift: '3', label: '3er Turno' },
                                                ];
                                            }
                                        };

                                        const shifts = getShiftsForRole(roleIdNum);
                                        const displayName = roleName === 'Alerta Móvil' ? 'Patrullaje y Proximidad' : roleName;

                                        return (
                                            <Card key={roleId} className={colorClasses}>
                                                <CardContent className="p-4">
                                                    <div className="mb-3 flex items-center gap-2">
                                                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: roleColor }}></div>
                                                        <div>
                                                            <p className="text-sm font-semibold">{displayName}</p>
                                                            <p className="text-xs opacity-75">Todos los turnos</p>
                                                        </div>
                                                    </div>
                                                    <div className="mb-3 grid grid-cols-3 gap-2">
                                                        {shifts.map((shiftInfo) => (
                                                            <div key={shiftInfo.shift} className="text-center">
                                                                <p className="text-lg font-bold">
                                                                    {
                                                                        employeeStatus.trabajando.filter(
                                                                            (emp) => emp.rol_id === roleIdNum && emp.shift === shiftInfo.shift,
                                                                        ).length
                                                                    }
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
                        )}
                    </div>
                </div>

                <div className="mx-6 my-8">
                    {/* Error message */}
                    {error && (
                        <div className="mx-6 rounded-lg border border-red-200 bg-red-50 p-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    {/* Grid de roles operativos */}
                    {isMobile ? (
                        <Carousel
                            className="mb-8 lg:px-2 pb-4 animate-smooth"
                            onCardChange={() => setOpenDropdownId(null)}
                            dropdownState={openDropdownId}
                        >
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
                                        if (roleId === 1) {
                                            // Alerta Móvil/Patrullaje usa M, T, N
                                            return [
                                                { shift: 'M', label: 'Mañana' },
                                                { shift: 'T', label: 'Tarde' },
                                                { shift: 'N', label: 'Noche' },
                                            ];
                                        } else {
                                            // Otros roles usan 1, 2, 3
                                            return [
                                                { shift: '1', label: '1er Turno' },
                                                { shift: '2', label: '2do Turno' },
                                                { shift: '3', label: '3er Turno' },
                                            ];
                                        }
                                    };

                                    const shifts = getShiftsForRole(roleIdNum);
                                    const displayName = roleName === 'Alerta Móvil' ? 'Patrullaje y Proximidad' : roleName;

                                    return (
                                                                                                                         <div
                                            key={roleId}
                                            className={`${colorClasses} w-full max-w-[350px] min-w-[280px] h-fit flex-shrink-0 snap-start rounded-lg border p-5 lg:mx-2 lg:w-[calc(100vw-2rem)] transition-all duration-300 ease-in-out`}
                                        >
                                            {/* Sección de conteo por turnos */}
                                            <div className="mb-2 flex items-center gap-2">
                                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: roleColor }}></div>
                                                <div>
                                                    <p className="text-sm font-semibold">{displayName}</p>
                                                    <p className="text-xs opacity-75">Todos los turnos</p>
                                                </div>
                                            </div>
                                            <div className="mb-2 grid grid-cols-3 gap-1">
                                                {shifts.map((shiftInfo) => (
                                                    <div key={shiftInfo.shift} className="text-center">
                                                        <p className="text-base font-bold">
                                                            {
                                                                employeeStatus.trabajando.filter(
                                                                    (emp) => emp.rol_id === roleIdNum && emp.shift === shiftInfo.shift,
                                                                ).length
                                                            }
                                                        </p>
                                                        <p className="text-xs opacity-75">{shiftInfo.label}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mb-3 border-t pt-2 text-center" style={{ borderColor: roleColor + '40' }}>
                                                <p className="text-2xl font-bold">
                                                    {employeeStatus.trabajando.filter((emp) => emp.rol_id === roleIdNum).length}
                                                </p>
                                                <p className="text-xs opacity-75">Total</p>
                                            </div>

                                                                                         {/* Sección de funcionarios con dropdown */}
                                             <div className="border-t pt-2" style={{ borderColor: roleColor + '40' }}>
                                                 <div className="group">
                                                     <button
                                                         onClick={() => {
                                                             if (openDropdownId === roleId) {
                                                                 setOpenDropdownId(null);
                                                             } else {
                                                                 setOpenDropdownId(roleId);
                                                             }
                                                         }}
                                                         className="flex w-full cursor-pointer items-center justify-between text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-200"
                                                     >
                                                         <span>Ver funcionarios del día</span>
                                                         <svg
                                                             className={`h-4 w-4 transition-transform duration-300 ease-in-out ${openDropdownId === roleId ? 'rotate-180' : ''}`}
                                                             fill="none"
                                                             viewBox="0 0 24 24"
                                                             stroke="currentColor"
                                                         >
                                                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                         </svg>
                                                     </button>
                                                    <div
                                                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                                            openDropdownId === roleId
                                                                ? 'max-h-[800px] opacity-100 mt-2'
                                                                : 'max-h-0 opacity-0 mt-0'
                                                        }`}
                                                    >
                                                        {shifts.map((shiftInfo) => {
                                                            const shiftEmployees = employeeStatus.trabajando.filter((emp) => {
                                                                if (emp.rol_id !== roleIdNum) return false;

                                                                // Para turnos que terminan en 'e' o 'E', considerar el turno base
                                                                const baseShift = emp.shift?.toLowerCase().replace(/e$/, '');
                                                                const targetShift = shiftInfo.shift.toLowerCase();

                                                                return baseShift === targetShift;
                                                            });

                                                            if (shiftEmployees.length === 0) return null;

                                                            return (
                                                                <div key={shiftInfo.shift} className="space-y-1">
                                                                    <h6 className="border-b pb-1 text-center text-xs font-semibold text-gray-600 dark:text-slate-400">
                                                                        {shiftInfo.label} ({shiftEmployees.length})
                                                                    </h6>
                                                                    <div className="space-y-1">
                                                                        {shiftEmployees.map((emp) => {
                                                                            // Construir nombre completo: primer nombre + apellido paterno
                                                                            const firstName = emp.name.split(' ')[0];
                                                                            const fullName = emp.paternal_lastname
                                                                                ? `${firstName} ${emp.paternal_lastname}`
                                                                                : firstName;

                                                                            return (
                                                                                <div
                                                                                    key={emp.id}
                                                                                    className="flex items-center justify-between rounded bg-white/50 p-1 text-xs dark:bg-slate-800/50"
                                                                                >
                                                                                    <span className="truncate">{fullName}</span>
                                                                                    <div className="flex items-center gap-1">
                                                                                        {/* Badge de empresa (AMZ/MUN) */}
                                                                                        <Badge
                                                                                            variant="outline"
                                                                                            className={`flex-shrink-0 px-1 py-0 text-xs ${
                                                                                                Boolean(emp.amzoma)
                                                                                                    ? 'border-red-300 bg-red-100 text-red-700 dark:border-red-700/50 dark:bg-red-900/30 dark:text-red-300'
                                                                                                    : 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700/50 dark:bg-blue-900/30 dark:text-blue-300'
                                                                                            }`}
                                                                                        >
                                                                                            {Boolean(emp.amzoma) ? 'AMZ' : 'MUN'}
                                                                                        </Badge>
                                                                                        {/* Badge de turno extra */}
                                                                                        {emp.shift && emp.shift.length > 1 && (
                                                                                            <Badge
                                                                                                variant="outline"
                                                                                                className="border-orange-300 bg-orange-100 px-1 py-0 text-xs text-orange-700 dark:border-orange-700/50 dark:bg-orange-900/30 dark:text-orange-300"
                                                                                            >
                                                                                                EX
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </Carousel>
                    ) : (
                        <div className="mb-8 grid auto-rows-fr grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                            {Object.entries(roles)
                                .filter(([roleId, roleName]) => {
                                    const roleIdNum = parseInt(roleId);
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

                                    // Debug: Log para ver qué roles se están procesando
                                    console.log(`🔍 Procesando rol: ${roleIdNum} - ${roleNameStr}`);
                                    const roleEmployees = employeeStatus.trabajando.filter((emp) => emp.rol_id === roleIdNum);
                                    console.log(`   Empleados en este rol: ${roleEmployees.length}`);
                                    roleEmployees.forEach((emp) => {
                                        const isExtra = (emp as any).is_extra || false;
                                        console.log(`     - ${emp.name}: ${emp.shift} (extra: ${isExtra})`);
                                    });

                                    return (
                                        <RoleCard
                                            key={roleId}
                                            roleId={roleIdNum}
                                            roleName={roleNameStr}
                                            roleColor={roleColors[roleIdNum] || '#3B82F6'}
                                            employees={employeeStatus.trabajando}
                                        />
                                    );
                                })}
                        </div>
                    )}

                    {/* Sección inferior: Ausentes y Sin Turno */}
                    <div className="space-y-4">
                        <h2 className="border-b pb-2 text-xl font-semibold text-gray-700 dark:border-slate-600/50 dark:text-slate-200">
                            Estado Especial del Personal
                        </h2>

                        {isMobile ? (
                            <Carousel
                                className="pb-4 animate-smooth"
                                onCardChange={() => setOpenDropdownId(null)}
                                dropdownState={openDropdownId}
                            >
                                                                 <div className="w-[calc(50vw-2.5rem)] max-w-[400px] min-w-[280px] h-fit flex-shrink-0 snap-start p-1">
                                     <BottomSection
                                         employees={employeeStatus.ausente}
                                         title="Ausente"
                                         icon={<AlertTriangle className="h-4 w-4" />}
                                         emptyMessage="No hay empleados ausentes hoy"
                                         bgColor="bg-red-50 dark:bg-slate-800/25"
                                         borderColor="border-red-200 dark:border-slate-600/40"
                                         textColor="text-red-700 dark:text-slate-300"
                                         roles={roles}
                                         mobile={true}
                                     />
                                 </div>
                                 <div className="w-[calc(50vw-2.5rem)] max-w-[400px] min-w-[280px] h-fit flex-shrink-0 snap-start p-1">
                                     <BottomSection
                                         employees={employeeStatus.sinTurno}
                                         title="Sin Turno Asignado"
                                         icon={<UserX className="h-4 w-4" />}
                                         emptyMessage="Todos los empleados tienen turno asignado"
                                         bgColor="bg-gray-50 dark:bg-slate-800/30"
                                         borderColor="border-gray-200 dark:border-slate-600/40"
                                         textColor="text-gray-700 dark:text-slate-300"
                                         roles={roles}
                                         mobile={true}
                                     />
                                 </div>
                            </Carousel>
                        ) : (
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
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
