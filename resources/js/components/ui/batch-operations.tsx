import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Zap,
    Users,
    Calendar,
    Copy,
    Trash2,
    RotateCcw,
    CheckSquare,
    Square,
    Filter,
    Download,
    Upload,
    Settings,
    Play
} from 'lucide-react';
import { toast } from 'sonner';

interface TurnoData {
    id: string;
    nombre: string;
    amzoma?: boolean | string | number;
    first_name?: string;
    paternal_lastname?: string;
    rut?: string;
    employee_id?: string | number;
    [key: string]: string | boolean | number | undefined;
}

interface BatchOperationsProps {
    employees: TurnoData[];
    selectedEmployees: Set<string>;
    onEmployeeSelect: (employeeId: string, selected: boolean) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onBatchUpdate: (operation: BatchOperation) => Promise<void>;
    getEmployeeId: (employee: TurnoData) => string;
    currentMonth: number;
    currentYear: number;
    hasEditPermissions: boolean;
}

interface BatchOperation {
    type: 'assign' | 'clear' | 'copy' | 'pattern';
    targetDays?: string[];
    sourceDay?: string;
    shiftValue?: string;
    pattern?: string[];
    employeeIds: string[];
}

const BatchOperations: React.FC<BatchOperationsProps> = ({
    employees,
    selectedEmployees,
    onEmployeeSelect,
    onSelectAll,
    onDeselectAll,
    onBatchUpdate,
    getEmployeeId,
    currentMonth,
    currentYear,
    hasEditPermissions,
}) => {
    const [operationType, setOperationType] = useState<'assign' | 'clear' | 'copy' | 'pattern'>('assign');
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [shiftValue, setShiftValue] = useState('');
    const [sourceDay, setSourceDay] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);

    // Generar días del mes
    const daysInMonth = useMemo(() => {
        const daysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
        return Array.from({ length: daysCount }, (_, i) => (i + 1).toString());
    }, [currentMonth, currentYear]);

    // Tipos de turno comunes
    const shiftTypes = ['M', 'T', 'N', 'V', 'A', 'S', 'LM', 'F', 'L', '1', '2', '3'];

    // Patrones de turnos predefinidos
    const shiftPatterns = [
        { name: 'Mañana-Tarde', pattern: ['M', 'T', 'M', 'T', 'M', 'T', 'F'] },
        { name: 'Noche rotativa', pattern: ['N', 'N', 'F', 'F', 'F', 'N', 'N'] },
        { name: 'Administrativo', pattern: ['A', 'A', 'A', 'A', 'A', 'F', 'F'] },
    ];

    // Empleados filtrados y seleccionados
    const selectedEmployeesList = useMemo(() => {
        return employees.filter(emp => selectedEmployees.has(getEmployeeId(emp)));
    }, [employees, selectedEmployees, getEmployeeId]);

    // Manejar selección de empleado
    const handleEmployeeToggle = useCallback((employee: TurnoData) => {
        const employeeId = getEmployeeId(employee);
        const isSelected = selectedEmployees.has(employeeId);
        onEmployeeSelect(employeeId, !isSelected);
    }, [selectedEmployees, onEmployeeSelect, getEmployeeId]);

    // Manejar selección de días
    const handleDayToggle = useCallback((day: string) => {
        setSelectedDays(prev => {
            if (prev.includes(day)) {
                return prev.filter(d => d !== day);
            } else {
                return [...prev, day].sort((a, b) => parseInt(a) - parseInt(b));
            }
        });
    }, []);

    // Seleccionar rango de días
    const selectDayRange = useCallback((start: number, end: number) => {
        const range = [];
        for (let i = start; i <= end; i++) {
            range.push(i.toString());
        }
        setSelectedDays(prev => {
            const newDays = [...new Set([...prev, ...range])];
            return newDays.sort((a, b) => parseInt(a) - parseInt(b));
        });
    }, []);

    // Ejecutar operación por lotes
    const executeBatchOperation = useCallback(async () => {
        if (selectedEmployees.size === 0) {
            toast.error('Selecciona al menos un empleado');
            return;
        }

        if (operationType === 'assign' && !shiftValue) {
            toast.error('Selecciona un tipo de turno');
            return;
        }

        if ((operationType === 'assign' || operationType === 'clear') && selectedDays.length === 0) {
            toast.error('Selecciona al menos un día');
            return;
        }

        if (operationType === 'copy' && (!sourceDay || selectedDays.length === 0)) {
            toast.error('Selecciona el día origen y los días destino');
            return;
        }

        setIsProcessing(true);

        try {
            const operation: BatchOperation = {
                type: operationType,
                employeeIds: Array.from(selectedEmployees),
                targetDays: selectedDays,
                sourceDay,
                shiftValue,
            };

            await onBatchUpdate(operation);

            // Limpiar formulario
            setSelectedDays([]);
            setShiftValue('');
            setSourceDay('');

            toast.success(`Operación ${operationType} completada`, {
                description: `Se aplicó a ${selectedEmployees.size} empleado${selectedEmployees.size !== 1 ? 's' : ''}`,
            });

        } catch (error) {
            console.error('Error en operación por lotes:', error);
            toast.error('Error al ejecutar la operación');
        } finally {
            setIsProcessing(false);
        }
    }, [operationType, selectedEmployees, selectedDays, shiftValue, sourceDay, onBatchUpdate]);

    if (!hasEditPermissions) {
        return null;
    }

    return (
        <Card className="w-full border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900">
                            <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-purple-900 dark:text-purple-100">
                                Operaciones por Lotes
                            </CardTitle>
                            <p className="text-sm text-purple-700 dark:text-purple-300">
                                {selectedEmployees.size} empleado{selectedEmployees.size !== 1 ? 's' : ''} seleccionado{selectedEmployees.size !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEmployeeSelector(!showEmployeeSelector)}
                        className="text-purple-700 hover:bg-purple-100 dark:text-purple-300"
                    >
                        <Users className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Selector de empleados */}
                {showEmployeeSelector && (
                    <div className="rounded-lg border border-purple-200 bg-white/50 p-4 dark:border-purple-800 dark:bg-slate-800/50">
                        <div className="mb-3 flex items-center justify-between">
                            <h4 className="font-medium text-purple-900 dark:text-purple-100">
                                Seleccionar Empleados
                            </h4>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onSelectAll}
                                    className="text-purple-600"
                                >
                                    Todos
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onDeselectAll}
                                    className="text-purple-600"
                                >
                                    Ninguno
                                </Button>
                            </div>
                        </div>

                        <ScrollArea className="max-h-48">
                            <div className="grid grid-cols-1 gap-2">
                                {employees.map(employee => {
                                    const employeeId = getEmployeeId(employee);
                                    const isSelected = selectedEmployees.has(employeeId);
                                    const displayName = employee.first_name && employee.paternal_lastname
                                        ? `${String(employee.first_name).split(' ')[0]} ${employee.paternal_lastname}`
                                        : employee.nombre;

                                    return (
                                        <div
                                            key={employeeId}
                                            className={`flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors ${
                                                isSelected
                                                    ? 'bg-purple-100 text-purple-900 dark:bg-purple-900/50 dark:text-purple-100'
                                                    : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'
                                            }`}
                                            onClick={() => handleEmployeeToggle(employee)}
                                        >
                                            {isSelected ? (
                                                <CheckSquare className="h-4 w-4 text-purple-600" />
                                            ) : (
                                                <Square className="h-4 w-4 text-purple-400" />
                                            )}
                                            <span className="flex-1 text-sm">{displayName}</span>
                                            {employee.amzoma && (
                                                <Badge variant="secondary" className="text-xs">
                                                    Amzoma
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </div>
                )}

                {/* Tipo de operación */}
                <div>
                    <label className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        Tipo de Operación
                    </label>
                    <Select value={operationType} onValueChange={(value: any) => setOperationType(value)}>
                        <SelectTrigger className="mt-1 border-purple-200 focus:border-purple-400 focus:ring-purple-400">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="assign">Asignar Turno</SelectItem>
                            <SelectItem value="clear">Limpiar Turnos</SelectItem>
                            <SelectItem value="copy">Copiar Turno</SelectItem>
                            <SelectItem value="pattern">Aplicar Patrón</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Configuración específica por tipo de operación */}
                {operationType === 'assign' && (
                    <div>
                        <label className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            Tipo de Turno
                        </label>
                        <Select value={shiftValue} onValueChange={setShiftValue}>
                            <SelectTrigger className="mt-1 border-purple-200 focus:border-purple-400 focus:ring-purple-400">
                                <SelectValue placeholder="Selecciona un turno" />
                            </SelectTrigger>
                            <SelectContent>
                                {shiftTypes.map(shift => (
                                    <SelectItem key={shift} value={shift}>
                                        {shift} - {getShiftName(shift)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {operationType === 'copy' && (
                    <div>
                        <label className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            Día Origen
                        </label>
                        <Select value={sourceDay} onValueChange={setSourceDay}>
                            <SelectTrigger className="mt-1 border-purple-200 focus:border-purple-400 focus:ring-purple-400">
                                <SelectValue placeholder="Selecciona día origen" />
                            </SelectTrigger>
                            <SelectContent>
                                {daysInMonth.map(day => (
                                    <SelectItem key={day} value={day}>
                                        Día {day}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {operationType === 'pattern' && (
                    <div>
                        <label className="text-sm font-medium text-purple-900 dark:text-purple-100">
                            Patrón de Turnos
                        </label>
                        <div className="mt-2 space-y-2">
                            {shiftPatterns.map(pattern => (
                                <Button
                                    key={pattern.name}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        // Aplicar patrón automáticamente
                                        setSelectedDays(daysInMonth.slice(0, pattern.pattern.length));
                                        setShiftValue(pattern.pattern.join(','));
                                    }}
                                    className="w-full justify-start text-purple-600"
                                >
                                    <span className="font-medium">{pattern.name}:</span>
                                    <span className="ml-2 text-sm">{pattern.pattern.join(' - ')}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Selector de días */}
                {(operationType === 'assign' || operationType === 'clear' || operationType === 'copy') && (
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-purple-900 dark:text-purple-100">
                                Días {operationType === 'copy' ? 'Destino' : 'a Modificar'}
                            </label>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => selectDayRange(1, 7)}
                                    className="text-xs text-purple-600"
                                >
                                    Semana 1
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => selectDayRange(8, 14)}
                                    className="text-xs text-purple-600"
                                >
                                    Semana 2
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedDays([])}
                                    className="text-xs text-purple-600"
                                >
                                    Limpiar
                                </Button>
                            </div>
                        </div>

                        <div className="mt-2 grid grid-cols-7 gap-1">
                            {daysInMonth.map(day => {
                                const isSelected = selectedDays.includes(day);
                                const dayNum = parseInt(day);
                                const date = new Date(currentYear, currentMonth, dayNum);
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                                return (
                                    <Button
                                        key={day}
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => handleDayToggle(day)}
                                        className={`h-8 w-8 p-0 text-xs ${
                                            isSelected
                                                ? 'bg-purple-600 hover:bg-purple-700'
                                                : isWeekend
                                                ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                                                : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                                        }`}
                                    >
                                        {day}
                                    </Button>
                                );
                            })}
                        </div>

                        {selectedDays.length > 0 && (
                            <div className="mt-2">
                                <p className="text-sm text-purple-700 dark:text-purple-300">
                                    Días seleccionados: {selectedDays.join(', ')}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <Separator />

                {/* Botón de ejecución */}
                <div className="flex items-center justify-between">
                    <div className="text-sm text-purple-700 dark:text-purple-300">
                        {selectedEmployees.size} empleado{selectedEmployees.size !== 1 ? 's' : ''} • {selectedDays.length} día{selectedDays.length !== 1 ? 's' : ''}
                    </div>

                    <Button
                        onClick={executeBatchOperation}
                        disabled={isProcessing || selectedEmployees.size === 0}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        {isProcessing ? (
                            <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <Play className="mr-2 h-4 w-4" />
                                Ejecutar
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// Helper function para nombres de turnos
const getShiftName = (shift: string): string => {
    const names: Record<string, string> = {
        'M': 'Mañana',
        'T': 'Tarde',
        'N': 'Noche',
        'V': 'Vacaciones',
        'A': 'Administrativo',
        'S': 'Salud',
        'LM': 'Licencia Médica',
        'F': 'Franco',
        'L': 'Libre',
        '1': 'Turno 1',
        '2': 'Turno 2',
        '3': 'Turno 3',
    };
    return names[shift] || shift;
};

export default BatchOperations;
