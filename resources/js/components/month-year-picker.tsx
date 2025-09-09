import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface MonthYearPickerProps {
    onChange: (date: Date) => void;
    onLoadData: (date: Date) => void;
    loading: boolean;
    currentMonthTitle: string;
    selectedDate?: Date;
    onMonthChangeRequest?: (newDate: Date) => void;
    hasPendingChanges?: boolean;
}

export const MonthYearPicker = ({ onChange, onLoadData, loading, currentMonthTitle, selectedDate, onMonthChangeRequest, hasPendingChanges }: MonthYearPickerProps) => {
    const now = new Date();
    const initialDate = selectedDate || now;
    const [year, setYear] = useState(initialDate.getFullYear());
    const [month, setMonth] = useState(initialDate.getMonth() + 1); // 1-12
    const lastLoadedDate = useRef<string>(`${initialDate.getFullYear()}-${initialDate.getMonth() + 1}`); // Para evitar cargas duplicadas

    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i);

    // Actualizar el estado cuando cambie la fecha seleccionada
    useEffect(() => {
        if (selectedDate) {
            const newYear = selectedDate.getFullYear();
            const newMonth = selectedDate.getMonth() + 1;
            setYear(newYear);
            setMonth(newMonth);
        }
    }, [selectedDate]);

    useEffect(() => {
        const newDate = new Date(year, month - 1);
        const dateKey = `${year}-${month}`;

        onChange(newDate);

        // Solo cargar si es una fecha diferente a la última cargada
        if (lastLoadedDate.current !== dateKey) {
            lastLoadedDate.current = dateKey;
            onLoadData(newDate);
        }
    }, [year, month, onChange, onLoadData]);

    const goToPreviousMonth = () => {
        // No permitir cambio si hay cambios pendientes
        if (hasPendingChanges) {
            return;
        }

        const newMonth = month === 1 ? 12 : month - 1;
        const newYear = month === 1 ? year - 1 : year;
        setMonth(newMonth);
        setYear(newYear);
    };

    const goToNextMonth = () => {
        // No permitir cambio si hay cambios pendientes
        if (hasPendingChanges) {
            return;
        }

        const newMonth = month === 12 ? 1 : month + 1;
        const newYear = month === 12 ? year + 1 : year;
        setMonth(newMonth);
        setYear(newYear);
    };



    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

    return (
        <div className="flex w-full flex-col items-center gap-3 md:w-auto md:flex-row">
            {/* Month/Year Display and Navigation */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:shadow-lg">
                {/* Previous Month Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToPreviousMonth}
                    className={`h-8 w-8 rounded-l-lg rounded-r-none border-r border-slate-200 p-0 md:h-9 md:w-9 ${
                        hasPendingChanges
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                    } dark:border-slate-600 dark:text-slate-300`}
                    disabled={loading || hasPendingChanges}
                >
                    <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
                </Button>

                {/* Month Selector */}
                <Select value={String(month)} onValueChange={(val) => {
                    // No permitir cambio si hay cambios pendientes
                    if (hasPendingChanges) {
                        return;
                    }

                    const newMonth = parseInt(val);
                    setMonth(newMonth);
                }}>
                    <SelectTrigger className={`h-8 rounded-none border-0 bg-transparent focus:ring-0 focus:ring-offset-0 dark:text-slate-200 md:h-9 md:w-28 text-xs md:text-sm ${
                        hasPendingChanges ? 'cursor-not-allowed opacity-50' : ''
                    }`} disabled={hasPendingChanges}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                        {months.map((name, index) => (
                            <SelectItem key={index} value={String(index + 1)} className="dark:text-slate-200 dark:hover:bg-slate-700">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs md:text-sm">{name.slice(0, 3)}</span>
                                    {index + 1 === now.getMonth() + 1 && year === now.getFullYear() && (
                                        <div className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                                    )}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Year Selector */}
                <Select value={String(year)} onValueChange={(val) => {
                    // No permitir cambio si hay cambios pendientes
                    if (hasPendingChanges) {
                        return;
                    }

                    const newYear = parseInt(val);
                    setYear(newYear);
                }}>
                    <SelectTrigger className={`h-8 rounded-none border-0 border-l border-slate-200 bg-transparent focus:ring-0 focus:ring-offset-0 dark:border-slate-600 dark:text-slate-200 md:h-9 md:w-20 text-xs md:text-sm ${
                        hasPendingChanges ? 'cursor-not-allowed opacity-50' : ''
                    }`} disabled={hasPendingChanges}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                        {years.map((y) => (
                            <SelectItem key={y} value={String(y)} className="dark:text-slate-200 dark:hover:bg-slate-700">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs md:text-sm">{y}</span>
                                    {y === now.getFullYear() && <div className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Next Month Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToNextMonth}
                    className={`h-8 w-8 rounded-l-none rounded-r-lg border-l border-slate-200 p-0 md:h-9 md:w-9 ${
                        hasPendingChanges
                            ? 'cursor-not-allowed opacity-50'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                    } dark:border-slate-600 dark:text-slate-300`}
                    disabled={loading || hasPendingChanges}
                >
                    <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
                </Button>
            </div>

            <div className="flex w-full items-center gap-3 md:w-auto flex-row max-w-[16.5rem]">
                {/* Loading Indicator */}
                {loading && (
                    <div className="flex items-center justify-center gap-2 rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-200 dark:border dark:border-blue-800 w-full">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Cargando...
                    </div>
                )}

                {/* Pending Changes Warning */}
                {hasPendingChanges && !loading && (
                    <div className="flex items-center justify-center gap-2 rounded-md bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-200 dark:border dark:border-amber-800 w-full">
                        <div className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400"></div>
                        Guarda o deshaz los cambios
                    </div>
                )}

                {/* Current Month Indicator */}
                {isCurrentMonth && !hasPendingChanges && !loading && (
                    <div className="hidden items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 md:flex dark:bg-blue-900/50 dark:text-blue-200 dark:border dark:border-blue-800">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500 dark:bg-blue-400"></div>
                        Actual
                    </div>
                )}
            </div>
        </div>
    );
};
