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
import { FileSpreadsheet, Loader2, Settings, Undo2, Eye, EyeOff, Save, CheckCircle2, Bell } from 'lucide-react';
import React, { Suspense, useCallback, useMemo, useState } from 'react';
import { useOptimizedShiftsManager } from './hooks/useOptimizedShiftsManager';

// Lazy loading de componentes pesados
const OptimizedExcelGrid = React.lazy(() => import('@/components/ui/optimized-excel-grid'));
const ListaCambios = React.lazy(() => import('./shift-change-list'));

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
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
                <div className={isMobile ? 'p-4' : 'p-6'}>
                    {/* Header compacto de página */}
                    <div className="mb-4">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2 shadow-md">
                                    <FileSpreadsheet className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        Grid de Turnos - {currentMonthTitle}
                                        {employee_rol_id === 1 && (
                                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 text-xs">Patrullaje</Badge>
                                        )}
                                    </h1>
                                    <div className="flex items-center gap-3 mt-1">
                                        <MonthYearPicker
                                            onChange={setSelectedDate}
                                            onLoadData={cargarTurnosPorMes}
                                            loading={loading}
                                            currentMonthTitle={currentMonthTitle}
                                        />
                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                            {getTotalEmployees()} empleados
                                            {originalChangeDate && (
                                                <span className="ml-2 text-orange-600 dark:text-orange-400">• Cambios pendientes</span>
                                            )}
                                            {changeCount > 0 && !showSummary && (
                                                <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                                                    • {changeCount} cambio{changeCount !== 1 ? 's' : ''} sin revisar
                                                </span>
                                            )}
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

                                        {/* Botón para toggle del resumen */}
                                        {changeCount > 0 && (
                                            <Button
                                                variant={showSummary ? "ghost" : "outline"}
                                                size="sm"
                                                onClick={() => setShowSummary(!showSummary)}
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
                                                        <span className="font-medium">Ver resumen ({changeCount})</span>
                                                    </>
                                                )}
                                            </Button>
                                        )}

                                        {/* Botón para aplicar cambios */}
                                        {changeCount > 0 && (
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
                    <div className={`flex gap-6 ${isMobile ? 'flex-col' : 'h-[calc(100vh-180px)]'}`}>
                        {/* Grid principal */}
                        <div className="min-w-0 flex-1">
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
                    </div>

                    {/* Panel móvil - Resumen de cambios */}
                    {isMobile && hasEditPermissions && changeCount > 0 && showSummary && (
                        <div className="mt-6">
                            <Suspense
                                fallback={
                                    <Card className="w-full">
                                        <CardContent className="flex items-center justify-center p-8">
                                            <Loader2 className="h-6 w-6 animate-spin" />
                                        </CardContent>
                                    </Card>
                                }
                            >
                                <ListaCambios {...summaryProps} />
                            </Suspense>
                        </div>
                    )}
                </div>

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
        </AppLayout>
    );
}
