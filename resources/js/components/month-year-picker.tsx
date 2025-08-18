import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Download, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

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

    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i);

    useEffect(() => {
        onChange(new Date(year, month - 1));
    }, [year, month, onChange]);

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

    const handleLoadData = () => {
        onLoadData(new Date(year, month - 1));
    };

    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

    return (
        <div className="flex w-full flex-col items-center gap-3 md:w-auto md:flex-row">
            {/* Month/Year Display and Navigation */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
                {/* Previous Month Button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={goToPreviousMonth}
                    className="h-9 w-9 rounded-l-lg rounded-r-none border-r border-slate-200 p-0 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    disabled={loading}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Month Selector */}
                <Select value={String(month)} onValueChange={(val) => setMonth(parseInt(val))}>
                    <SelectTrigger className="h-9 w-28 rounded-none border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map((name, index) => (
                            <SelectItem key={index} value={String(index + 1)}>
                                <div className="flex items-center gap-2">
                                    <span>{name.slice(0, 3)}</span>
                                    {index + 1 === now.getMonth() + 1 && year === now.getFullYear() && (
                                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                    )}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Year Selector */}
                <Select value={String(year)} onValueChange={(val) => setYear(parseInt(val))}>
                    <SelectTrigger className="h-9 w-20 rounded-none border-0 border-l border-slate-200 bg-transparent focus:ring-0 focus:ring-offset-0 dark:border-slate-700">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map((y) => (
                            <SelectItem key={y} value={String(y)}>
                                <div className="flex items-center gap-2">
                                    <span>{y}</span>
                                    {y === now.getFullYear() && <div className="h-2 w-2 rounded-full bg-blue-500"></div>}
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
                    className="h-9 w-9 rounded-l-none rounded-r-lg border-l border-slate-200 p-0 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    disabled={loading}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex w-full items-center gap-3 md:w-auto flex-row max-w-[16.5rem]">
                {/* Load Data Button */}
                <Button
                    onClick={handleLoadData}
                    disabled={loading}
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                            Cargando...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-3 w-3" />
                            Cargar
                        </>
                    )}
                </Button>

                {/* Current Month Indicator */}
                {isCurrentMonth && (
                    <div className="hidden items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 sm:flex dark:bg-blue-900/30 dark:text-blue-300">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                        Actual
                    </div>
                )}
            </div>
        </div>
    );
};
