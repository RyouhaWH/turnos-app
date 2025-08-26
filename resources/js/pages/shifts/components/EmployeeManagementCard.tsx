import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserPlus, UserMinus, ChevronRight } from 'lucide-react';
import { memo, useMemo } from 'react';

interface TurnoData {
    id: string;
    nombre: string;
    [key: string]: string;
}

interface EmployeeManagementCardProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    showEmployeeSelector: boolean;
    setShowEmployeeSelector: (show: boolean) => void;
    rowData: TurnoData[];
    availableEmployees: TurnoData[];
    getEmployeeId: (employee: TurnoData) => string;
    addEmployeeToGrid: (employee: TurnoData) => void;
    removeEmployeeFromGrid: (employee: TurnoData) => void;
    addAllEmployees: () => void;
    clearAllEmployees: () => void;
    isMobile?: boolean;
}

export const EmployeeManagementCard = memo(({
    searchTerm,
    setSearchTerm,
    showEmployeeSelector,
    setShowEmployeeSelector,
    rowData,
    availableEmployees,
    getEmployeeId,
    addEmployeeToGrid,
    removeEmployeeFromGrid,
    addAllEmployees,
    clearAllEmployees,
    isMobile = false,
}: EmployeeManagementCardProps) => {
    // Función para obtener nombre de visualización
    const getDisplayName = (employee: TurnoData) => {
        return employee.first_name && employee.paternal_lastname
            ? `${employee.first_name.split(' ')[0]} ${employee.paternal_lastname}`
            : employee.nombre;
    };

    // Función para manejar click en empleado
    const handleEmployeeClick = (employee: TurnoData) => {
        addEmployeeToGrid(employee);
        setTimeout(() => {
            setSearchTerm('');
        }, 0);
    };

    // Combinar todos los empleados
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

    return (
        <Card className={`${isMobile ? 'border-0 pt-2 !:mb-0 pb-0 bg-white/95 dark:bg-slate-900/95 shadow-none transition-all duration-300 ease-in-out mb-0.5 hover:bg-slate-50 dark:hover:bg-slate-800/50' : 'border-slate-200/50 bg-white/90 shadow-xl backdrop-blur-sm dark:bg-slate-900/90'}`}>
            <CardHeader
                className={`cursor-pointer pb-2 transition-colors ${isMobile ? 'border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 py-3' : 'border-b border-slate-100 hover:bg-slate-100/50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-700/50'}`}
                onClick={() => setShowEmployeeSelector(!showEmployeeSelector)}
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
                        {/* <span className="text-xs text-slate-500 dark:text-slate-400">
                            {rowData.length} en grid
                        </span> */}
                        <ChevronRight
                            className={`h-4 w-4 text-slate-500 transition-transform duration-300 ease-in-out ${showEmployeeSelector ? 'rotate-90' : ''}`}
                        />
                    </div>
                </div>
            </CardHeader>

            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    showEmployeeSelector
                        ? 'max-h-[600px] opacity-100'
                        : 'max-h-0 opacity-0'
                }`}
            >
                <div className={`${isMobile ? 'px-1 pt-1' : 'px-2 pt-2'}`}>
                    <CardContent className="p-0">
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
                            {searchTerm && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                    Mostrando {filteredAllEmployees.length} de {allEmployees.length} funcionarios
                                </p>
                            )}
                        </div>

                        {/* Lista de funcionarios */}
                        <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                            {filteredAllEmployees.length > 0 ? (
                                filteredAllEmployees.map((employee) => {
                                    const employeeId = getEmployeeId(employee);
                                    const isInGrid = rowData.some(emp => getEmployeeId(emp) === employeeId);
                                    const displayName = getDisplayName(employee);

                                    return (
                                        <div
                                            key={employeeId}
                                            className={`flex items-center justify-between p-2 border-b border-slate-100 dark:border-slate-700 last:border-b-0 cursor-pointer transition-colors ${
                                                isInGrid
                                                    ? 'hover:bg-red-50 dark:hover:bg-red-900/20 bg-slate-50 dark:bg-slate-700/50'
                                                    : 'hover:bg-green-50 dark:hover:bg-green-900/20'
                                            }`}
                                            onClick={() => {
                                                if (isInGrid) {
                                                    removeEmployeeFromGrid(employee);
                                                } else {
                                                    handleEmployeeClick(employee);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded border-2 flex items-center justify-center ${
                                                    isInGrid
                                                        ? 'border-red-300 dark:border-red-600'
                                                        : 'border-green-300 dark:border-green-600'
                                                }`}>
                                                    {isInGrid ? (
                                                        <UserMinus className="h-2 w-2 text-red-600 dark:text-red-400" />
                                                    ) : (
                                                        <UserPlus className="h-2 w-2 text-green-600 dark:text-green-400" />
                                                    )}
                                                </div>
                                                <span className="text-sm text-slate-900 dark:text-white">
                                                    {displayName}
                                                </span>
                                                {isInGrid && (
                                                    <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                                                        En Grid
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-xs font-medium ${
                                                isInGrid
                                                    ? 'text-red-600 dark:text-red-400'
                                                    : 'text-green-600 dark:text-green-400'
                                            }`}>
                                                {isInGrid ? 'Quitar' : 'Agregar'}
                                            </span>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-3 text-center text-slate-500 dark:text-slate-400 text-sm">
                                    {searchTerm ? 'No se encontraron funcionarios' : 'No hay funcionarios disponibles'}
                                </div>
                            )}
                        </div>

                        {/* Controles de acción */}
                        <div className={`flex flex-col gap-2 ${isMobile ? 'mt-2 pt-2' : 'mt-3 pt-3'} border-t border-slate-200 dark:border-slate-700`}>
                            <div className="flex gap-1">
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
                                    {rowData.length} de {allEmployees.length} en grid
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </div>
            </div>
        </Card>
    );
});
