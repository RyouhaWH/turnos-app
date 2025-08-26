import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, FileText, History } from 'lucide-react';
import ListaCambios from '../shift-change-list';
import ShiftHistoryFeed from '@/components/ui/shift-history-feed';
import { memo } from 'react';

interface RightPanelProps {
    isChangesExpanded: boolean;
    setIsChangesExpanded: (expanded: boolean) => void;
    isHistoryExpanded: boolean;
    setIsHistoryExpanded: (expanded: boolean) => void;
    hasEditPermissions: boolean;
    resumen: Record<string, Record<string, string>>;
    handleActualizarCambios: (comentario: string) => void;
    isSaving: boolean;
    originalChangeDate: Date | null;
    selectedDate: Date;
    undoLastChange: () => void;
    undoSpecificChange: (changeId: string) => void;
    limpiarTodosLosCambios: () => void;
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
    employee_rol_id: number;
    isMobile?: boolean;
}

export const RightPanel = memo(({
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
    isMobile = false,
}: RightPanelProps) => {
    return (
        <div className={`${isMobile ? 'mt-4 transition-all duration-300 ease-in-out' : 'flex flex-col gap-4 xl:w-[320px]'}`}>
            {/* Resumen de cambios por aplicar - colapsable */}
            {hasEditPermissions && (
                <Card className={`${isMobile ? 'border-0 bg-transparent shadow-none transition-all duration-300 ease-in-out' : 'border-slate-200/50 bg-white/90 shadow-xl backdrop-blur-sm dark:bg-slate-900/90'}`}>
                    <CardHeader
                        className={`cursor-pointer pb-2 transition-colors ${isMobile ? 'border-b border-slate-200 dark:border-slate-700' : 'border-b border-slate-100 hover:bg-slate-100/50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-700/50'}`}
                        onClick={() => setIsChangesExpanded(!isChangesExpanded)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="rounded-md bg-orange-100 p-1 dark:bg-orange-900">
                                    <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <CardTitle className="text-sm text-slate-900 dark:text-white">
                                    Resumen de Cambios
                                </CardTitle>
                            </div>

                            <div className="flex items-center gap-2">
                                <ChevronRight
                                    className={`h-4 w-4 text-slate-500 transition-transform duration-300 ease-in-out ${isChangesExpanded ? 'rotate-90' : ''}`}
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            isChangesExpanded && hasEditPermissions
                                ? 'max-h-[800px] opacity-100'
                                : 'max-h-0 opacity-0'
                        }`}
                    >
                        <div className="pt-2">
                            <ListaCambios
                                cambios={resumen}
                                onActualizar={(comentario) => handleActualizarCambios(comentario)}
                                isProcesing={isSaving}
                                isCollapsed={false}
                                selectedDate={originalChangeDate || selectedDate}
                                disabled={!hasEditPermissions}
                                onUndoLastChange={undoLastChange}
                                onUndoSpecificChange={undoSpecificChange}
                                onClearAllChanges={limpiarTodosLosCambios}
                                changeHistory={listaCambios}
                            />
                        </div>
                    </div>
                </Card>
            )}

            {/* History Feed - Collapsible */}
            <Card className={`${isMobile ? 'border-0 bg-transparent shadow-none max-h-none transition-all duration-300 ease-in-out' : 'max-h-[40.5vh] overflow-clip border-slate-200/50 shadow-xl backdrop-blur-sm dark:bg-slate-900/90'}`}>
                <CardHeader
                    className={`cursor-pointer pb-2 transition-colors ${isMobile ? 'border-b border-slate-200 dark:border-slate-700' : 'border-b border-slate-100 hover:bg-slate-100/50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-700/50'}`}
                    onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="rounded-md bg-emerald-100 p-1 dark:bg-emerald-900">
                                <History className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <CardTitle className="text-sm text-slate-900 dark:text-white">Actividad Reciente</CardTitle>
                        </div>

                        <div className="flex items-center gap-2">
                            <ChevronRight
                                className={`h-4 w-4 text-slate-500 transition-transform duration-300 ease-in-out ${isHistoryExpanded ? 'rotate-90' : ''}`}
                            />
                        </div>
                    </div>
                </CardHeader>

                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isHistoryExpanded
                            ? 'max-h-[600px] opacity-100'
                            : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="px-2 pt-2">
                        <CardContent className="p-0">
                            <div className="h-[400px] overflow-hidden">
                                <ShiftHistoryFeed employee_rol_id={employee_rol_id} />
                            </div>
                        </CardContent>
                    </div>
                </div>
            </Card>
        </div>
    );
});
