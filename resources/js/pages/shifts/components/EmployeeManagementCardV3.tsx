import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, UserPlus, UserMinus, Plus, X, Check } from 'lucide-react';
import { TurnoData } from '../hooks/useOptimizedShiftsManager';

interface EmployeeManagementCardV3Props {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    rowData: TurnoData[];
    availableEmployees: TurnoData[];
    getEmployeeId: (employee: TurnoData) => string | number;
    addEmployeeToGrid: (employee: TurnoData) => void;
    removeEmployeeFromGrid: (employee: TurnoData) => void;
    addAllEmployees: () => void;
    clearAllEmployees: () => void;
    isMobile: boolean;
}

export default function EmployeeManagementCardV3({
    searchTerm,
    setSearchTerm,
    rowData,
    availableEmployees,
    getEmployeeId,
    addEmployeeToGrid,
    removeEmployeeFromGrid,
    addAllEmployees,
    clearAllEmployees,
    isMobile
}: EmployeeManagementCardV3Props) {
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

    // Logs para debuggear
    useEffect(() => {
        console.log('🔍 EmployeeManagementCardV3 props:', {
            availableEmployees: availableEmployees.length,
            rowData: rowData.length,
            searchTerm,
            addAllEmployees: typeof addAllEmployees,
            clearAllEmployees: typeof clearAllEmployees
        });
    }, [availableEmployees.length, rowData.length, searchTerm, addAllEmployees, clearAllEmployees]);

    // Sincronizar el término de búsqueda local con el prop
    useEffect(() => {
        setLocalSearchTerm(searchTerm);
    }, [searchTerm]);

    // Usar directamente los empleados disponibles (ya filtrados por el hook)
    const filteredAvailableEmployees = availableEmployees;

    // Obtener IDs de empleados ya seleccionados
    const selectedEmployeeIds = useMemo(() => {
        return new Set(rowData.map(employee => getEmployeeId(employee)));
    }, [rowData, getEmployeeId]);

    const handleSearchChange = (value: string) => {
        setLocalSearchTerm(value);
        setSearchTerm(value);
    };

    const handleAddEmployee = (employee: TurnoData) => {
        console.log('➕ Agregando empleado:', employee.nombre);
        addEmployeeToGrid(employee);
    };

    const handleRemoveEmployee = (employee: TurnoData) => {
        console.log('➖ Removiendo empleado:', employee.nombre);
        removeEmployeeFromGrid(employee);
    };

    const isEmployeeSelected = (employee: TurnoData) => {
        return selectedEmployeeIds.has(getEmployeeId(employee));
    };

    const getEmployeeDisplayName = (employee: TurnoData) => {
        if (employee.first_name && employee.paternal_lastname) {
            // Extraer solo el primer nombre del first_name
            const firstName = employee.first_name.split(' ')[0];
            // Extraer solo el primer apellido del paternal_lastname
            const firstLastName = employee.paternal_lastname.split(' ')[0];
            return `${firstName} ${firstLastName}`;
        }
        return employee.nombre || 'Empleado sin nombre';
    };

    const getEmployeeBadgeVariant = (employee: TurnoData) => {
        const isAmzoma = employee.amzoma === true || employee.amzoma === 'true' || employee.amzoma === 1;
        return isAmzoma ? 'secondary' : 'default';
    };

    return (
        <div className="h-full flex flex-col gap-6 p-6">
                {/* Búsqueda */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar funcionarios..."
                        value={localSearchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-blue-400"
                    />
                </div>

                {/* Botones de acción masiva */}
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            console.log('🔄 Botón "Agregar Todos" clickeado');
                            console.log('📊 availableEmployees disponibles:', availableEmployees.length);
                            addAllEmployees();
                        }}
                        className="flex-1 h-10 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/30"
                        disabled={availableEmployees.length === 0}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Todos
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            console.log('🗑️ Botón "Limpiar Todo" clickeado');
                            console.log('📊 rowData actual:', rowData.length);
                            clearAllEmployees();
                        }}
                        className="flex-1 h-10 bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200 hover:border-rose-300 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800 dark:hover:bg-rose-900/30"
                        disabled={rowData.length === 0}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Limpiar Todo
                    </Button>
                </div>

                {/* Lista de empleados disponibles */}
                <div className="flex-1">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Funcionarios Disponibles
                        </h3>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {filteredAvailableEmployees.length} disponibles
                        </span>
                    </div>

                    <ScrollArea className={`border border-slate-200 rounded-lg shadow-sm dark:border-slate-700 dark:bg-slate-800 ${isMobile ? 'h-[calc(100vh-400px)]' : 'h-[300px]'}`}>
                        <div className="p-3 space-y-2">
                            {filteredAvailableEmployees.length === 0 ? (
                                <div className="text-center text-slate-500 dark:text-slate-400 py-4">
                                    {localSearchTerm ? 'No se encontraron empleados' : 'No hay empleados disponibles'}
                                </div>
                            ) : (
                                filteredAvailableEmployees.map((employee) => {
                                    const isSelected = isEmployeeSelected(employee);
                                    const displayName = getEmployeeDisplayName(employee);
                                    const badgeVariant = getEmployeeBadgeVariant(employee);

                                    return (
                                        <div
                                            key={getEmployeeId(employee)}
                                            className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                                                isSelected
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20'
                                                    : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <Badge
                                                    variant={badgeVariant}
                                                    className={`text-xs font-medium px-2 py-1 shrink-0 ${
                                                        employee.amzoma === true || employee.amzoma === 'true' || employee.amzoma === 1
                                                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                                                            : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                                    }`}
                                                >
                                                    {employee.amzoma === true || employee.amzoma === 'true' || employee.amzoma === 1 ? 'AMZOMA' : 'MUNICIPAL'}
                                                </Badge>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{displayName}</span>
                                            </div>

                                            {isSelected ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRemoveEmployee(employee)}
                                                    className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-900/20 shrink-0"
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAddEmployee(employee)}
                                                    className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-900/20 shrink-0"
                                                >
                                                    <UserPlus className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Resumen */}
                <div className="border-t border-slate-100 pt-4 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Seleccionados</span>
                            </div>
                            <div className="mt-1 text-lg font-semibold text-emerald-800 dark:text-emerald-200">{rowData.length}</div>
                        </div>
                        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Disponibles</span>
                            </div>
                            <div className="mt-1 text-lg font-semibold text-blue-800 dark:text-blue-200">{availableEmployees.length}</div>
                        </div>
                    </div>
                </div>
        </div>
    );
}
