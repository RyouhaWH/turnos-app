import { memo } from 'react';

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
    return (
        <>
            {/* Barra de controles simplificada */}
            <div className={`mb-4 ${isMobile ? 'px-4' : 'px-2'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
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
        </>
    );
});
