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
            return `${employee.first_name} ${employee.paternal_lastname}`;
        }
        return employee.nombre || 'Empleado sin nombre';
    };

    const getEmployeeBadgeVariant = (employee: TurnoData) => {
        const isAmzoma = employee.amzoma === true || employee.amzoma === 'true' || employee.amzoma === 1;
        return isAmzoma ? 'secondary' : 'default';
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5" />
                    Gestión de Empleados
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-4">
                {/* Búsqueda */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar empleados..."
                        value={localSearchTerm}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Botones de acción masiva */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            console.log('🔄 Botón "Agregar Todos" clickeado');
                            console.log('📊 availableEmployees disponibles:', availableEmployees.length);
                            addAllEmployees();
                        }}
                        className="flex-1"
                        disabled={availableEmployees.length === 0}
                    >
                        <Plus className="h-4 w-4 mr-1" />
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
                        className="flex-1"
                        disabled={rowData.length === 0}
                    >
                        <X className="h-4 w-4 mr-1" />
                        Limpiar Todo
                    </Button>
                </div>

                {/* Lista de empleados disponibles */}
                <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-2">
                        Empleados disponibles ({filteredAvailableEmployees.length})
                    </div>

                    <ScrollArea className="h-[300px] border rounded-md">
                        <div className="p-2 space-y-1">
                            {filteredAvailableEmployees.length === 0 ? (
                                <div className="text-center text-gray-500 py-4">
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
                                            className={`flex items-center justify-between p-1 rounded-md border transition-colors overflow-visible ${
                                                isSelected
                                                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <Badge variant={badgeVariant} className="text-[10px] leading-none py-0.5 px-1.5 shrink-0">
                                                    {employee.amzoma === true || employee.amzoma === 'true' || employee.amzoma === 1 ? 'AMZOMA' : 'MUNICIPAL'}
                                                </Badge>
                                                <span className="text-xs truncate">{displayName}</span>
                                            </div>

                                            {isSelected ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleRemoveEmployee(employee)}
                                                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 shrink-0"
                                                >
                                                    <UserMinus className="h-3.5 w-3.5" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAddEmployee(employee)}
                                                    className="h-7 w-7 p-0 text-green-600 hover:text-green-700 shrink-0"
                                                >
                                                    <UserPlus className="h-3.5 w-3.5" />
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
                <div className="border-t pt-3">
                    <div className="text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Empleados seleccionados:</span>
                            <span className="font-medium">{rowData.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Disponibles:</span>
                            <span className="font-medium">{availableEmployees.length}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
