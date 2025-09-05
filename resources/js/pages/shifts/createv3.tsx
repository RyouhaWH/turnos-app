import { MonthYearPicker } from '@/components/month-year-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { FileSpreadsheet, Loader2, Settings, Undo2, Eye, EyeOff, Save, CheckCircle2, Bell, Users, Calendar, Menu } from 'lucide-react';
import React, { Suspense, useCallback, useMemo, useState } from 'react';
import { useOptimizedShiftsManager } from './hooks/useOptimizedShiftsManager';
import { MobileFABGroup, MobileFAB } from '@/components/ui/mobile-fab';
import { MobileDropdownMenu } from '@/components/ui/mobile-dropdown-menu';
import { MobileHeaderMenu } from '@/components/ui/mobile-header-menu';

// Lazy loading de componentes pesados
const OptimizedExcelGrid = React.lazy(() => import('@/components/ui/optimized-excel-grid'));
const ListaCambios = React.lazy(() => import('./shift-change-list'));
const EmployeeManagementCard = React.lazy(() => import('./components/EmployeeManagementCard').then(module => ({ default: module.EmployeeManagementCard })));

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Selección de facción',
        href: '/turnos',
    },
    {
        title: 'Gestión de turnos',
        href: '#',
    },
];

// Componente de loading optimizado
const OptimizedLoadingGrid = () => (
    <div className="flex h-full min-h-[500px] items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-700">
        <div className="flex flex-col items-center space-y-6">
            <div className="relative">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 dark:border-slate-600 dark:border-t-blue-400"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <FileSpreadsheet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
            <div className="text-center">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Cargando turnos optimizados...</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Preparando la experiencia mejorada</p>
            </div>
            <div className="flex space-x-2">
                <div className="h-3 w-3 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.3s]"></div>
                <div className="h-3 w-3 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.15s]"></div>
                <div className="h-3 w-3 animate-bounce rounded-full bg-blue-600"></div>
            </div>
        </div>
    </div>
);

// Componente principal optimizado
interface OptimizedShiftsManagerProps {
    turnos?: any[];
    employee_rol_id?: number;
}

export default function OptimizedShiftsManager({ turnos = [], employee_rol_id = 1 }: OptimizedShiftsManagerProps) {
    const isMobile = useIsMobile();
    const [showSummary, setShowSummary] = useState(false);
    const [showEmployeePanel, setShowEmployeePanel] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Estados para popups móviles
    const [showMobileSummaryModal, setShowMobileSummaryModal] = useState(false);
    const [showMobileEmployeeModal, setShowMobileEmployeeModal] = useState(false);
    const [showMobileDatePickerModal, setShowMobileDatePickerModal] = useState(false);

    // Funciones para manejar paneles mutuamente excluyentes (desktop) y popups (móvil)
    const handleToggleSummary = useCallback(() => {
        if (isMobile) {
            // En móvil, abrir popup modal
            setShowMobileSummaryModal(true);
        } else {
            // En desktop, comportamiento normal de panel lateral
            if (showSummary) {
                setShowSummary(false);
            } else {
                setShowSummary(true);
                setShowEmployeePanel(false);
            }
        }
    }, [isMobile, showSummary]);

    const handleToggleEmployeePanel = useCallback(() => {
        if (isMobile) {
            // En móvil, abrir popup modal
            setShowMobileEmployeeModal(true);
        } else {
            // En desktop, comportamiento normal de panel lateral
            if (showEmployeePanel) {
                setShowEmployeePanel(false);
            } else {
                setShowEmployeePanel(true);
                setShowSummary(false);
            }
        }
    }, [isMobile, showEmployeePanel]);

    // Función para manejar el selector de fecha en móvil
    const handleToggleDatePicker = useCallback(() => {
        if (isMobile) {
            setShowMobileDatePickerModal(true);
        }
    }, [isMobile]);

    // Función para abrir el popup de confirmación
    const handleOpenConfirmDialog = useCallback(() => {
        setShowConfirmDialog(true);
    }, []);

    const {
        // Estados principales
        rowData,
        filteredRowData,
        resumen,
        selectedDate,
        currentMonthTitle,
        loading,
        originalChangeDate,
        isSaving,
        showPendingChanges,
        searchTerm,
        selectedEmployees,
        availableEmployees,
        listaCambios,
        hasEditPermissions,
        processing,
        errors,
        isProcessingChanges,

        // Estados de historial
        canUndo,
        canRedo,
        changeCount,

        // Funciones principales
        setSelectedDate,
        setSearchTerm,
        cargarTurnosPorMes,
        registerChange,
        handleActualizarCambios,

        // Funciones de historial
        undoChange,
        undoSpecificChange,
        redoChange,

        // Funciones de empleados
        getEmployeeId,
        addEmployeeToGrid,
        removeEmployeeFromGrid,

        // Funciones de utilidad
        getTotalEmployees,
        filterData,
        handleResumenUpdate,
        setGridApi,
        // Estados y funciones adicionales para filtro de empleados
        filteredAvailableEmployees,
        addAllEmployees,
        clearAllEmployees,
        closeEmployeeSelector,
    } = useOptimizedShiftsManager(employee_rol_id);

    // Función para confirmar y aplicar cambios
    const handleConfirmChanges = useCallback(async () => {
        setShowConfirmDialog(false);
        // Usar una cadena vacía como comentario por defecto
        await handleActualizarCambios('');
    }, [handleActualizarCambios]);

    // Función para formatear los cambios para mostrar en el popup
    const formatChangesForDisplay = useCallback(() => {
        const changesList: Array<{
            empleado: string;
            fecha: string;
            turno: string;
            day: number;
        }> = [];

        Object.entries(resumen).forEach(([employeeId, employeeData]: [string, any]) => {
            if (employeeData && employeeData.turnos) {
                Object.entries(employeeData.turnos).forEach(([day, turno]) => {
                    const dayNumber = parseInt(day);
                    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), dayNumber);

                    changesList.push({
                        empleado: employeeData.nombre || 'Empleado desconocido',
                        fecha: date.toLocaleDateString('es-CL', {
                            day: 'numeric',
                            month: 'short'
                        }),
                        turno: String(turno) || 'Eliminar',
                        day: dayNumber
                    });
                });
            }
        });

        return changesList.sort((a, b) => a.day - b.day);
    }, [resumen, selectedDate]);

    // Memoizar el manejador de cambios de celda
    const handleCellValueChanged = useCallback(
        (change: any) => {
            registerChange(change.employeeName, change.employeeRut, change.day, change.oldValue, change.newValue);
        },
        [registerChange],
    );

    // Memoizar props del grid
    const gridProps = useMemo(
        () => ({
            rowData: filteredRowData,
            onCellValueChanged: handleCellValueChanged,
            onGridReady: setGridApi, // ¡Crucial para el sistema de undo!
            editable: hasEditPermissions && !isProcessingChanges,
            month: selectedDate.getMonth(),
            year: selectedDate.getFullYear(),
            pendingChanges: listaCambios,
            showPendingChanges,
            isProcessingChanges,
            className: 'transition-all duration-300 ease-in-out',
        }),
        [filteredRowData, handleCellValueChanged, setGridApi, hasEditPermissions, isProcessingChanges, selectedDate, listaCambios, showPendingChanges],
    );

    // Memoizar props del resumen
    const summaryProps = useMemo(
        () => ({
            cambios: resumen,
            onActualizar: handleActualizarCambios,
            isProcesing: isSaving,
            isCollapsed: false,
            selectedDate: originalChangeDate || selectedDate,
            disabled: !hasEditPermissions,
            onUndoLastChange: undoChange,
            onUndoSpecificChange: undoSpecificChange,
            onClearAllChanges: undefined, // No más función de limpiar todo
            changeHistory: listaCambios,
        }),
        [
            resumen,
            handleActualizarCambios,
            isSaving,
            originalChangeDate,
            selectedDate,
            hasEditPermissions,
            undoChange,
            undoSpecificChange,
            listaCambios,
        ],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Turnos Optimizados" />

            <div className="overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
                <div className={`overflow-hidden ${isMobile ? 'p-2' : 'p-6'}`}>
                    {/* Header compacto de página */}
                    <div className={isMobile ? 'mb-2' : 'mb-4'}>
                        <div className={`flex flex-col ${isMobile ? 'gap-1' : 'gap-2'} lg:flex-row lg:items-center lg:justify-between`}>
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2 shadow-md">
                                        <FileSpreadsheet className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-slate-900 dark:text-white flex items-center gap-2`}>
                                            {isMobile ? 'Turnos' : `Grid de Turnos - ${currentMonthTitle}`}
                                            {employee_rol_id === 1 && (
                                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 text-xs">Patrullaje</Badge>
                                            )}
                                        </h1>
                                        <div className={`flex items-center gap-3 ${isMobile ? 'mt-0.5 justify-center' : 'mt-0.5'}`}>
                                            {/* Selector de fecha solo en desktop */}
                                            {!isMobile && (
                                                <MonthYearPicker
                                                    onChange={setSelectedDate}
                                                    onLoadData={cargarTurnosPorMes}
                                                    loading={loading}
                                                    currentMonthTitle={currentMonthTitle}
                                                />
                                            )}
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {currentMonthTitle}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {!hasEditPermissions && (
                                    <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-700 text-xs">
                                        Solo lectura
                                    </Badge>
                                )}

                                {/* Controles de edición movidos aquí */}
                                {hasEditPermissions && (
                                    <>
                                        {/* Botones móviles en el header */}
                                        {isMobile && (
                                            <>
                                                {/* Botón de deshacer en móvil */}
                                                {changeCount > 0 && canUndo && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={undoChange}
                                                        disabled={!canUndo || isProcessingChanges}
                                                        className="h-8 w-8 p-0 flex items-center justify-center"
                                                        title="Deshacer último cambio"
                                                    >
                                                        <Undo2 className="h-4 w-4" />
                                                    </Button>
                                                )}

                                                {/* Botón de guardar cambios en móvil */}
                                                {changeCount > 0 && (
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={handleOpenConfirmDialog}
                                                        disabled={isProcessingChanges || isSaving}
                                                        className="h-8 w-8 p-0 flex items-center justify-center bg-green-600 hover:bg-green-700 text-white"
                                                        title="Aplicar cambios"
                                                    >
                                                        {isSaving ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Save className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                )}

                                                {/* Botón de menú en móvil */}
                                                <MobileHeaderMenu
                                                    onShowSummary={() => setShowMobileSummaryModal(true)}
                                                    onShowEmployees={() => setShowMobileEmployeeModal(true)}
                                                    onShowDatePicker={handleToggleDatePicker}
                                                    changeCount={changeCount}
                                                    employeeCount={filteredRowData.length}
                                                    availableCount={filteredAvailableEmployees.length}
                                                    currentMonthTitle={currentMonthTitle}
                                                />
                                            </>
                                        )}

                                        {/* Botón de deshacer solo en desktop */}
                                        {!isMobile && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={undoChange}
                                                disabled={!canUndo || isProcessingChanges}
                                                className="flex items-center gap-2"
                                            >
                                                <Undo2 className="h-4 w-4" />
                                                Deshacer último
                                            </Button>
                                        )}

                                        {/* Botón de empleados solo en desktop */}
                                        {!isMobile && (
                                            <Button
                                                variant={showEmployeePanel ? "ghost" : "outline"}
                                                size="sm"
                                                onClick={handleToggleEmployeePanel}
                                                className={`flex items-center gap-2 transition-all duration-300 ${
                                                    showEmployeePanel
                                                        ? 'hover:bg-slate-100'
                                                        : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300'
                                                }`}
                                                title={showEmployeePanel ? 'Ocultar gestión de empleados' : 'Mostrar gestión de empleados'}
                                            >
                                                <Users className="h-4 w-4" />
                                                {showEmployeePanel ? 'Ocultar empleados' : 'Gestionar empleados'}
                                            </Button>
                                        )}

                                        {/* Botón para toggle del resumen solo en desktop */}
                                        {!isMobile && changeCount > 0 && (
                                            <Button
                                                variant={showSummary ? "ghost" : "outline"}
                                                size="sm"
                                                onClick={handleToggleSummary}
                                                className={`flex items-center gap-2 transition-all duration-300 ${
                                                    showSummary
                                                        ? "hover:bg-slate-100"
                                                        : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 font-medium"
                                                }`}
                                                title={showSummary ? 'Ocultar resumen' : 'Mostrar resumen de cambios'}
                                            >
                                                {showSummary ? (
                                                    <>
                                                        <EyeOff className="h-4 w-4" />
                                                        Ocultar resumen
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="h-4 w-4" />
                                                        <span className="font-medium">
                                                            Ver resumen ({changeCount})
                                                        </span>
                                                    </>
                                                )}
                                            </Button>
                                        )}

                                        {/* Botón para aplicar cambios solo en desktop */}
                                        {!isMobile && changeCount > 0 && (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={handleOpenConfirmDialog}
                                                disabled={isProcessingChanges || isSaving}
                                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                {isSaving ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Aplicando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4" />
                                                        Aplicar cambios
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contenido principal */}
                    <div className={`flex overflow-hidden ${isMobile ? 'flex-col h-[calc(100vh-120px)]' : 'gap-6 h-[calc(100vh-180px)]'}`}>
                        {/* Grid principal */}
                        <div className="min-w-0 flex-1">
                            {isMobile ? (
                                // Vista móvil: Sin Card, ocupa todo el ancho con padding para FAB
                                <div className="h-full w-full pb-12 min-h-[calc(100vh-200px)] mt-4">
                                    {loading ? (
                                        <OptimizedLoadingGrid />
                                    ) : (
                                        <Suspense fallback={<OptimizedLoadingGrid />}>
                                            <div className="ag-theme-alpine h-full w-full">
                                                <OptimizedExcelGrid {...gridProps} />
                                            </div>
                                        </Suspense>
                                    )}
                                </div>
                            ) : (
                                // Vista desktop: Con Card y estilos
                                <Card className="h-full border-slate-200/50 shadow-xl backdrop-blur-sm dark:bg-slate-900/90">
                                    <CardContent className="flex h-full flex-col p-0">
                                        <div className="flex-1 overflow-hidden">
                                            {loading ? (
                                                <OptimizedLoadingGrid />
                                            ) : (
                                                <Suspense fallback={<OptimizedLoadingGrid />}>
                                                    <div className="ag-theme-alpine h-full">
                                                        <OptimizedExcelGrid {...gridProps} />
                                                    </div>
                                                </Suspense>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Panel lateral - Resumen de cambios */}
                        {!isMobile && hasEditPermissions && changeCount > 0 && showSummary && (
                            <div className="w-96 flex-shrink-0 h-full">
                                <Suspense
                                    fallback={
                                        <div className="flex h-full items-center justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    }
                                >
                                    <ListaCambios {...summaryProps} />
                                </Suspense>
                            </div>
                        )}

                        {/* Panel de gestión de empleados - Solo desktop */}
                        {!isMobile && hasEditPermissions && showEmployeePanel && (
                            <div className="w-96 flex-shrink-0 h-full">
                                <Suspense
                                    fallback={
                                        <div className="flex h-full items-center justify-center">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </div>
                                    }
                                >
                                    <EmployeeManagementCard
                                        searchTerm={searchTerm}
                                        setSearchTerm={setSearchTerm}
                                        rowData={filteredRowData}
                                        availableEmployees={filteredAvailableEmployees}
                                        getEmployeeId={getEmployeeId}
                                        addEmployeeToGrid={addEmployeeToGrid}
                                        removeEmployeeFromGrid={removeEmployeeFromGrid}
                                        addAllEmployees={addAllEmployees}
                                        clearAllEmployees={clearAllEmployees}
                                        isMobile={isMobile}
                                    />
                                </Suspense>
                            </div>
                        )}

                    </div>

                </div>

                {/* Modal móvil - Resumen de cambios */}
                <Dialog open={showMobileSummaryModal} onOpenChange={setShowMobileSummaryModal}>
                    <DialogContent className="max-w-[95vw] max-h-[90vh] w-full h-full p-0 mx-auto">
                        <DialogHeader className="px-4 py-3 border-b bg-white dark:bg-slate-900">
                            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                                <Eye className="h-5 w-5" />
                                Resumen de Cambios
                            </DialogTitle>
                            <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                                {changeCount} cambio{changeCount !== 1 ? 's' : ''} pendiente{changeCount !== 1 ? 's' : ''} por aplicar
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto px-4 py-3 bg-slate-50 dark:bg-slate-800">
                            <Suspense
                                fallback={
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                }
                            >
                                <ListaCambios {...summaryProps} />
                            </Suspense>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Modal móvil - Gestión de empleados */}
                <Dialog open={showMobileEmployeeModal} onOpenChange={setShowMobileEmployeeModal}>
                    <DialogContent className="max-w-[95vw] max-h-[90vh] w-full h-full p-0 mx-auto">
                        <DialogHeader className="px-4 py-3 border-b bg-white dark:bg-slate-900">
                            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                                <Users className="h-5 w-5" />
                                Gestión de Funcionarios
                            </DialogTitle>
                            <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                                {filteredRowData.length} empleados en grid • {filteredAvailableEmployees.length} disponibles
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto px-4 py-3 bg-slate-50 dark:bg-slate-800">
                            <Suspense
                                fallback={
                                    <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </div>
                                }
                            >
                                <EmployeeManagementCard
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    rowData={filteredRowData}
                                    availableEmployees={filteredAvailableEmployees}
                                    getEmployeeId={getEmployeeId}
                                    addEmployeeToGrid={addEmployeeToGrid}
                                    removeEmployeeFromGrid={removeEmployeeFromGrid}
                                    addAllEmployees={addAllEmployees}
                                    clearAllEmployees={clearAllEmployees}
                                    isMobile={true}
                                />
                            </Suspense>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Modal móvil - Selector de fecha */}
                <Dialog open={showMobileDatePickerModal} onOpenChange={setShowMobileDatePickerModal}>
                    <DialogContent className="max-w-[95vw] max-h-[90vh] w-full h-full p-0 mx-auto">
                        <DialogHeader className="px-4 py-3 border-b bg-white dark:bg-slate-900">
                            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
                                <Calendar className="h-5 w-5" />
                                Seleccionar Fecha
                            </DialogTitle>
                            <DialogDescription className="text-sm text-slate-600 dark:text-slate-400">
                                Cambiar el mes y año para visualizar turnos
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto px-4 py-3 bg-slate-50 dark:bg-slate-800">
                            <div className="flex flex-col items-center justify-center h-full">
                                <div className="w-full max-w-sm">
                                    <MonthYearPicker
                                        onChange={setSelectedDate}
                                        onLoadData={cargarTurnosPorMes}
                                        loading={loading}
                                        currentMonthTitle={currentMonthTitle}
                                    />
                                </div>
                                <div className="mt-6 text-center">
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Actualmente visualizando: <span className="font-medium">{currentMonthTitle}</span>
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                                        {getTotalEmployees()} empleados en el grid
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Dialog de confirmación para aplicar cambios */}
                <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <DialogContent className="max-w-2xl max-h-[80vh]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                Confirmar aplicación de cambios
                            </DialogTitle>
                            <DialogDescription>
                                Estás a punto de aplicar {changeCount} cambio{changeCount !== 1 ? 's' : ''} en los turnos.
                                Esta acción no se puede deshacer.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                            <h4 className="text-sm font-medium mb-3">Resumen de cambios:</h4>
                            <ScrollArea className="h-64 border rounded-md p-3">
                                <div className="space-y-2">
                                    {formatChangesForDisplay().map((change, index) => (
                                        <div key={index} className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                                            <div>
                                                <span className="font-medium text-slate-900">{change.empleado}</span>
                                                <span className="text-slate-500 ml-2">• {change.fecha}</span>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={change.turno === 'Eliminar' ? 'border-red-300 text-red-700' : 'border-green-300 text-green-700'}
                                            >
                                                {change.turno}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>

                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirmDialog(false)}
                                disabled={isSaving}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleConfirmChanges}
                                disabled={isSaving}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Aplicando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Confirmar y aplicar
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


                {/* Toast optimizado */}
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
        </div>
        </AppLayout>
    );
}
