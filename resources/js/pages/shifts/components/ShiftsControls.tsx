import { Input } from '@/components/ui/input';
import { Plus, Check, Users, UserPlus, UserMinus } from 'lucide-react';
import { memo, useState } from 'react';

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
    const [activeTab, setActiveTab] = useState<'grid' | 'available'>('grid');

    // Función para obtener nombre de visualización
    const getDisplayName = (employee: TurnoData) => {
        return employee.first_name && employee.paternal_lastname
            ? `${employee.first_name.split(' ')[0]} ${employee.paternal_lastname}`
            : employee.nombre;
    };

    // Función para manejar click en empleado
    const handleEmployeeClick = (employee: TurnoData, isInGrid: boolean) => {
        if (isInGrid) {
            removeEmployeeFromGrid(employee);
        } else {
            addEmployeeToGrid(employee);
        }
    };

    return (
        <>
            {/* Barra de búsqueda unificada */}
            <div className={`mb-4 ${isMobile ? 'px-4' : 'px-2'}`}>
                <div className="flex items-center gap-3 mb-3">
                    <div className="relative flex-1">
                        <Input
                            type="text"
                            placeholder="Buscar funcionarios en grid y disponibles..."
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
                                Mostrando {filteredRowData.length} de {rowData.length} funcionarios en grid
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
                                Gestionar Funcionarios
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

                        {/* Tabs para navegar entre secciones */}
                        <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
                            <button
                                onClick={() => setActiveTab('grid')}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'grid'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                            >
                                <UserMinus className="h-4 w-4" />
                                En Grid ({filteredRowData.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('available')}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                    activeTab === 'available'
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                                }`}
                            >
                                <UserPlus className="h-4 w-4" />
                                Disponibles ({filteredAvailableEmployees.length})
                            </button>
                        </div>

                        {/* Contenido de las tabs */}
                        <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                            {activeTab === 'grid' ? (
                                // Empleados en el grid
                                filteredRowData.length > 0 ? (
                                    filteredRowData.map((employee) => {
                                        const employeeId = getEmployeeId(employee);
                                        const displayName = getDisplayName(employee);

                                        return (
                                            <div
                                                key={employeeId}
                                                className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
                                                onClick={() => handleEmployeeClick(employee, true)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-4 h-4 rounded border-2 border-red-300 dark:border-red-600 flex items-center justify-center">
                                                        <UserMinus className="h-3 w-3 text-red-600 dark:text-red-400" />
                                                    </div>
                                                    <span className="text-slate-900 dark:text-white">
                                                        {displayName}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                                    Remover del grid
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                                        {searchTerm ? 'No se encontraron funcionarios en el grid' : 'No hay funcionarios en el grid'}
                                    </div>
                                )
                            ) : (
                                // Empleados disponibles
                                filteredAvailableEmployees.length > 0 ? (
                                    filteredAvailableEmployees.map((employee) => {
                                        const employeeId = getEmployeeId(employee);
                                        const displayName = getDisplayName(employee);

                                        return (
                                            <div
                                                key={employeeId}
                                                className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer transition-colors"
                                                onClick={() => handleEmployeeClick(employee, false)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-4 h-4 rounded border-2 border-green-300 dark:border-green-600 flex items-center justify-center">
                                                        <UserPlus className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <span className="text-slate-900 dark:text-white">
                                                        {displayName}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                    Agregar al grid
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                                        {searchTerm ? 'No se encontraron funcionarios disponibles' : 'No hay funcionarios disponibles'}
                                    </div>
                                )
                            )}
                        </div>

                        {/* Controles de acción */}
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                {selectedEmployees.size} de {availableEmployees.length} funcionarios seleccionados
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
