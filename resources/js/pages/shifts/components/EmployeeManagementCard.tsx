import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, UserMinus, ChevronRight } from 'lucide-react';
import { memo, useMemo, useState } from 'react';

interface TurnoData {
    id: string;
    nombre: string;
    amzoma?: boolean | string | number;
    first_name?: string;
    paternal_lastname?: string;
    [key: string]: string | boolean | number | undefined;
}

interface EmployeeManagementCardProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    rowData: TurnoData[];
    availableEmployees: TurnoData[];
    getEmployeeId: (employee: TurnoData) => string;
    addEmployeeToGrid: (employee: TurnoData) => void;
    removeEmployeeFromGrid: (employee: TurnoData) => void;
    addAllEmployees: () => void;
    clearAllEmployees: () => void;
    isMobile?: boolean;
    isExpanded?: boolean;
    setIsExpanded?: (expanded: boolean) => void;
}

export const EmployeeManagementCard = memo(({
    searchTerm,
    setSearchTerm,
    rowData,
    availableEmployees,
    getEmployeeId,
    addEmployeeToGrid,
    removeEmployeeFromGrid,
    addAllEmployees,
    clearAllEmployees,
    isMobile = false,
    isExpanded = false,
    setIsExpanded,
}: EmployeeManagementCardProps) => {
    // Función para obtener nombre de visualización
    const getDisplayName = (employee: TurnoData) => {
        return employee.first_name && employee.paternal_lastname
            ? `${employee.first_name.split(' ')[0]} ${employee.paternal_lastname}`
            : employee.nombre;
    };

    // Función para determinar si un empleado es de Amzoma
    const isAmzomaEmployee = (employee: TurnoData) => {
        return employee.amzoma === true || employee.amzoma === 'true' || employee.amzoma === 1;
    };

    // Combinar todos los empleados y agrupar por Amzoma
    const allEmployees = useMemo(() => {
        const employeeMap = new Map<string, TurnoData>();

        availableEmployees.forEach(emp => {
            const id = getEmployeeId(emp);
            employeeMap.set(id, emp);
        });

        rowData.forEach(emp => {
            const id = getEmployeeId(emp);
            if (!employeeMap.has(id)) {
                employeeMap.set(id, emp);
            }
        });

        return Array.from(employeeMap.values()).sort((a, b) => {
            // Primero ordenar por amzoma (false primero, true después) - Municipales arriba
            const isAmzomaA = isAmzomaEmployee(a);
            const isAmzomaB = isAmzomaEmployee(b);

            if (!isAmzomaA && isAmzomaB) return -1;
            if (isAmzomaA && !isAmzomaB) return 1;

            // Si ambos tienen el mismo estado de amzoma, ordenar alfabéticamente
            const nombreA = getDisplayName(a).toLowerCase();
            const nombreB = getDisplayName(b).toLowerCase();
            return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' });
        });
    }, [availableEmployees, rowData, getEmployeeId]);

    // Filtrar empleados según el término de búsqueda
    const filteredAllEmployees = useMemo(() => {
        if (!searchTerm.trim()) return allEmployees;

        return allEmployees.filter(employee => {
            const displayName = getDisplayName(employee).toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            return displayName.includes(searchLower);
        });
    }, [allEmployees, searchTerm]);

    // Agrupar empleados filtrados por Amzoma
    const groupedEmployees = useMemo(() => {
        const amzomaEmployees = filteredAllEmployees.filter(emp => isAmzomaEmployee(emp));
        const municipalEmployees = filteredAllEmployees.filter(emp => !isAmzomaEmployee(emp));

        return {
            amzoma: amzomaEmployees,
            municipal: municipalEmployees
        };
    }, [filteredAllEmployees]);

    return (
        <Card className={`${isMobile ? 'border-0 !:mb-0 pb-0 bg-white/95 dark:bg-slate-900/95 shadow-none transition-all duration-300 ease-in-out hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'border-slate-200/50 bg-white/90 shadow-xl backdrop-blur-sm dark:bg-slate-900/90'}`}>
            <CardHeader
                className={`cursor-pointer pb-2 transition-colors ${isMobile ? 'border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 py-3' : 'border-b border-slate-100 hover:bg-slate-100/50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-700/50'}`}
                onClick={() => setIsExpanded?.(!isExpanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="rounded-md bg-blue-100 p-1 dark:bg-blue-900">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <CardTitle className="text-sm text-slate-900 dark:text-white">
                            Gestión de Funcionarios
                        </CardTitle>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {rowData.length} en grid
                        </span>
                        <ChevronRight
                            className={`h-4 w-4 text-slate-500 transition-transform duration-300 ease-in-out ${isExpanded ? 'rotate-90' : ''}`}
                        />
                    </div>
                </div>
            </CardHeader>

            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isExpanded
                        ? 'max-h-[300px] opacity-100'
                        : 'max-h-0 opacity-0'
                }`}
            >
                <CardContent className="pt-2">
                    <div className="space-y-3">
                        {/* Barra de búsqueda simplificada */}
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Buscar funcionarios..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-8 pr-4 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                            />
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            {searchTerm && (
                                <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Lista de empleados simplificada */}
                        <div className="max-h-[200px] overflow-y-auto space-y-1">
                            {filteredAllEmployees.slice(0, 10).map((employee) => {
                                const employeeId = getEmployeeId(employee);
                                const isInGrid = rowData.some(e => getEmployeeId(e) === employeeId);
                                const displayName = getDisplayName(employee);
                                const isAmzoma = isAmzomaEmployee(employee);

                                return (
                                    <div
                                        key={employeeId}
                                        className={`flex items-center justify-between p-2 rounded-md text-xs transition-colors ${
                                            isInGrid
                                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                                : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className={`w-2 h-2 rounded-full ${isAmzoma ? 'bg-orange-400' : 'bg-blue-400'}`} />
                                            <span className="text-slate-700 dark:text-slate-300 truncate">
                                                {displayName}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => isInGrid ? removeEmployeeFromGrid(employee) : addEmployeeToGrid(employee)}
                                            className={`p-1 rounded transition-colors ${
                                                isInGrid
                                                    ? 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20'
                                                    : 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20'
                                            }`}
                                        >
                                            {isInGrid ? (
                                                <UserMinus className="h-3 w-3" />
                                            ) : (
                                                <UserPlus className="h-3 w-3" />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                            
                            {filteredAllEmployees.length > 10 && (
                                <div className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">
                                    ... y {filteredAllEmployees.length - 10} más
                                </div>
                            )}
                        </div>

                        {/* Botones de acción rápida */}
                        <div className="flex gap-2">
                            <button
                                onClick={addAllEmployees}
                                className="flex-1 text-xs px-2 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center justify-center gap-1"
                            >
                                <UserPlus className="h-3 w-3" />
                                Agregar Todos
                            </button>
                            <button
                                onClick={clearAllEmployees}
                                className="flex-1 text-xs px-2 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center justify-center gap-1"
                            >
                                <UserMinus className="h-3 w-3" />
                                Limpiar
                            </button>
                        </div>
                    </div>
                </CardContent>
            </div>
        </Card>
    );
});