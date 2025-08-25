import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface MonthYearPickerProps {
    onChange: (date: Date) => void;
    onLoadData: (date: Date) => void;
    loading: boolean;
    currentMonthTitle: string;
}

export const MonthYearPicker = ({ onChange, onLoadData, loading, currentMonthTitle }: MonthYearPickerProps) => {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth() + 1); // 1-12
    const lastLoadedDate = useRef<string>(`${now.getFullYear()}-${now.getMonth() + 1}`); // Para evitar cargas duplicadas

    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i);

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
        if (month === 1) {
            setMonth(12);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const goToNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
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
                    className="h-9 w-9 rounded-l-lg rounded-r-none border-r border-slate-200 p-0 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700 dark:text-slate-300"
                    disabled={loading}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Month Selector */}
                <Select value={String(month)} onValueChange={(val) => setMonth(parseInt(val))}>
                    <SelectTrigger className="h-9 w-28 rounded-none border-0 bg-transparent focus:ring-0 focus:ring-offset-0 dark:text-slate-200">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                        {months.map((name, index) => (
                            <SelectItem key={index} value={String(index + 1)} className="dark:text-slate-200 dark:hover:bg-slate-700">
                                <div className="flex items-center gap-2">
                                    <span>{name.slice(0, 3)}</span>
                                    {index + 1 === now.getMonth() + 1 && year === now.getFullYear() && (
                                        <div className="h-2 w-2 rounded-full bg-blue-500 dark:bg-blue-400"></div>
                                    )}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Year Selector */}
                <Select value={String(year)} onValueChange={(val) => setYear(parseInt(val))}>
                    <SelectTrigger className="h-9 w-20 rounded-none border-0 border-l border-slate-200 bg-transparent focus:ring-0 focus:ring-offset-0 dark:border-slate-600 dark:text-slate-200">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                        {years.map((y) => (
                            <SelectItem key={y} value={String(y)} className="dark:text-slate-200 dark:hover:bg-slate-700">
                                <div className="flex items-center gap-2">
                                    <span>{y}</span>
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
                    className="h-9 w-9 rounded-l-none rounded-r-lg border-l border-slate-200 p-0 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700 dark:text-slate-300"
                    disabled={loading}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex w-full items-center gap-3 md:w-auto flex-row max-w-[16.5rem]">
                {/* Loading Indicator */}
                {loading && (
                    <div className="flex items-center gap-2 rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-200 dark:border dark:border-blue-800">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Cargando...
                    </div>
                )}

                {/* Current Month Indicator */}
                {isCurrentMonth && (
                    <div className="hidden items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 md:flex dark:bg-blue-900/50 dark:text-blue-200 dark:border dark:border-blue-800">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500 dark:bg-blue-400"></div>
                        Actual
                    </div>
                )}
            </div>
        </div>
    );
};
