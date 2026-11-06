/**
 * Lógica de la planilla de turnos: tipos, fechas, colores y cálculo de alertas.
 * Todo es puro (sin React) para poder reutilizarlo y probarlo.
 */

export type Category = 'work' | 'off' | 'absence';

export interface ShiftType {
    code: string;
    name: string;
    category: Category;
    starts_at: string | null;
    ends_at: string | null;
    hours: number;
    base_code: string | null;
    is_extra: boolean;
    color: string;
}

export interface PlanEmployee {
    id: number;
    name: string;
    status: string | null;
}

/** employee_id → fecha (YYYY-MM-DD) → código ('' = sin turno). */
export type CellMap = Record<number, Record<string, string>>;

export interface MinRule {
    min: number;
    weekdays_only: boolean;
}

export interface PlanningRules {
    weekly_target: number;
    weekly_max: number;
    min_rest_hours: number;
    max_consecutive_days: number;
    mode: 'week' | 'avg';
}

export type Severity = 'crit' | 'warn' | 'info';
export type AlertType = 'cov' | 'rest' | 'max' | 'min' | 'run' | 'unknown' | 'empty';

export interface PlanAlert {
    id: string;
    sev: Severity;
    type: AlertType;
    employeeId?: number;
    who: string;
    text: string;
    /** Celdas involucradas: [employee_id, fecha]. */
    cells: Array<[number, string]>;
    /** Para alertas de cobertura: la fecha y el turno. */
    date?: string;
    code?: string;
}

export const ALERT_GROUPS: Array<{ type: AlertType; label: string }> = [
    { type: 'cov', label: 'Cobertura bajo el mínimo' },
    { type: 'rest', label: 'Descanso insuficiente' },
    { type: 'max', label: 'Sobre la jornada máxima' },
    { type: 'min', label: 'Bajo el objetivo de horas' },
    { type: 'run', label: 'Demasiados días seguidos' },
    { type: 'unknown', label: 'Códigos que no existen' },
    { type: 'empty', label: 'Días sin turno' },
];

/** Clases por color del catálogo. Strings completos para que Tailwind los genere. */
export const SHIFT_COLOR_CLASSES: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-900 dark:bg-amber-500/25 dark:text-amber-100',
    teal: 'bg-teal-100 text-teal-900 dark:bg-teal-500/25 dark:text-teal-100',
    indigo: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-500/30 dark:text-indigo-100',
    sky: 'bg-sky-100 text-sky-900 dark:bg-sky-500/25 dark:text-sky-100',
    cyan: 'bg-cyan-100 text-cyan-900 dark:bg-cyan-500/25 dark:text-cyan-100',
    violet: 'bg-violet-100 text-violet-900 dark:bg-violet-500/30 dark:text-violet-100',
    pink: 'bg-pink-100 text-pink-900 dark:bg-pink-500/25 dark:text-pink-100',
    orange: 'bg-orange-100 text-orange-900 dark:bg-orange-500/25 dark:text-orange-100',
    green: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/25 dark:text-emerald-100',
    red: 'bg-red-100 text-red-900 dark:bg-red-500/25 dark:text-red-100',
    slate: 'bg-slate-200 text-slate-800 dark:bg-slate-500/30 dark:text-slate-100',
    gray: 'text-slate-400 dark:text-slate-500',
};

export const shiftColor = (type?: ShiftType) => (type ? (SHIFT_COLOR_CLASSES[type.color] ?? SHIFT_COLOR_CLASSES.gray) : '');

/* ── Fechas (siempre como texto YYYY-MM-DD, sin zona horaria) ─────────────────── */

const pad = (n: number) => String(n).padStart(2, '0');
export const WEEKDAY_LETTER = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
export const WEEKDAY_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
export const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function parseDate(s: string): Date {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}
export function formatDate(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function dateRange(from: string, to: string): string[] {
    const out: string[] = [];
    const d = parseDate(from);
    const end = parseDate(to);
    while (d <= end) {
        out.push(formatDate(d));
        d.setDate(d.getDate() + 1);
    }
    return out;
}
export const weekday = (s: string) => parseDate(s).getDay();
export const isWeekend = (s: string) => {
    const w = weekday(s);
    return w === 0 || w === 6;
};
export const dayNumber = (s: string) => Number(s.slice(8, 10));
export const dayLabel = (s: string) => `${WEEKDAY_SHORT[weekday(s)]} ${dayNumber(s)}`;
export function shiftMonth(month: string, delta: number): string {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

/* ── Horarios ──────────────────────────────────────────────────────────────── */

const toHours = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    return h + m / 60;
};

/** Inicio y fin en horas desde la medianoche del día del turno (el fin puede pasar de 24). */
export function shiftSpan(t?: ShiftType): { start: number; end: number } | null {
    if (!t || t.category !== 'work' || !t.starts_at || !t.ends_at) return null;
    const start = toHours(t.starts_at);
    let end = toHours(t.ends_at);
    if (end <= start) end += 24;
    return { start, end };
}

export const isWork = (t?: ShiftType) => t?.category === 'work';
export const baseCode = (t: ShiftType | undefined, code: string) => t?.base_code || code;
export const scheduleLabel = (t?: ShiftType) => (t?.starts_at && t?.ends_at ? `${t.starts_at}–${t.ends_at}` : '');

const fmtHours = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

function rangeText(dates: string[]): string {
    const days = dates.map(dayNumber);
    const parts: string[] = [];
    let start = days[0];
    let prev = days[0];
    for (let i = 1; i <= days.length; i++) {
        const d = days[i];
        if (d === prev + 1) {
            prev = d;
            continue;
        }
        parts.push(start === prev ? `${start}` : `${start}–${prev}`);
        start = d;
        prev = d;
    }
    return parts.join(', ');
}

/* ── Alertas ──────────────────────────────────────────────────────────────── */

export interface EvaluateInput {
    employees: PlanEmployee[];
    cells: CellMap;
    /** Días del mes que se planifica. */
    monthDays: string[];
    /** Semanas completas que cubren el mes (lunes a domingo). */
    contextDays: string[];
    types: Record<string, ShiftType>;
    rules: PlanningRules;
    minCoverage: Record<string, MinRule>;
    holidays: Record<string, string>;
}

export function evaluatePlan(input: EvaluateInput): PlanAlert[] {
    const { employees, cells, monthDays, contextDays, types, rules, minCoverage, holidays } = input;
    const inMonth = new Set(monthDays);
    const alerts: PlanAlert[] = [];
    const credit = rules.weekly_target / 5;
    const code = (id: number, d: string) => cells[id]?.[d] ?? '';
    const hoursOf = (c: string) => (isWork(types[c]) ? Number(types[c].hours) || 0 : 0);
    const creditOf = (c: string, d: string) => {
        const w = weekday(d);
        if (w === 0 || w === 6) return 0;
        const t = types[c];
        if (t?.category === 'absence') return credit;
        if (holidays[d] && (t?.category === 'off' || c === '')) return credit;
        return 0;
    };

    employees.forEach((e) => {
        const who = e.name;

        const empty = monthDays.filter((d) => code(e.id, d) === '');
        if (empty.length) {
            alerts.push({
                id: `empty-${e.id}`,
                sev: 'info',
                type: 'empty',
                employeeId: e.id,
                who,
                text: `Sin turno: ${rangeText(empty)}`,
                cells: empty.map((d) => [e.id, d]),
            });
        }

        const unknown = monthDays.filter((d) => code(e.id, d) !== '' && !types[code(e.id, d)]);
        if (unknown.length) {
            const list = [...new Set(unknown.map((d) => code(e.id, d)))].join(', ');
            alerts.push({
                id: `unknown-${e.id}`,
                sev: 'warn',
                type: 'unknown',
                employeeId: e.id,
                who,
                text: `${list} (días ${rangeText(unknown)}). Cámbialos por un turno del catálogo.`,
                cells: unknown.map((d) => [e.id, d]),
            });
        }

        for (let i = 0; i < contextDays.length - 1; i++) {
            const d1 = contextDays[i];
            const d2 = contextDays[i + 1];
            if (!inMonth.has(d1) && !inMonth.has(d2)) continue;
            const a = shiftSpan(types[code(e.id, d1)]);
            const b = shiftSpan(types[code(e.id, d2)]);
            if (!a || !b) continue;
            const rest = 24 + b.start - a.end;
            if (rest < rules.min_rest_hours) {
                alerts.push({
                    id: `rest-${e.id}-${d1}`,
                    sev: 'crit',
                    type: 'rest',
                    employeeId: e.id,
                    who,
                    text: `${dayLabel(d1)} ${types[code(e.id, d1)].name} → ${dayLabel(d2)} ${types[code(e.id, d2)].name}: ${fmtHours(rest)} h de descanso`,
                    cells: [
                        [e.id, d1],
                        [e.id, d2],
                    ],
                });
            }
        }

        let run: string[] = [];
        const flushRun = () => {
            if (run.length > rules.max_consecutive_days && run.some((d) => inMonth.has(d))) {
                alerts.push({
                    id: `run-${e.id}-${run[0]}`,
                    sev: 'warn',
                    type: 'run',
                    employeeId: e.id,
                    who,
                    text: `${run.length} días seguidos trabajando (${dayLabel(run[0])} a ${dayLabel(run[run.length - 1])})`,
                    cells: run.map((d) => [e.id, d]),
                });
            }
            run = [];
        };
        contextDays.forEach((d) => {
            if (isWork(types[code(e.id, d)])) run.push(d);
            else flushRun();
        });
        flushRun();

        if (rules.mode === 'week') {
            for (let i = 0; i + 7 <= contextDays.length; i += 7) {
                const week = contextDays.slice(i, i + 7);
                if (!week.some((d) => inMonth.has(d))) continue;
                const worked = week.reduce((s, d) => s + hoursOf(code(e.id, d)), 0);
                const credited = week.reduce((s, d) => s + creditOf(code(e.id, d), d), 0);
                const label = `Semana del ${dayNumber(week[0])}/${week[0].slice(5, 7)} al ${dayNumber(week[6])}/${week[6].slice(5, 7)}`;
                const cellsWeek = week.filter((d) => inMonth.has(d)).map((d) => [e.id, d] as [number, string]);
                // Si la semana toca días de otro mes que aún no se planifican, no se puede saber si llega al objetivo.
                const unplanned = week.some((d) => !inMonth.has(d) && code(e.id, d) === '');
                if (worked > rules.weekly_max) {
                    alerts.push({
                        id: `max-${e.id}-${week[0]}`,
                        sev: 'crit',
                        type: 'max',
                        employeeId: e.id,
                        who,
                        text: `${label}: ${fmtHours(worked)} h trabajadas (máximo ${rules.weekly_max} h)`,
                        cells: cellsWeek,
                    });
                } else if (!unplanned && worked + credited < rules.weekly_target) {
                    alerts.push({
                        id: `min-${e.id}-${week[0]}`,
                        sev: 'warn',
                        type: 'min',
                        employeeId: e.id,
                        who,
                        text: `${label}: ${fmtHours(worked + credited)} h (objetivo ${rules.weekly_target} h)`,
                        cells: cellsWeek,
                    });
                }
            }
        } else {
            const worked = monthDays.reduce((s, d) => s + hoursOf(code(e.id, d)), 0);
            const credited = monthDays.reduce((s, d) => s + creditOf(code(e.id, d), d), 0);
            const weeks = monthDays.length / 7;
            const cellsMonth = monthDays.map((d) => [e.id, d] as [number, string]);
            if (worked / weeks > rules.weekly_max) {
                alerts.push({
                    id: `max-${e.id}`,
                    sev: 'crit',
                    type: 'max',
                    employeeId: e.id,
                    who,
                    text: `Promedio de ${fmtHours(Math.round((worked / weeks) * 10) / 10)} h por semana (máximo ${rules.weekly_max} h)`,
                    cells: cellsMonth,
                });
            } else if ((worked + credited) / weeks < rules.weekly_target) {
                alerts.push({
                    id: `min-${e.id}`,
                    sev: 'warn',
                    type: 'min',
                    employeeId: e.id,
                    who,
                    text: `Promedio de ${fmtHours(Math.round(((worked + credited) / weeks) * 10) / 10)} h por semana (objetivo ${rules.weekly_target} h)`,
                    cells: cellsMonth,
                });
            }
        }
    });

    Object.entries(minCoverage).forEach(([c, rule]) => {
        if (!rule || rule.min <= 0) return;
        const label = types[c]?.name ?? c;
        monthDays.forEach((d) => {
            if (rule.weekdays_only && (isWeekend(d) || holidays[d])) return;
            const n = employees.reduce((s, e) => s + (baseCode(types[code(e.id, d)], code(e.id, d)) === c ? 1 : 0), 0);
            if (n < rule.min) {
                alerts.push({
                    id: `cov-${c}-${d}`,
                    sev: 'crit',
                    type: 'cov',
                    who: dayLabel(d),
                    text: `${label}: ${n} de ${rule.min} como mínimo`,
                    cells: employees.map((e) => [e.id, d]),
                    date: d,
                    code: c,
                });
            }
        });
    });

    const order = ALERT_GROUPS.map((g) => g.type);
    return alerts.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
}

/** Horas trabajadas en el mes por funcionario. */
export function monthHours(cells: CellMap, employeeId: number, monthDays: string[], types: Record<string, ShiftType>): number {
    return monthDays.reduce((s, d) => {
        const t = types[cells[employeeId]?.[d] ?? ''];
        return s + (isWork(t) ? Number(t!.hours) || 0 : 0);
    }, 0);
}
