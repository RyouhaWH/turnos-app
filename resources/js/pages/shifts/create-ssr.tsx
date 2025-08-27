import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useShiftsManager } from './hooks/useShiftsManager';
import { ProgressiveGrid } from '@/components/ui/progressive-grid';
import { ShiftsControls } from './components/ShiftsControls';
import { RightPanel } from './components/RightPanel';
import { useMemo, Suspense, lazy } from 'react';

// Lazy loading para componentes pesados
const ShiftsGrid = lazy(() => import('./components/ShiftsGrid').then(module => ({ default: module.ShiftsGrid })));

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Crear Turnos (SSR)',
        href: '/shifts/create-ssr',
    },
];

// Componente de carga optimizado
const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
);

export default function ShiftsManagerSSR({ turnos, employee_rol_id }: any) {
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

    // Memoizar props para optimizar re-renders
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
            <Head title="Gestión de Turnos (SSR Optimizado)" />

            <div className="h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
                {/* Main Content */}
                <div className="p-6">
                    <div className="flex h-[calc(100vh-120px)] flex-col gap-6 xl:flex-row">
                        {/* Left Panel - Data Grid */}
                        <div className="min-w-0 flex-1">
                            <Suspense fallback={<LoadingSpinner />}>
                                <ShiftsGrid {...shiftsGridProps} />
                            </Suspense>
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
