import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import AgGridHorizontal from '@/components/ui/excel-shift-horizontal';
import { MonthYearPicker } from '@/components/month-year-picker';
import { useRef, useEffect, memo } from 'react';

// Componente de loading optimizado
const LoadingGrid = () => (
    <div className="flex h-full min-h-[400px] items-center justify-center bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center space-y-4">
            <div className="relative">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <div className="absolute inset-0 animate-ping rounded-full bg-blue-400 opacity-25"></div>
            </div>
            <div className="text-center">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white">Cargando turnos...</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Preparando la información más reciente</p>
            </div>
            <div className="flex space-x-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600"></div>
            </div>
        </div>
    </div>
);

interface TurnoData {
    id: string;
    nombre: string;
    amzoma?: boolean | string | number;
    first_name?: string;
    paternal_lastname?: string;
    [key: string]: string | boolean | number | undefined;
}

interface ShiftsGridProps {
    employee_rol_id: number;
    currentMonthTitle: string;
    loading: boolean;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    cargarTurnosPorMes: (date: Date) => void;
    getTotalEmployees: () => number;
    listaCambios: Array<{
        id: string;
        employeeId: string | number;
        employeeName: string;
        employeeRut: string;
        day: string;
        oldValue: string;
        newValue: string;
        timestamp: number;
    }>;
    originalChangeDate: Date | null;
    filteredRowData: TurnoData[];
    handleResumenUpdate: (resumen: any) => void;
    hasEditPermissions: boolean;
    resetGrid: boolean;
    registerChange: (employee: string, rut: string, day: string, oldValue: string, newValue: string) => void;
    isUndoing: boolean;
    showPendingChanges: boolean;
    clearChanges: boolean;
    isMobile?: boolean;
}

export const ShiftsGrid = memo(({
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
    isMobile = false,
}: ShiftsGridProps) => {
    const gridRef = useRef<any>(null);

    // Efecto para ajustar columnas después de cargar datos
    useEffect(() => {
        setTimeout(() => {
            if (gridRef.current) {
                gridRef.current.autoSizeColumns(['nombre']);
                setTimeout(() => {
                    gridRef.current.sizeColumnsToFit();
                }, 50);
            }
        }, 100);
    }, [filteredRowData]);

    if (isMobile) {
        return (
            <div className="flex h-full flex-col transition-all duration-300 ease-in-out">
                <div className="border-b bg-slate-50/50 pb-4 dark:border-slate-800 dark:bg-slate-800/50">
                    <div className="flex flex-col gap-4 mt-6 px-4">
                        {/* Título y selector en línea */}
                        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                                    <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white leading-tight">
                                        Turnos del Personal {employee_rol_id === 1 ? '- Patrullaje' : ''}
                                    </CardTitle>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        {getTotalEmployees()} empleados
                                    </p>
                                </div>
                            </div>

                            {/* Selector de fecha compacto */}
                            <div className="flex-shrink-0">
                                <MonthYearPicker
                                    onChange={setSelectedDate}
                                    onLoadData={cargarTurnosPorMes}
                                    loading={loading}
                                    currentMonthTitle={currentMonthTitle}
                                />
                            </div>
                        </div>

                        {/* Badge de cambios pendientes */}
                        {(listaCambios.length > 0 || originalChangeDate) && (
                            <div className="flex items-center gap-2 justify-center">
                                {listaCambios.length > 0 && (
                                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                                        {listaCambios.length} cambio{listaCambios.length !== 1 ? 's' : ''} pendiente{listaCambios.length !== 1 ? 's' : ''}
                                    </Badge>
                                )}
                                {originalChangeDate && (
                                    <span className="text-sm text-orange-600 dark:text-orange-400">
                                        • Cambios para {originalChangeDate.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Ag-grid con altura máxima */}
                <div className="flex-1 md:px-3 pt-3 transition-all duration-300 ease-in-out">
                    {!hasEditPermissions && (
                        <div className="mb-3 border-l-4 border-yellow-400 bg-yellow-50 p-3">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path
                                            fillRule="evenodd"
                                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-2">
                                    <p className="text-xs text-yellow-700">
                                        <strong>Modo de solo lectura:</strong> Solo puedes visualizar la información.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="ag-theme-alpine h-full max-h-[57vh] overflow-hidden border-0 shadow-xl rounded-sm mx-4 transition-all duration-300 ease-in-out">
                        {loading ? (
                            <LoadingGrid />
                        ) : (
                            <AgGridHorizontal
                                ref={gridRef}
                                rowData={filteredRowData}
                                onResumenChange={handleResumenUpdate}
                                editable={hasEditPermissions}
                                resetGrid={resetGrid}
                                onRegisterChange={registerChange}
                                isUndoing={isUndoing}
                                pendingChanges={listaCambios}
                                originalChangeDate={originalChangeDate}
                                month={selectedDate.getMonth()}
                                year={selectedDate.getFullYear()}
                                showPendingChanges={showPendingChanges}
                                clearChanges={clearChanges}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Card className="h-full border-slate-200/50 shadow-xl backdrop-blur-sm dark:bg-slate-900/90">
            <CardHeader className="border-b bg-slate-50/50 pb-2 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                            <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">
                                Turnos del Personal {employee_rol_id === 1 ? '- Patrullaje y Proximidad' : ''}
                                {listaCambios.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                                        {listaCambios.length} cambio{listaCambios.length !== 1 ? 's' : ''} pendiente{listaCambios.length !== 1 ? 's' : ''}
                                    </Badge>
                                )}
                            </CardTitle>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                {getTotalEmployees()} empleados registrados
                                {originalChangeDate && (
                                    <span className="ml-2 text-orange-600 dark:text-orange-400">
                                        • Cambios para {originalChangeDate.toLocaleDateString('es-CL', { year: 'numeric', month: 'long' })}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Integrated Month/Year Picker */}
                    <div className="flex items-center gap-3">
                        <MonthYearPicker
                            onChange={setSelectedDate}
                            onLoadData={cargarTurnosPorMes}
                            loading={loading}
                            currentMonthTitle={currentMonthTitle}
                        />
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex h-full flex-col px-2">
                {!hasEditPermissions && (
                    <div className="mb-4 border-l-4 border-yellow-400 bg-yellow-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    <strong>Modo de solo lectura:</strong> No tienes permisos para editar turnos. Solo puedes
                                    visualizar la información.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="ag-theme-alpine h-full min-h-[400px] flex-1 overflow-hidden rounded-b-lg border-0 mt-4">
                    {loading ? (
                        <LoadingGrid />
                    ) : (
                        <AgGridHorizontal
                            ref={gridRef}
                            rowData={filteredRowData}
                            onResumenChange={handleResumenUpdate}
                            editable={hasEditPermissions}
                            resetGrid={resetGrid}
                            onRegisterChange={registerChange}
                            isUndoing={isUndoing}
                            pendingChanges={listaCambios}
                            originalChangeDate={originalChangeDate}
                            month={selectedDate.getMonth()}
                            year={selectedDate.getFullYear()}
                            showPendingChanges={showPendingChanges}
                            clearChanges={clearChanges}
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    );
});
