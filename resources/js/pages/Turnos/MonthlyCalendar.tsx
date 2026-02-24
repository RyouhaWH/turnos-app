import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Calendar, Settings } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/dropdown-menu';

// ── Types ───────────────────────────────────────────────────────────────────────
interface MonthlyCalendarProps {
    shifts: Record<string, string>;
    year: number;
    month: number;
    userName: string;
    error?: string;
}

// ── Shift config ────────────────────────────────────────────────────────────────
const SHIFT_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
    M: { label: 'Mañana', bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-800 dark:text-amber-200', border: 'border-amber-300 dark:border-amber-700' },
    T: { label: 'Tarde', bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-800 dark:text-sky-200', border: 'border-sky-300 dark:border-sky-700' },
    N: { label: 'Noche', bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-800 dark:text-indigo-200', border: 'border-indigo-300 dark:border-indigo-700' },
    '1': { label: '1er Turno', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-800 dark:text-emerald-200', border: 'border-emerald-300 dark:border-emerald-700' },
    '2': { label: '2do Turno', bg: 'bg-violet-100 dark:bg-violet-900/40', text: 'text-violet-800 dark:text-violet-200', border: 'border-violet-300 dark:border-violet-700' },
    '3': { label: '3er Turno', bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-800 dark:text-rose-200', border: 'border-rose-300 dark:border-rose-700' },
    L: { label: 'Libre', bg: 'bg-slate-100 dark:bg-slate-800/60', text: 'text-slate-500 dark:text-slate-400', border: 'border-slate-300 dark:border-slate-600' },
    F: { label: 'Franco', bg: 'bg-gray-100 dark:bg-gray-800/60', text: 'text-gray-500 dark:text-gray-400', border: 'border-gray-300 dark:border-gray-600' },
    LM: { label: 'Licencia Médica', bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-200', border: 'border-red-300 dark:border-red-700' },
    PE: { label: 'Permiso', bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-800 dark:text-orange-200', border: 'border-orange-300 dark:border-orange-700' },
    S: { label: 'Suspendido', bg: 'bg-red-200 dark:bg-red-900/60', text: 'text-red-900 dark:text-red-100', border: 'border-red-400 dark:border-red-600' },
    LC: { label: 'Licencia', bg: 'bg-pink-100 dark:bg-pink-900/40', text: 'text-pink-800 dark:text-pink-200', border: 'border-pink-300 dark:border-pink-700' },
    V: { label: 'Vacaciones', bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-800 dark:text-cyan-200', border: 'border-cyan-300 dark:border-cyan-700' },
};

const getShiftStyle = (shift: string) => {
    return SHIFT_CONFIG[shift.toUpperCase()] || SHIFT_CONFIG[shift] || {
        label: shift,
        bg: 'bg-gray-100 dark:bg-gray-800/60',
        text: 'text-gray-700 dark:text-gray-300',
        border: 'border-gray-300 dark:border-gray-600',
    };
};

// ── Month names ─────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// ── Helpers ─────────────────────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
    // 0 = Monday ... 6 = Sunday
    const day = new Date(year, month - 1, 1).getDay();
    return day === 0 ? 6 : day - 1;
}

function formatDateKey(year: number, month: number, day: number): string {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ── Breadcrumbs ─────────────────────────────────────────────────────────────────
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Mi Calendario', href: '/turno-mensual' },
];

// ── Component ───────────────────────────────────────────────────────────────────
export default function MonthlyCalendar({ shifts, year, month, userName, error }: MonthlyCalendarProps) {
    const [loading, setLoading] = useState(false);

    // Inicializar estado desde localStorage si existe
    const [showLabels, setShowLabels] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('monthly_calendar_show_labels');
            if (saved !== null) return saved === 'true';
        }
        return false;
    });

    const [hideFreeDays, setHideFreeDays] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('monthly_calendar_hide_free_days');
            if (saved !== null) return saved === 'true';
        }
        return false;
    });

    // Guardar preferencias cuando cambian
    useEffect(() => {
        localStorage.setItem('monthly_calendar_show_labels', showLabels.toString());
    }, [showLabels]);

    useEffect(() => {
        localStorage.setItem('monthly_calendar_hide_free_days', hideFreeDays.toString());
    }, [hideFreeDays]);

    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    const isCurrentMonth = year === todayYear && month === todayMonth;

    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfWeek = getFirstDayOfWeek(year, month);

    const navigateMonth = useCallback((direction: -1 | 1) => {
        let newMonth = month + direction;
        let newYear = year;
        if (newMonth < 1) { newMonth = 12; newYear--; }
        if (newMonth > 12) { newMonth = 1; newYear++; }

        setLoading(true);
        router.get('/turno-mensual', { year: newYear, month: newMonth }, {
            preserveState: false,
            onFinish: () => setLoading(false),
        });
    }, [year, month]);

    const goToToday = useCallback(() => {
        if (isCurrentMonth) return;
        setLoading(true);
        router.get('/turno-mensual', { year: todayYear, month: todayMonth }, {
            preserveState: false,
            onFinish: () => setLoading(false),
        });
    }, [isCurrentMonth, todayYear, todayMonth]);

    // Build calendar grid
    const calendarDays: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
    for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
    while (calendarDays.length % 7 !== 0) calendarDays.push(null);

    // Unique shifts in this month for legend
    let uniqueShifts = [...new Set(Object.values(shifts))];
    if (hideFreeDays) {
        uniqueShifts = uniqueShifts.filter(s => s.toUpperCase() !== 'L' && s.toUpperCase() !== 'F');
    }
    uniqueShifts.sort();
    const handleMonthInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value; // Format: "YYYY-MM"
        if (!val) return;
        const [y, m] = val.split('-');
        if (y && m) {
            setLoading(true);
            router.get('/turno-mensual', { year: parseInt(y, 10), month: parseInt(m, 10) }, {
                preserveState: false,
                onFinish: () => setLoading(false),
            });
        }
    };

    // Format current year/month for the native input "YYYY-MM"
    const currentMonthValue = `${year}-${String(month).padStart(2, '0')}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mi Calendario de Turnos" />

            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
                {/* ── Header ─────────────────────────────────────────── */}
                <div className="mb-3 dark:border-slate-700 dark:bg-slate-900 sm:p-6">
                    <div className="flex flex-col gap-4">
                        {/* Title Row */}
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl leading-none">
                                    Mi Calendario
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{userName}</p>
                            </div>
                        </div>

                        {/* Controls Row */}
                        <div className="flex items-center w-full gap-2 sm:gap-3">
                            {/* Left Control: Hoy */}
                            <button
                                onClick={goToToday}
                                disabled={loading || isCurrentMonth}
                                className="shrink-0 h-10 rounded-lg border border-slate-200 bg-white px-2 sm:px-4 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                                Hoy
                            </button>

                            {/* Native Month Picker - fills available space */}
                            <input
                                type="month"
                                value={currentMonthValue}
                                onChange={handleMonthInput}
                                disabled={loading}
                                className="flex-1 min-w-0 h-10 cursor-pointer rounded-lg border border-slate-200 bg-white px-1 sm:px-3 text-sm font-medium text-slate-700 text-center sm:text-left [&::-webkit-datetime-edit]:justify-center sm:[&::-webkit-datetime-edit]:justify-start shadow-sm transition-all hover:bg-slate-50 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                            />

                            {/* Right Controls */}
                            <div className="shrink-0 flex items-center gap-1 sm:gap-2">
                                {/* Navigation Arrows */}
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => navigateMonth(-1)}
                                        disabled={loading}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => navigateMonth(1)}
                                        disabled={loading}
                                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Settings Dropdown */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex h-10 w-10 sm:w-auto sm:px-3 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                                            <Settings className="h-4 w-4" />
                                            <span className="hidden sm:inline">Opciones</span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
                                        <DropdownMenuLabel className="text-xs uppercase text-slate-500 dark:text-slate-400">Preferencias de vista</DropdownMenuLabel>
                                        <DropdownMenuSeparator />

                                        <div className="flex flex-col gap-3 p-2">
                                            <label className="flex items-center justify-between cursor-pointer w-full">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Nombres completos</span>
                                                <div className="relative inline-flex items-center">
                                                    <input type="checkbox" className="sr-only" checked={showLabels} onChange={() => setShowLabels(!showLabels)} />
                                                    <div className={`block w-10 h-6 rounded-full transition-colors ${showLabels ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showLabels ? 'translate-x-4' : ''}`}></div>
                                                </div>
                                            </label>

                                            <label className="flex items-center justify-between cursor-pointer w-full">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Ocultar libres (L/F)</span>
                                                <div className="relative inline-flex items-center">
                                                    <input type="checkbox" className="sr-only" checked={hideFreeDays} onChange={() => setHideFreeDays(!hideFreeDays)} />
                                                    <div className={`block w-10 h-6 rounded-full transition-colors ${hideFreeDays ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${hideFreeDays ? 'translate-x-4' : ''}`}></div>
                                                </div>
                                            </label>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </div>
                </div>
                {/* ── Error message ──────────────────────────────────── */}
                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
                        {error}
                    </div>
                )}

                {/* ── Calendar grid ──────────────────────────────────── */}
                <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm transition-opacity dark:border-slate-700 dark:bg-slate-900 ${loading ? 'opacity-50' : ''}`}>
                    {/* Day headers */}
                    <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-700">
                        {DAY_NAMES.map((day, i) => (
                            <div
                                key={day}
                                className={`py-3 text-center text-xs font-semibold uppercase tracking-wider sm:text-sm ${i >= 5
                                    ? 'text-slate-400 dark:text-slate-500'
                                    : 'text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7">
                        {calendarDays.map((day, index) => {
                            if (day === null) {
                                return (
                                    <div
                                        key={`empty-${index}`}
                                        className="min-h-[60px] border-b border-r border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/30 sm:min-h-[80px]"
                                    />
                                );
                            }

                            const dateKey = formatDateKey(year, month, day);
                            let shift = shifts[dateKey];

                            // If hiding free days and this is a free day (L or F), pretend we don't have a shift
                            if (hideFreeDays && shift && (shift.toUpperCase() === 'L' || shift.toUpperCase() === 'F')) {
                                shift = '';
                            }

                            const shiftStyle = shift ? getShiftStyle(shift) : null;
                            const isToday = isCurrentMonth && day === todayDay;
                            const dayOfWeek = (firstDayOfWeek + day - 1) % 7;
                            const isWeekend = dayOfWeek >= 5;

                            return (
                                <div
                                    key={day}
                                    className={`relative flex min-h-[105px] flex-col items-center justify-center border-b border-r transition-all sm:min-h-[100px] ${shiftStyle
                                        ? `${shiftStyle.bg} ${shiftStyle.border}`
                                        : isToday
                                            ? 'border-slate-100 bg-blue-50/80 ring-2 ring-inset ring-blue-400 dark:border-slate-800 dark:bg-blue-950/40 dark:ring-blue-500'
                                            : isWeekend
                                                ? 'border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40'
                                                : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900'
                                        } ${isToday && shiftStyle ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                                >
                                    {/* Day number */}
                                    <span
                                        className={`absolute top-1 left-1 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium sm:h-7 sm:w-7 sm:text-sm ${isToday
                                            ? 'bg-blue-600 font-bold text-white shadow-sm'
                                            : shiftStyle
                                                ? `${shiftStyle.text} opacity-70`
                                                : isWeekend
                                                    ? 'text-slate-400 dark:text-slate-500'
                                                    : 'text-slate-700 dark:text-slate-300'
                                            }`}
                                    >
                                        {day}
                                    </span>

                                    {/* Shift code centered */}
                                    {shiftStyle && (
                                        <span className={`font-bold text-center px-1 transition-all ${showLabels ? 'text-xs sm:text-sm leading-tight' : 'text-lg sm:text-xl'
                                            } ${shiftStyle.text}`}>
                                            {showLabels ? shiftStyle.label : shift.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Legend ──────────────────────────────────────────── */}
                {uniqueShifts.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                        <h3 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Leyenda
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {uniqueShifts.map((shift) => {
                                const style = getShiftStyle(shift);
                                return (
                                    <div
                                        key={shift}
                                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${style.bg} ${style.text} ${style.border}`}
                                    >
                                        <span className="font-bold">{shift.toUpperCase()}</span>
                                        <span className="opacity-75">–</span>
                                        <span>{style.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {uniqueShifts.length === 0 && !error && (
                    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-600 dark:bg-slate-900/50">
                        <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-400" />
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            No hay turnos asignados para este mes.
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
