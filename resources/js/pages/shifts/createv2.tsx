import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useShiftsManager } from './hooks/useShiftsManager';
import { ShiftsGrid } from './components/ShiftsGrid';
import { ShiftsControls } from './components/ShiftsControls';
import { RightPanel } from './components/RightPanel';
import { useMemo, useCallback } from 'react';
import { Users, UserPlus, UserMinus } from 'lucide-react';
import { Input } from '@/components/ui/input';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Crear Turnos',
        href: '/shifts/create',
    },
];

export default function ShiftsManager({ turnos, employee_rol_id }: any) {
    const isMobile = useIsMobile();

    const {
        // Estados
        rowData,
        filteredRowData,
        resumen,
        comentario,
        selectedDate,
        currentMonthTitle,
        loading,
        isChangesExpanded,
        isHistoryExpanded,
        resetGrid,
        isUndoing,
        originalChangeDate,
        isSaving,
        showPendingChanges,
        clearChanges,
        searchTerm,
        selectedEmployees,
        availableEmployees,
        showEmployeeSelector,
        filteredAvailableEmployees,
        listaCambios,
        hasEditPermissions,
        processing,
        errors,

        // Funciones
        setSelectedDate,

        setIsChangesExpanded,
        setIsHistoryExpanded,
        setSearchTerm,
        setShowEmployeeSelector,
        cargarTurnosPorMes,
        handleResumenUpdate,
        undoLastChange,
        undoSpecificChange,
        registerChange,
        limpiarTodosLosCambios,
        handleActualizarCambios,
        getTotalEmployees,
        getEmployeeId,
        addEmployeeToGrid,
        removeEmployeeFromGrid,
        addMultipleEmployees,
        clearAllEmployees,
        addAllEmployees,
        closeEmployeeSelector,
        filterData,
        filterAvailableEmployees,
    } = useShiftsManager(employee_rol_id);

    // Memoizar props para ShiftsGrid
    const shiftsGridProps = useMemo(() => ({
        employee_rol_id,
        currentMonthTitle,
        loading,
        selectedDate,
        setSelectedDate,
        cargarTurnosPorMes,
        getTotalEmployees,
        listaCambios,
        originalChangeDate,
        filteredRowData,
        handleResumenUpdate,
        hasEditPermissions,
        resetGrid,
        registerChange,
        isUndoing,
        showPendingChanges,
        clearChanges,
        isMobile,
    }), [
        employee_rol_id,
        currentMonthTitle,
        loading,
        selectedDate,
        setSelectedDate,
        cargarTurnosPorMes,
        getTotalEmployees,
        listaCambios,
        originalChangeDate,
        filteredRowData,
        handleResumenUpdate,
        hasEditPermissions,
        resetGrid,
        registerChange,
        isUndoing,
        showPendingChanges,
        clearChanges,
        isMobile,
    ]);

    // Memoizar props para ShiftsControls
    const shiftsControlsProps = useMemo(() => ({
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
        isMobile,
    }), [
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
        isMobile,
    ]);

    // Función para obtener nombre de visualización
    const getDisplayName = useCallback((employee: any) => {
        return employee.first_name && employee.paternal_lastname
            ? `${employee.first_name.split(' ')[0]} ${employee.paternal_lastname}`
            : employee.nombre;
    }, []);

    // Función para manejar click en empleado
    const handleEmployeeClick = useCallback((employee: any) => {
        addEmployeeToGrid(employee);
        setTimeout(() => {
            setSearchTerm('');
        }, 0);
    }, [addEmployeeToGrid, setSearchTerm]);

    // Combinar todos los empleados
    const allEmployees = useMemo(() => {
        const employeeMap = new Map<string, any>();
        
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
    }, [availableEmployees, rowData, getEmployeeId, getDisplayName]);

    // Filtrar empleados según el término de búsqueda
    const filteredAllEmployees = useMemo(() => {
        if (!searchTerm.trim()) return allEmployees;
        
        return allEmployees.filter(employee => {
            const displayName = getDisplayName(employee).toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            return displayName.includes(searchLower);
        });
    }, [allEmployees, searchTerm, getDisplayName]);

    // Memoizar props para RightPanel
    const rightPanelProps = useMemo(() => ({
        isChangesExpanded,
        setIsChangesExpanded,
        isHistoryExpanded,
        setIsHistoryExpanded,
        hasEditPermissions,
        resumen,
        handleActualizarCambios,
        isSaving,
        originalChangeDate,
        selectedDate,
        undoLastChange,
        undoSpecificChange,
        limpiarTodosLosCambios,
        listaCambios,
        employee_rol_id,
        isMobile,
    }), [
        isChangesExpanded,
        setIsChangesExpanded,
        isHistoryExpanded,
        setIsHistoryExpanded,
        hasEditPermissions,
        resumen,
        handleActualizarCambios,
        isSaving,
        originalChangeDate,
        selectedDate,
        undoLastChange,
        undoSpecificChange,
        limpiarTodosLosCambios,
        listaCambios,
        employee_rol_id,
        isMobile,
    ]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Turnos" />

            <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
                {/* Main Content */}
                <div className={isMobile ? "p-0" : "p-6"}>
                    <div className={`flex h-[calc(100vh-120px)] ${isMobile ? 'flex-col gap-4' : 'flex-col gap-6 xl:flex-row'}`}>
                        {/* Left Panel - Data Grid */}
                        <div className="min-w-0 flex-1">
                            {/* Controles básicos */}
                            <ShiftsControls {...shiftsControlsProps} />

                            {/* Tarjeta de gestión de funcionarios - después de controles, antes de grid */}
                            <div className={`mb-4 ${isMobile ? 'px-4' : 'px-2'}`}>
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                                    {/* Header de la tarjeta */}
                                    <div
                                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                        onClick={() => setShowEmployeeSelector(!showEmployeeSelector)}
                                    >
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Users className="h-5 w-5" />
                                            Gestión de Funcionarios ({availableEmployees.length})
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-600 dark:text-slate-400">
                                                {rowData.length} en grid
                                            </span>
                                            <svg
                                                className={`h-5 w-5 text-slate-400 transition-transform ${showEmployeeSelector ? 'rotate-90' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Contenido expandible */}
                                    {showEmployeeSelector && (
                                        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
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
                                                                className={`flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0 cursor-pointer transition-colors ${
                                                                    isInGrid
                                                                        ? 'hover:bg-red-50 dark:hover:bg-red-900/20 bg-slate-50 dark:bg-slate-700/50'
                                                                        : 'hover:bg-green-50 dark:hover:bg-green-900/20'
                                                                }`}
                                                                onClick={() => handleEmployeeClick(employee)}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                                                        isInGrid
                                                                            ? 'border-red-300 dark:border-red-600'
                                                                            : 'border-green-300 dark:border-green-600'
                                                                    }`}>
                                                                        {isInGrid ? (
                                                                            <UserMinus className="h-3 w-3 text-red-600 dark:text-red-400" />
                                                                        ) : (
                                                                            <UserPlus className="h-3 w-3 text-green-600 dark:text-green-400" />
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
                                                                </div>
                                                                <span className={`text-xs font-medium ${
                                                                    isInGrid
                                                                        ? 'text-red-600 dark:text-red-400'
                                                                        : 'text-green-600 dark:text-green-400'
                                                                }`}>
                                                                    {isInGrid ? 'Quitar del grid' : 'Agregar al grid'}
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
                                    )}
                                </div>
                            </div>

                            <ShiftsGrid {...shiftsGridProps} />
                        </div>

                        {/* Right Panel - Controls & History */}
                        <RightPanel {...rightPanelProps} />
                    </div>
                </div>

                <Toaster
                    richColors
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(226, 232, 240, 0.5)',
                        },
                    }}
                />
            </div>
        </AppLayout>
    );
}
