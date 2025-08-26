import { Input } from '@/components/ui/input';
import { Plus, Check, Users, UserPlus, UserMinus, Clock } from 'lucide-react';
import { memo, useState, useMemo } from 'react';

interface TurnoData {
    id: string;
    nombre: string;
    [key: string]: string;
}

interface ShiftsControlsProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    showEmployeeSelector: boolean;
    setShowEmployeeSelector: (show: boolean) => void;
    filteredRowData: TurnoData[];
    rowData: TurnoData[];
    filteredAvailableEmployees: TurnoData[];
    selectedEmployees: Set<string>;
    availableEmployees: TurnoData[];
    getEmployeeId: (employee: TurnoData) => string;
    addEmployeeToGrid: (employee: TurnoData) => void;
    removeEmployeeFromGrid: (employee: TurnoData) => void;
    addAllEmployees: () => void;
    clearAllEmployees: () => void;
    closeEmployeeSelector: () => void;
    isMobile?: boolean;
}

export const ShiftsControls = memo(({
    searchTerm,
    setSearchTerm,
    showEmployeeSelector,
    setShowEmployeeSelector,
    filteredRowData,
    rowData,
    filteredAvailableEmployees,
    selectedEmployees,
    availableEmployees,
    getEmployeeId,
    addEmployeeToGrid,
    removeEmployeeFromGrid,
    addAllEmployees,
    clearAllEmployees,
    closeEmployeeSelector,
    isMobile = false,
}: ShiftsControlsProps) => {
    // Estado para mantener historial de empleados recientes
    const [recentEmployees, setRecentEmployees] = useState<TurnoData[]>([]);
    // Estado para empleados seleccionados temporalmente (antes de agregar al grid)
    const [tempSelectedEmployees, setTempSelectedEmployees] = useState<Set<string>>(new Set());

    // Función para obtener nombre de visualización
    const getDisplayName = (employee: TurnoData) => {
        return employee.first_name && employee.paternal_lastname
            ? `${employee.first_name.split(' ')[0]} ${employee.paternal_lastname}`
            : employee.nombre;
    };

    // Función para manejar selección temporal de empleados
    const handleTempEmployeeSelection = (employee: TurnoData) => {
        const employeeId = getEmployeeId(employee);
        setTempSelectedEmployees(prev => {
            const newSet = new Set(prev);
            if (newSet.has(employeeId)) {
                newSet.delete(employeeId);
            } else {
                newSet.add(employeeId);
            }
            return newSet;
        });
    };

    // Función para agregar empleados seleccionados al grid
    const handleAddSelectedToGrid = () => {
        tempSelectedEmployees.forEach(employeeId => {
            const employee = availableEmployees.find(emp => getEmployeeId(emp) === employeeId) ||
                           allEmployees.find(emp => getEmployeeId(emp) === employeeId);
            if (employee) {
                addEmployeeToGrid(employee);
                addToRecentEmployees(employee);
            }
        });
        // Limpiar selección temporal
        setTempSelectedEmployees(new Set());
        // Limpiar búsqueda
        setSearchTerm('');
    };

    // Función para limpiar selección temporal
    const handleClearTempSelection = () => {
        setTempSelectedEmployees(new Set());
    };

    // Función para agregar empleado al historial de recientes
    const addToRecentEmployees = (employee: TurnoData) => {
        setRecentEmployees(prev => {
            const employeeId = getEmployeeId(employee);
            // Evitar duplicados
            if (prev.some(emp => getEmployeeId(emp) === employeeId)) {
                return prev;
            }
            // Mantener máximo 5 empleados recientes
            const newRecent = [employee, ...prev.slice(0, 4)];
            return newRecent;
        });
    };

    // Función para agregar empleado filtrado (desde el botón rápido)
    const handleQuickAdd = () => {
        const firstAvailable = filteredAvailableEmployees[0];
        if (firstAvailable) {
            addEmployeeToGrid(firstAvailable);
            addToRecentEmployees(firstAvailable);
            setSearchTerm(''); // Limpiar búsqueda después de agregar
        }
    };

    // Combinar todos los empleados y determinar su estado
    const allEmployees = useMemo(() => {
        const employeeMap = new Map<string, TurnoData>();

        // Agregar todos los empleados disponibles
        availableEmployees.forEach(emp => {
            const id = getEmployeeId(emp);
            employeeMap.set(id, emp);
        });

        // Agregar empleados en el grid (pueden no estar en availableEmployees)
        rowData.forEach(emp => {
            const id = getEmployeeId(emp);
            if (!employeeMap.has(id)) {
                employeeMap.set(id, emp);
            }
        });

        return Array.from(employeeMap.values()).sort((a, b) => {
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

    // Obtener empleados seleccionados temporalmente
    const selectedEmployeesList = useMemo(() => {
        return Array.from(tempSelectedEmployees).map(employeeId => {
            return allEmployees.find(emp => getEmployeeId(emp) === employeeId);
        }).filter(Boolean) as TurnoData[];
    }, [tempSelectedEmployees, allEmployees, getEmployeeId]);

    return (
        <>
            {/* Barra de búsqueda unificada */}
            <div className={`mb-4 ${isMobile ? 'px-4' : 'px-2'}`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className="relative flex-1">
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

                    {/* Botón para agregar funcionario filtrado */}
                    {searchTerm && filteredAvailableEmployees.length > 0 && (
                        <button
                            onClick={handleQuickAdd}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                            title={`Agregar "${getDisplayName(filteredAvailableEmployees[0])}" al grid`}
                        >
                            <UserPlus className="h-4 w-4" />
                            <span className="hidden sm:inline">Agregar</span>
                        </button>
                    )}

                    {/* Botón para mostrar/ocultar selector */}
                    <button
                        onClick={() => setShowEmployeeSelector(!showEmployeeSelector)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                    >
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Gestionar Funcionarios</span>
                    </button>
                </div>

                {/* Contador y controles */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {searchTerm && (
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Mostrando {filteredAllEmployees.length} de {allEmployees.length} funcionarios
                            </p>
                        )}
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Total en grid: {rowData.length} funcionarios
                        </p>
                    </div>

                    {rowData.length > 0 && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={addAllEmployees}
                                className="text-xs px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded transition-colors"
                            >
                                Agregar Todos
                            </button>
                            <button
                                onClick={clearAllEmployees}
                                className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                            >
                                Limpiar Grid
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Selector unificado de funcionarios */}
            {showEmployeeSelector && (
                <div className={`mb-4 ${isMobile ? 'px-4' : 'px-2'}`}>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Gestionar Funcionarios ({allEmployees.length})
                            </h3>
                            <button
                                onClick={closeEmployeeSelector}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Empleados seleccionados temporalmente */}
                        {selectedEmployeesList.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                    <Check className="h-4 w-4" />
                                    Seleccionados para agregar ({selectedEmployeesList.length})
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                                    {selectedEmployeesList.map((employee) => {
                                        const employeeId = getEmployeeId(employee);
                                        const displayName = getDisplayName(employee);

                                        return (
                                            <div
                                                key={employeeId}
                                                className="flex items-center justify-between p-2 rounded-lg border bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700"
                                            >
                                                <span className="text-sm text-slate-900 dark:text-white truncate">
                                                    {displayName}
                                                </span>
                                                <button
                                                    onClick={() => handleTempEmployeeSelection(employee)}
                                                    className="text-xs px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50"
                                                >
                                                    Quitar
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-2 mb-4">
                                    <button
                                        onClick={handleAddSelectedToGrid}
                                        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        Añadir a la Grid ({selectedEmployeesList.length})
                                    </button>
                                    <button
                                        onClick={handleClearTempSelection}
                                        className="flex items-center gap-2 px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
                                    >
                                        Limpiar Selección
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Empleados recientes */}
                        {recentEmployees.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Agregados Recientemente
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                                    {recentEmployees.map((employee) => {
                                        const employeeId = getEmployeeId(employee);
                                        const isInGrid = rowData.some(emp => getEmployeeId(emp) === employeeId);
                                        const displayName = getDisplayName(employee);

                                        return (
                                            <div
                                                key={employeeId}
                                                className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                                                    isInGrid
                                                        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                                                        : 'bg-slate-50 border-slate-200 dark:bg-slate-700/50 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                }`}
                                                onClick={() => {
                                                    if (!isInGrid) {
                                                        handleTempEmployeeSelection(employee);
                                                    }
                                                }}
                                            >
                                                <span className="text-sm text-slate-900 dark:text-white truncate">
                                                    {displayName}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    isInGrid
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                                }`}>
                                                    {isInGrid ? 'En Grid' : 'Seleccionar'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Lista unificada de todos los funcionarios */}
                        <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                            {filteredAllEmployees.length > 0 ? (
                                filteredAllEmployees.map((employee) => {
                                    const employeeId = getEmployeeId(employee);
                                    const isInGrid = rowData.some(emp => getEmployeeId(emp) === employeeId);
                                    const isTempSelected = tempSelectedEmployees.has(employeeId);
                                    const displayName = getDisplayName(employee);

                                    return (
                                        <div
                                            key={employeeId}
                                            className={`flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0 cursor-pointer transition-colors ${
                                                isInGrid
                                                    ? 'hover:bg-red-50 dark:hover:bg-red-900/20 bg-slate-50 dark:bg-slate-700/50'
                                                    : isTempSelected
                                                    ? 'hover:bg-green-50 dark:hover:bg-green-900/20 bg-green-50 dark:bg-green-900/20'
                                                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                            }`}
                                            onClick={() => {
                                                if (isInGrid) {
                                                    removeEmployeeFromGrid(employee);
                                                } else {
                                                    handleTempEmployeeSelection(employee);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                                    isInGrid
                                                        ? 'border-red-300 dark:border-red-600'
                                                        : isTempSelected
                                                        ? 'border-green-300 dark:border-green-600 bg-green-600'
                                                        : 'border-slate-300 dark:border-slate-600'
                                                }`}>
                                                    {isInGrid ? (
                                                        <UserMinus className="h-3 w-3 text-red-600 dark:text-red-400" />
                                                    ) : isTempSelected ? (
                                                        <Check className="h-3 w-3 text-white" />
                                                    ) : (
                                                        <UserPlus className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                                                    )}
                                                </div>
                                                <span className="text-slate-900 dark:text-white">
                                                    {displayName}
                                                </span>
                                                {isInGrid && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-1 rounded-full">
                                                        En Grid
                                                    </span>
                                                )}
                                                {isTempSelected && !isInGrid && (
                                                    <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-full">
                                                        Seleccionado
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-xs font-medium ${
                                                isInGrid
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : isTempSelected
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-slate-500 dark:text-slate-400'
                                            }`}>
                                                {isInGrid ? 'Quitar del grid' : isTempSelected ? 'Deseleccionar' : 'Seleccionar'}
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                                    {searchTerm ? 'No se encontraron funcionarios' : 'No hay funcionarios disponibles'}
                                </div>
                            )}
                        </div>

                        {/* Controles de acción */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                {rowData.length} de {allEmployees.length} funcionarios en el grid
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={addAllEmployees}
                                    className="text-sm px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center gap-1"
                                >
                                    <UserPlus className="h-3 w-3" />
                                    Agregar Todos
                                </button>
                                <button
                                    onClick={clearAllEmployees}
                                    className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center gap-1"
                                >
                                    <UserMinus className="h-3 w-3" />
                                    Limpiar Grid
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});
