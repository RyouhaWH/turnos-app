'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { AlertCircle, ArrowRight, Calendar, CheckCircle2, Clock, Undo2, UserIcon } from 'lucide-react';
import React, { useState } from 'react';

export type TurnoTipo = 'M' | 'T' | 'N';

export interface CambiosPorFecha {
    [fecha: string]: string;
}

export interface CambiosPorFuncionario {
    [nombreCompleto: string]: CambiosPorFecha;
}

// Nueva interfaz para el nuevo formato de datos
export interface CambioData {
    rut: string;
    nombre: string;
    employee_id?: string | number;
    first_name?: string;
    paternal_lastname?: string;
    turnos: Record<string, string>;
}

interface Props {
    cambios: CambiosPorFuncionario | Record<string, CambioData>;
    onActualizar?: (comentario: string) => void;
    isProcesing: boolean;
    isCollapsed?: boolean;
    selectedDate?: Date; // Agregar fecha seleccionada para construir fechas correctamente
    disabled?: boolean; // Nueva propiedad para deshabilitar el componente
    onUndoLastChange?: () => void; // Nueva prop para deshacer último cambio
    onUndoSpecificChange?: (changeId: string) => void; // Nueva prop para deshacer cambio específico
    onClearAllChanges?: () => void; // Nueva prop para limpiar todos los cambios
    changeHistory?: Array<{
        id: string;
        employeeId: string | number;
        employeeName: string;
        employeeRut: string;
        day: string;
        oldValue: string;
        newValue: string;
        timestamp: number;
    }>; // Lista de cambios
}

const ListaCambios: React.FC<Props> = ({
    cambios,
    onActualizar,
    isProcesing,
    isCollapsed = false,
    selectedDate = new Date(),
    disabled = false,
    onUndoLastChange,
    onUndoSpecificChange,
    onClearAllChanges,
    changeHistory = [],
}) => {

    // Función para normalizar los datos del nuevo formato al formato esperado
    const normalizeCambios = (cambiosData: any): CambiosPorFuncionario => {

        const normalized: CambiosPorFuncionario = {};

        Object.entries(cambiosData).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null && 'turnos' in value) {
                // Nuevo formato: { rut, nombre, turnos, employee_id, first_name, paternal_lastname }
                const cambioData = value as CambioData;
                // Solo incluir si hay turnos (cambios reales)
                if (Object.keys(cambioData.turnos).length > 0) {
                    // Usar first_name y paternal_lastname si están disponibles, sino usar nombre
                    const nombreParaMostrar = cambioData.first_name && cambioData.paternal_lastname
                        ? `${cambioData.first_name.split(' ')[0]} ${cambioData.paternal_lastname}`
                        : cambioData.nombre;
                    normalized[nombreParaMostrar] = cambioData.turnos;
                }
            } else if (typeof value === 'object' && value !== null) {
                // Formato antiguo: { fecha: turno }
                // Solo incluir si hay cambios
                if (Object.keys(value).length > 0) {
                    normalized[key] = value as CambiosPorFecha;
                }
            }
        });

        return normalized;
    };

    const cambiosNormalizados = normalizeCambios(cambios);

    const [comentario, setComentario] = useState('');

    const formatNombre = (nombreCrudo: string) => {
        // Ya no necesitamos formatear el nombre porque viene pre-formateado
        // con first_name y paternal_lastname desde el ag-grid
        return nombreCrudo;
    };

    // Función para construir fecha correcta desde el día
    const buildDateFromDay = (day: string) => {
        const dayNumber = parseInt(day);
        if (isNaN(dayNumber)) return new Date();

        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth(); // getMonth() devuelve 0-11

        return new Date(year, month, dayNumber);
    };

    const getTurnoLabel = (turno: string) => {
        // Manejar caso de turno vacío (eliminación)
        if (!turno || turno === '') {
            return {
                label: 'Eliminar turno',
                color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
            };
        }

        const labels = {
            // Turnos principales
            M: {
                label: 'Mañana',
                color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
            },
            T: { label: 'Tarde', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
            N: {
                label: 'Noche',
                color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
            },

            // Turnos principales
            ME: {
                label: 'Mañana Extra',
                color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
            },
            TE: { label: 'Tarde Extra', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' },
            NE: {
                label: 'Noche Extra',
                color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
            },

            // Turnos numerados (mismos colores que M, T, N)
            '1': {
                label: '1er Turno',
                color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
            },
            '2': {
                label: '2do Turno',
                color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
            },
            '3': {
                label: '3er Turno',
                color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
            },

            '1E': {
                label: '1er Turno Extra',
                color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
            },
            '2E': {
                label: '2do Turno Extra',
                color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
            },
            '3E': {
                label: '3er Turno Extra',
                color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
            },

            // Días de descanso
            F: {
                label: 'Franco',
                color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
            },
            L: { label: 'Libre', color: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800' },

            // Días solicitados
            A: {
                label: 'Administrativo',
                color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
            },
            V: {
                label: 'Vacaciones',
                color: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
            },

            // Situaciones especiales
            S: {
                label: 'Sindical',
                color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
            },
            LM: {
                label: 'Licencia Médica',
                color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
            },

            FE: {
                label: 'Franco Extra',
                color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
            },
            LE: { label: 'Libre Extra', color: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800' },

            // Días solicitados
            AE: {
                label: 'Administrativo Extra',
                color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800',
            },
            VE: {
                label: 'Vacaciones Extra',
                color: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
            },

            // Situaciones especiales
            SE: {
                label: 'Sindical Extra',
                color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
            },
        };
        return (
            labels[turno as keyof typeof labels] || {
                label: turno,
                color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800',
            }
        );
    };

    const renderCambios = () => {
        return Object.entries(cambiosNormalizados).map(([nombre, turnosPorFecha]) => {
            const fechasOrdenadas = Object.entries(turnosPorFecha).sort(
                ([fechaA], [fechaB]) => new Date(fechaA).getTime() - new Date(fechaB).getTime(),
            );

            return (
                <div
                    key={nombre}
                    className="group rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-600"
                >
                    {/* Employee Header */}
                    <div className="mb-3 flex items-center gap-3">
                        <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
                            <UserIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">{formatNombre(nombre)}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {fechasOrdenadas.length} cambio{fechasOrdenadas.length !== 1 ? 's' : ''} programado
                                {fechasOrdenadas.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Changes List */}
                    <div className="space-y-2">
                        {fechasOrdenadas.map(([fecha, turno]) => {
                            const turnoInfo = getTurnoLabel(turno);

                            // Buscar el cambio correspondiente en el historial
                            const cambioEnHistorial = changeHistory.find(change =>
                                change.employeeName === nombre && change.day === fecha
                            );

                            return (
                                <div
                                    key={fecha}
                                    className="flex items-center justify-between rounded-md border border-slate-100 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3 text-slate-400" />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {buildDateFromDay(fecha).toLocaleDateString('es-CL', {
                                                day: 'numeric',
                                                month: 'short',
                                            })}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <ArrowRight className="h-3 w-3 text-slate-400" />
                                        <Badge variant="outline" className={`text-xs ${turnoInfo.color} border`}>
                                            {turnoInfo.label}
                                        </Badge>

                                        {/* Botón de deshacer cambio individual */}
                                        {cambioEnHistorial && onUndoSpecificChange && (
                                            <Button
                                                onClick={() => onUndoSpecificChange(cambioEnHistorial.id)}
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                disabled={isProcesing}
                                                title="Deshacer este cambio"
                                            >
                                                <Undo2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        });
    };

    const handleClickActualizar = () => {
        if (onActualizar) {
            onActualizar(comentario);
            setComentario('');
        }
    };

    const totalCambios = Object.keys(cambiosNormalizados).length;
    const totalModificaciones = Object.values(cambiosNormalizados).reduce((acc, fechas) => acc + Object.keys(fechas).length, 0);

    return (
        <div className="flex flex-col bg-white/90 dark:bg-slate-900/90">
            <CardContent className="max-h-[500px] flex-1 overflow-y-auto p-4">
                {totalCambios === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                        <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                            <Clock className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="mb-2 text-lg font-medium text-slate-900 dark:text-white">No hay cambios pendientes</h3>
                        <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
                            Los cambios que realices en los turnos aparecerán aquí antes de ser guardados.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Header con estadísticas y botón de deshacer */}
                        <div className="flex flex-col items-center justify-between gap-4">
                            <div className="grid w-full grid-cols-2 gap-3">
                                <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-900/20">
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalCambios}</p>
                                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Empleados</p>
                                </div>
                                <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-900/20">
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{totalModificaciones}</p>
                                    <p className="text-xs text-green-600/70 dark:text-green-400/70">Turnos</p>
                                </div>
                            </div>

                            {/* Botón de deshacer último */}
                            {onUndoLastChange && changeHistory.length > 0 && (
                                <Button
                                    onClick={onUndoLastChange}
                                    variant="outline"
                                    size="sm"
                                    className="flex w-full items-center justify-center gap-2 py-4 text-xs"
                                    disabled={isProcesing}
                                >
                                    <Undo2 className="h-3 w-3" />
                                    Deshacer último cambio
                                </Button>
                            )}
                        </div>

                        {/* Changes List */}
                        {renderCambios()}
                    </div>
                )}
            </CardContent>

            {/* Comentarios */}
            {/* <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="space-y-3">
          <Label htmlFor="comentario" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Comentario de la actualización
          </Label>
          <Textarea
            id="comentario"
            placeholder="Describe brevemente el motivo de estos cambios (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            className="resize-none bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
            rows={2}
          />
        </div>
      </div> */}

            {/* Action Button */}
            <div className="border-t border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <Button
                    onClick={handleClickActualizar}
                    className="w-full transform bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:from-green-700 hover:to-green-800 hover:shadow-xl disabled:transform-none disabled:opacity-50"
                    disabled={totalCambios === 0 || isProcesing || disabled}
                    size="lg"
                >
                    {isProcesing ? (
                        <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Guardando cambios...
                        </>
                    ) : (
                        <>
                            {totalCambios > 0 ? (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Aplicar {totalModificaciones} cambio{totalModificaciones !== 1 ? 's' : ''}
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    Sin cambios para aplicar
                                </>
                            )}
                        </>
                    )}
                </Button>

                {totalCambios > 0 && (
                    <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">Los cambios se aplicarán inmediatamente al sistema</p>
                )}
            </div>
        </div>
    );
};

export default ListaCambios;
