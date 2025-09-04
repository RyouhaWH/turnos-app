import React, { useMemo, useCallback, Suspense, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    FileSpreadsheet,
    Loader2,
    Search,
    Users,
    Calendar,
    Settings,
    Zap,
    TrendingUp,
    Clock
} from 'lucide-react';
import { useOptimizedShiftsManager } from './hooks/useOptimizedShiftsManager';
import { MonthYearPicker } from '@/components/month-year-picker';

// Lazy loading de componentes pesados
const OptimizedExcelGrid = React.lazy(() => import('@/components/ui/optimized-excel-grid'));
const ListaCambios = React.lazy(() => import('./shift-change-list'));

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Turnos',
        href: '/shifts',
    },
    {
        title: 'Gestión Optimizada',
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
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                    Cargando turnos optimizados...
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Preparando la experiencia mejorada
                </p>
            </div>
            <div className="flex space-x-2">
                <div className="h-3 w-3 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.3s]"></div>
                <div className="h-3 w-3 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.15s]"></div>
                <div className="h-3 w-3 animate-bounce rounded-full bg-blue-600"></div>
            </div>
        </div>
    </div>
);

// Componente de estadísticas rápidas
const QuickStats = React.memo(({
    totalEmployees,
    changeCount,
    canUndo,
    canRedo
}: {
    totalEmployees: number;
    changeCount: number;
    canUndo: boolean;
    canRedo: boolean;
}) => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Empleados</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalEmployees}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                </div>
            </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Cambios</p>
                        <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{changeCount}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-500" />
                </div>
            </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Deshacer</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                            {canUndo ? '✓' : '✗'}
                        </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
            </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Rehacer</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                            {canRedo ? '✓' : '✗'}
                        </p>
                    </div>
                    <Zap className="h-8 w-8 text-purple-500" />
                </div>
            </CardContent>
        </Card>
    </div>
));

// Componente principal optimizado
interface OptimizedShiftsManagerProps {
    turnos?: any[];
    employee_rol_id?: number;
}

export default function OptimizedShiftsManager({
    turnos = [],
    employee_rol_id = 1
}: OptimizedShiftsManagerProps) {
    const isMobile = useIsMobile();

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
        showEmployeeSelector,
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
        setShowEmployeeSelector,
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
    } = useOptimizedShiftsManager(employee_rol_id);

    // Memoizar el manejador de cambios de celda
    const handleCellValueChanged = useCallback((change: any) => {
        registerChange(
            change.employeeName,
            change.employeeRut,
            change.day,
            change.oldValue,
            change.newValue
        );
    }, [registerChange]);

    // Memoizar props del grid
    const gridProps = useMemo(() => ({
        rowData: filteredRowData,
        onCellValueChanged: handleCellValueChanged,
        editable: hasEditPermissions && !isProcessingChanges,
        month: selectedDate.getMonth(),
        year: selectedDate.getFullYear(),
        pendingChanges: listaCambios,
        showPendingChanges,
        isProcessingChanges,
        className: "transition-all duration-300 ease-in-out",
    }), [
        filteredRowData,
        handleCellValueChanged,
        hasEditPermissions,
        isProcessingChanges,
        selectedDate,
        listaCambios,
        showPendingChanges,
    ]);

    // Memoizar props del resumen
    const summaryProps = useMemo(() => ({
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
    }), [
        resumen,
        handleActualizarCambios,
        isSaving,
        originalChangeDate,
        selectedDate,
        hasEditPermissions,
        undoChange,
        undoSpecificChange,
        listaCambios,
    ]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Turnos Optimizados" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
                <div className={isMobile ? "p-4" : "p-6"}>
                    {/* Header optimizado */}
                    <div className="mb-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg">
                                    <FileSpreadsheet className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        Turnos Optimizados v3
                                        {employee_rol_id === 1 && (
                                            <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                                Patrullaje
                                            </Badge>
                                        )}
                                    </h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Gestión avanzada con historial completo y mejor rendimiento
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <MonthYearPicker
                                    onChange={setSelectedDate}
                                    onLoadData={cargarTurnosPorMes}
                                    loading={loading}
                                    currentMonthTitle={currentMonthTitle}
                                />

                                {!hasEditPermissions && (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                        Solo lectura
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Estadísticas rápidas */}
                        <QuickStats
                            totalEmployees={getTotalEmployees()}
                            changeCount={changeCount}
                            canUndo={canUndo}
                            canRedo={canRedo}
                        />
                    </div>

                    {/* Contenido principal */}
                    <div className={`flex gap-6 ${isMobile ? 'flex-col' : 'h-[calc(100vh-280px)]'}`}>
                        {/* Grid principal */}
                        <div className="flex-1 min-w-0">
                            <Card className="h-full border-slate-200/50 shadow-xl backdrop-blur-sm dark:bg-slate-900/90">
                                <CardHeader className="border-b bg-slate-50/50 pb-4 dark:border-slate-800 dark:bg-slate-800/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                                                <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                                                    Grid de Turnos - {currentMonthTitle}
                                                </CardTitle>
                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                    {getTotalEmployees()} empleados cargados
                                                    {originalChangeDate && (
                                                        <span className="ml-2 text-orange-600 dark:text-orange-400">
                                                            • Cambios pendientes
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Controles rápidos */}
                                        <div className="flex items-center gap-2">
                                            {hasEditPermissions && (
                                                <>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={undoChange}
                                                        disabled={!canUndo || isProcessingChanges}
                                                        className="flex items-center gap-1"
                                                    >
                                                        Ctrl+Z
                                                    </Button>
                                                                                            <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={redoChange}
                                            disabled={!canRedo || isProcessingChanges}
                                            className="flex items-center gap-1"
                                        >
                                            Ctrl+Y
                                        </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Alerta de solo lectura */}
                                    {!hasEditPermissions && (
                                        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <Settings className="h-5 w-5 text-yellow-400" />
                                                </div>
                                                <div className="ml-3">
                                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                        <strong>Modo de solo lectura:</strong> No tienes permisos para editar turnos.
                                                        Solo puedes visualizar la información.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardHeader>

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
                        </div>

                        {/* Panel lateral - Resumen de cambios */}
                        {!isMobile && hasEditPermissions && changeCount > 0 && (
                            <div className="w-96 flex-shrink-0">
                                <ScrollArea className="h-full">
                                    <Suspense fallback={
                                        <Card className="w-full">
                                            <CardContent className="flex items-center justify-center p-8">
                                                <Loader2 className="h-6 w-6 animate-spin" />
                                            </CardContent>
                                        </Card>
                                    }>
                                        <ListaCambios {...summaryProps} />
                                    </Suspense>
                                </ScrollArea>
                            </div>
                        )}
                    </div>

                    {/* Panel móvil - Resumen de cambios */}
                    {isMobile && hasEditPermissions && changeCount > 0 && (
                        <div className="mt-6">
                            <Suspense fallback={
                                <Card className="w-full">
                                    <CardContent className="flex items-center justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    </CardContent>
                                </Card>
                            }>
                                <ListaCambios {...summaryProps} />
                            </Suspense>
                        </div>
                    )}

                </div>

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
        </AppLayout>
    );
}
