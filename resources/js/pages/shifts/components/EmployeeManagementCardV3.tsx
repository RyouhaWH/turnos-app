import { Input } from '@/components/ui/input';
import { Users, UserPlus, UserMinus, ChevronDown } from 'lucide-react';
import { memo, useMemo, useState } from 'react';

interface TurnoData {
    id: string;
    nombre: string;
    amzoma?: boolean | string | number;
    first_name?: string;
    paternal_lastname?: string;
    [key: string]: string | boolean | number | undefined;
}

interface EmployeeManagementCardV3Props {
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
}

export const EmployeeManagementCardV3 = memo(({
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
}: EmployeeManagementCardV3Props) => {
    // Estado para grupos colapsados
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

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

    // Función para alternar grupo colapsado
    const toggleGroup = (groupType: string) => {
        setCollapsedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupType)) {
                newSet.delete(groupType);
            } else {
                newSet.add(groupType);
            }
            return newSet;
        });
    };

    // Función para agregar/quitar todos los empleados de un grupo
    const handleGroupAction = (groupType: string, action: 'add' | 'remove') => {
        const groupEmployees = allEmployees.filter(emp => {
            const isAmzoma = isAmzomaEmployee(emp);
            return groupType === 'amzoma' ? isAmzoma : !isAmzoma;
        });

        if (action === 'add') {
            groupEmployees.forEach(emp => {
                const employeeId = getEmployeeId(emp);
                const isInGrid = rowData.some(e => getEmployeeId(e) === employeeId);
                if (!isInGrid) {
                    addEmployeeToGrid(emp);
                }
            });
        } else {
            groupEmployees.forEach(emp => {
                const employeeId = getEmployeeId(emp);
                const isInGrid = rowData.some(e => getEmployeeId(e) === employeeId);
                if (isInGrid) {
                    removeEmployeeFromGrid(emp);
                }
            });
        }
    };

    // Función para manejar click en empleado
    const handleEmployeeClick = (employee: TurnoData) => {
        addEmployeeToGrid(employee);
        setTimeout(() => {
            setSearchTerm('');
        }, 0);
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
        <div className="h-full flex flex-col">
            <div className="pb-2 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="rounded-md bg-blue-100 p-1 dark:bg-blue-900">
                            <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Gestión de Funcionarios
                        </h4>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {rowData.length} en grid
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col space-y-4">
                    {/* Barra de búsqueda */}
                    <div className="mb-4">
                        <div className="relative">
                            <Input
                                type="text"
                                placeholder="Buscar funcionarios..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:text-white"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            {searchTerm && (
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lista de empleados agrupados */}
                    <div className="flex-1 overflow-y-auto space-y-4">
                        {/* Grupo Municipal */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => toggleGroup('municipal')}
                                    className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                                >
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform duration-200 ${
                                            collapsedGroups.has('municipal') ? '-rotate-90' : ''
                                        }`}
                                    />
                                    <span className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                                        Municipal ({groupedEmployees.municipal.length})
                                    </span>
                                </button>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleGroupAction('municipal', 'add')}
                                        className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                                        title="Agregar todos los municipales"
                                    >
                                        <UserPlus className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={() => handleGroupAction('municipal', 'remove')}
                                        className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title="Quitar todos los municipales"
                                    >
                                        <UserMinus className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>

                            {!collapsedGroups.has('municipal') && (
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {groupedEmployees.municipal.map((employee) => {
                                        const employeeId = getEmployeeId(employee);
                                        const isInGrid = rowData.some(e => getEmployeeId(e) === employeeId);
                                        const displayName = getDisplayName(employee);

                                        return (
                                            <div
                                                key={employeeId}
                                                className={`flex items-center justify-between p-2 rounded-md text-xs transition-colors cursor-pointer ${
                                                    isInGrid
                                                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                                        : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                                                }`}
                                                onClick={() => handleEmployeeClick(employee)}
                                            >
                                                <span className="text-slate-700 dark:text-slate-300 truncate">
                                                    {displayName}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        isInGrid ? removeEmployeeFromGrid(employee) : addEmployeeToGrid(employee);
                                                    }}
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
                                </div>
                            )}
                        </div>

                        {/* Grupo Amzoma */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => toggleGroup('amzoma')}
                                    className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                                >
                                    <ChevronDown
                                        className={`h-4 w-4 transition-transform duration-200 ${
                                            collapsedGroups.has('amzoma') ? '-rotate-90' : ''
                                        }`}
                                    />
                                    <span className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                                        Amzoma ({groupedEmployees.amzoma.length})
                                    </span>
                                </button>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleGroupAction('amzoma', 'add')}
                                        className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded transition-colors"
                                        title="Agregar todos los de Amzoma"
                                    >
                                        <UserPlus className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={() => handleGroupAction('amzoma', 'remove')}
                                        className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                        title="Quitar todos los de Amzoma"
                                    >
                                        <UserMinus className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>

                            {!collapsedGroups.has('amzoma') && (
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {groupedEmployees.amzoma.map((employee) => {
                                        const employeeId = getEmployeeId(employee);
                                        const isInGrid = rowData.some(e => getEmployeeId(e) === employeeId);
                                        const displayName = getDisplayName(employee);

                                        return (
                                            <div
                                                key={employeeId}
                                                className={`flex items-center justify-between p-2 rounded-md text-xs transition-colors cursor-pointer ${
                                                    isInGrid
                                                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                                        : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                                                }`}
                                                onClick={() => handleEmployeeClick(employee)}
                                            >
                                                <span className="text-slate-700 dark:text-slate-300 truncate">
                                                    {displayName}
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        isInGrid ? removeEmployeeFromGrid(employee) : addEmployeeToGrid(employee);
                                                    }}
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
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botones de acción global */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
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
                        <div className="flex justify-center">
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                                {rowData.length} de {allEmployees.length} en planilla
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
