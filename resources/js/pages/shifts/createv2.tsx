import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useShiftsManager } from './hooks/useShiftsManager';
import { ShiftsGrid } from './components/ShiftsGrid';
import { ShiftsControls } from './components/ShiftsControls';

import { RightPanel } from './components/RightPanel';
import { useMemo } from 'react';

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
        // Props para EmployeeManagementCard
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
        // Props para EmployeeManagementCard
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
    ]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Turnos" />

            <div className="h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
                {/* Main Content */}
                <div className={isMobile ? "p-0" : "p-6"}>
                    <div className={`flex h-[calc(100vh-120px)] ${isMobile ? 'flex-col gap-4' : 'flex-col gap-6 xl:flex-row'}`}>
                        {/* Left Panel - Data Grid */}
                        <div className="min-w-0 flex-1">
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
