import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Save,
    Undo2,
    Redo2,
    RotateCcw,
    Clock,
    User,
    Calendar,
    Eye,
    EyeOff,
    ChevronDown,
    ChevronRight,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface OptimizedGridChange {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeRut: string;
    day: string;
    oldValue: string;
    newValue: string;
    timestamp: number;
}

interface AdvancedChangeSummaryProps {
    changes: OptimizedGridChange[];
    onSave: (comentario: string) => Promise<void>;
    onUndo: () => void;
    onRedo: () => void;
    onClearAll: () => void;
    onRemoveChange?: (changeId: string) => void;
    canUndo: boolean;
    canRedo: boolean;
    isSaving: boolean;
    originalChangeDate?: Date | null;
    selectedDate: Date;
    hasEditPermissions: boolean;
}

interface GroupedChange {
    employeeId: string;
    employeeName: string;
    employeeRut: string;
    changes: OptimizedGridChange[];
    totalChanges: number;
}

const AdvancedChangeSummary: React.FC<AdvancedChangeSummaryProps> = ({
    changes,
    onSave,
    onUndo,
    onRedo,
    onClearAll,
    onRemoveChange,
    canUndo,
    canRedo,
    isSaving,
    originalChangeDate,
    selectedDate,
    hasEditPermissions,
}) => {
    const [comentario, setComentario] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
    const [isExpanded, setIsExpanded] = useState(true);

    // Agrupar cambios por empleado
    const groupedChanges = useMemo((): GroupedChange[] => {
        const groups = new Map<string, GroupedChange>();

        changes.forEach(change => {
            if (!groups.has(change.employeeId)) {
                groups.set(change.employeeId, {
                    employeeId: change.employeeId,
                    employeeName: change.employeeName,
                    employeeRut: change.employeeRut,
                    changes: [],
                    totalChanges: 0,
                });
            }

            const group = groups.get(change.employeeId)!;
            group.changes.push(change);
            group.totalChanges++;
        });

        return Array.from(groups.values()).sort((a, b) =>
            a.employeeName.localeCompare(b.employeeName, 'es', { sensitivity: 'base' })
        );
    }, [changes]);

    // Estadísticas de cambios
    const changeStats = useMemo(() => {
        const stats = {
            totalChanges: changes.length,
            employeesAffected: groupedChanges.length,
            byShiftType: new Map<string, number>(),
            byDay: new Map<string, number>(),
        };

        changes.forEach(change => {
            // Contar por tipo de turno
            const shiftType = change.newValue || 'Eliminado';
            stats.byShiftType.set(shiftType, (stats.byShiftType.get(shiftType) || 0) + 1);

            // Contar por día
            stats.byDay.set(change.day, (stats.byDay.get(change.day) || 0) + 1);
        });

        return stats;
    }, [changes, groupedChanges]);

    // Alternar expansión de empleado
    const toggleEmployeeExpansion = useCallback((employeeId: string) => {
        setExpandedEmployees(prev => {
            const newSet = new Set(prev);
            if (newSet.has(employeeId)) {
                newSet.delete(employeeId);
            } else {
                newSet.add(employeeId);
            }
            return newSet;
        });
    }, []);

    // Manejar guardado
    const handleSave = useCallback(async () => {
        if (changes.length === 0) {
            toast.warning('No hay cambios para guardar');
            return;
        }

        if (!comentario.trim()) {
            toast.error('Debes agregar un comentario para guardar los cambios');
            return;
        }

        try {
            await onSave(comentario);
            setComentario('');
            setShowPreview(false);
        } catch (error) {
            console.error('Error al guardar:', error);
        }
    }, [changes, comentario, onSave]);

    // Remover cambio específico
    const handleRemoveChange = useCallback((changeId: string) => {
        if (onRemoveChange) {
            onRemoveChange(changeId);
        }
    }, [onRemoveChange]);

    // Formatear fecha
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-CL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Formatear hora
    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Obtener color del turno
    const getShiftColor = (shift: string) => {
        const colors: Record<string, string> = {
            'M': 'bg-orange-100 text-orange-800',
            'T': 'bg-blue-100 text-blue-800',
            'N': 'bg-purple-100 text-purple-800',
            'V': 'bg-green-100 text-green-800',
            'A': 'bg-cyan-100 text-cyan-800',
            'S': 'bg-pink-100 text-pink-800',
            'LM': 'bg-red-100 text-red-800',
            'F': 'bg-gray-100 text-gray-800',
            'L': 'bg-gray-100 text-gray-800',
            '1': 'bg-orange-100 text-orange-800',
            '2': 'bg-blue-100 text-blue-800',
            '3': 'bg-gray-100 text-gray-800',
        };

        return colors[shift.toUpperCase()] || 'bg-gray-100 text-gray-800';
    };

    if (!hasEditPermissions || changes.length === 0) {
        return null;
    }

    return (
        <Card className="w-full border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-900">
                            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-orange-900 dark:text-orange-100">
                                Resumen de Cambios
                            </CardTitle>
                            <p className="text-sm text-orange-700 dark:text-orange-300">
                                {changeStats.totalChanges} cambio{changeStats.totalChanges !== 1 ? 's' : ''} en {changeStats.employeesAffected} empleado{changeStats.employeesAffected !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowPreview(!showPreview)}
                            className="text-orange-700 hover:bg-orange-100 dark:text-orange-300"
                        >
                            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-orange-700 hover:bg-orange-100 dark:text-orange-300"
                        >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {/* Información de fecha */}
                {originalChangeDate && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                        <Calendar className="h-4 w-4" />
                        <span>Cambios para {formatDate(originalChangeDate)}</span>
                    </div>
                )}
            </CardHeader>

            {isExpanded && (
                <CardContent className="space-y-4">
                    {/* Estadísticas rápidas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-white/50 p-3 dark:bg-slate-800/50">
                            <div className="text-2xl font-bold text-orange-600">{changeStats.totalChanges}</div>
                            <div className="text-sm text-orange-700 dark:text-orange-300">Total de cambios</div>
                        </div>
                        <div className="rounded-lg bg-white/50 p-3 dark:bg-slate-800/50">
                            <div className="text-2xl font-bold text-orange-600">{changeStats.employeesAffected}</div>
                            <div className="text-sm text-orange-700 dark:text-orange-300">Empleados afectados</div>
                        </div>
                    </div>

                    {/* Controles de acción */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onUndo}
                            disabled={!canUndo || isSaving}
                            className="flex items-center gap-1"
                        >
                            <Undo2 className="h-3 w-3" />
                            Deshacer
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRedo}
                            disabled={!canRedo || isSaving}
                            className="flex items-center gap-1"
                        >
                            <Redo2 className="h-3 w-3" />
                            Rehacer
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClearAll}
                            disabled={isSaving}
                            className="flex items-center gap-1 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                            <RotateCcw className="h-3 w-3" />
                            Descartar Todo
                        </Button>
                    </div>

                    <Separator />

                    {/* Lista de cambios agrupados */}
                    <ScrollArea className="max-h-80">
                        <div className="space-y-3">
                            {groupedChanges.map(group => (
                                <div key={group.employeeId} className="rounded-lg border border-orange-200 bg-white/30 p-3 dark:border-orange-800 dark:bg-slate-800/30">
                                    <div
                                        className="flex cursor-pointer items-center justify-between"
                                        onClick={() => toggleEmployeeExpansion(group.employeeId)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-orange-600" />
                                            <span className="font-medium text-orange-900 dark:text-orange-100">
                                                {group.employeeName}
                                            </span>
                                            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                                {group.totalChanges} cambio{group.totalChanges !== 1 ? 's' : ''}
                                            </Badge>
                                        </div>

                                        {expandedEmployees.has(group.employeeId) ?
                                            <ChevronDown className="h-4 w-4 text-orange-600" /> :
                                            <ChevronRight className="h-4 w-4 text-orange-600" />
                                        }
                                    </div>

                                    {expandedEmployees.has(group.employeeId) && (
                                        <div className="mt-3 space-y-2">
                                            {group.changes.map(change => (
                                                <div key={change.id} className="flex items-center justify-between rounded-md bg-white/50 p-2 dark:bg-slate-700/50">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            Día {change.day}:
                                                        </span>

                                                        <div className="flex items-center gap-2">
                                                            {change.oldValue && (
                                                                <Badge className={getShiftColor(change.oldValue)}>
                                                                    {change.oldValue}
                                                                </Badge>
                                                            )}

                                                            <span className="text-gray-400">→</span>

                                                            {change.newValue ? (
                                                                <Badge className={getShiftColor(change.newValue)}>
                                                                    {change.newValue}
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="destructive">
                                                                    Eliminado
                                                                </Badge>
                                                            )}
                                                        </div>

                                                        <span className="text-xs text-gray-500">
                                                            {formatTime(change.timestamp)}
                                                        </span>
                                                    </div>

                                                    {onRemoveChange && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveChange(change.id);
                                                            }}
                                                            className="h-6 w-6 p-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>

                    {/* Preview de cambios */}
                    {showPreview && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                            <h4 className="mb-2 font-medium text-blue-900 dark:text-blue-100">
                                Vista Previa de Cambios
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <h5 className="font-medium text-blue-800 dark:text-blue-200">Por Tipo de Turno:</h5>
                                    <div className="mt-1 space-y-1">
                                        {Array.from(changeStats.byShiftType.entries()).map(([shift, count]) => (
                                            <div key={shift} className="flex justify-between">
                                                <Badge className={getShiftColor(shift)}>{shift}</Badge>
                                                <span className="text-blue-700 dark:text-blue-300">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h5 className="font-medium text-blue-800 dark:text-blue-200">Por Día:</h5>
                                    <div className="mt-1 space-y-1">
                                        {Array.from(changeStats.byDay.entries())
                                            .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                            .slice(0, 5)
                                            .map(([day, count]) => (
                                                <div key={day} className="flex justify-between">
                                                    <span className="text-blue-700 dark:text-blue-300">Día {day}</span>
                                                    <span className="text-blue-700 dark:text-blue-300">{count}</span>
                                                </div>
                                            ))}
                                        {changeStats.byDay.size > 5 && (
                                            <div className="text-xs text-blue-600 dark:text-blue-400">
                                                ...y {changeStats.byDay.size - 5} días más
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* Comentario y guardar */}
                    <div className="space-y-3">
                        <div>
                            <label className="text-sm font-medium text-orange-900 dark:text-orange-100">
                                Comentario de los cambios *
                            </label>
                            <Textarea
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                                placeholder="Describe los cambios realizados..."
                                className="mt-1 min-h-[60px] border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                                disabled={isSaving}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !comentario.trim()}
                                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>

                            {!comentario.trim() && (
                                <div className="flex items-center gap-1 text-sm text-amber-600">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Comentario requerido</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
};

export default AdvancedChangeSummary;
