import {
    type CellMap,
    type MinRule,
    type PlanAlert,
    type PlanEmployee,
    type ShiftType,
    baseCode,
    dayLabel,
    dayNumber,
    isWeekend,
    isWork,
    scheduleLabel,
    shiftColor,
    weekday,
    WEEKDAY_LETTER,
} from '@/lib/planning';
import { cn } from '@/lib/utils';
import { Pencil } from 'lucide-react';
import { type ClipboardEvent, type KeyboardEvent, type MouseEvent, useEffect, useMemo, useRef } from 'react';

export interface GridPos {
    r: number;
    c: number;
}
export interface Selection {
    anchor: GridPos;
    focus: GridPos;
}
export interface CellChange {
    employeeId: number;
    date: string;
    code: string;
}

export const rectOf = (s: Selection) => ({
    r0: Math.min(s.anchor.r, s.focus.r),
    r1: Math.max(s.anchor.r, s.focus.r),
    c0: Math.min(s.anchor.c, s.focus.c),
    c1: Math.max(s.anchor.c, s.focus.c),
});

const ROW_H = 28;

interface SheetGridProps {
    employees: PlanEmployee[];
    days: string[];
    cells: CellMap;
    published: CellMap;
    types: Record<string, ShiftType>;
    holidays: Record<string, string>;
    alerts: PlanAlert[];
    selection: Selection;
    onSelectionChange: (s: Selection) => void;
    onApply: (changes: CellChange[], opts?: { merge?: boolean }) => void;
    onUndo: () => void;
    onNotify: (message: string, kind?: 'ok' | 'warn') => void;
    footerRows: Array<{ code: string; label: string }>;
    minCoverage: Record<string, MinRule>;
    onEditMinimum: (code: string) => void;
    hoursByEmployee: Record<number, number>;
    flashKeys: Set<string>;
    today: string;
}

export function SheetGrid(props: SheetGridProps) {
    const { employees, days, cells, published, types, holidays, alerts, selection, footerRows, minCoverage, hoursByEmployee, flashKeys, today } =
        props;
    const containerRef = useRef<HTMLDivElement>(null);
    const selRef = useRef(selection);
    const pending = useRef<{ code: string; timer: number } | null>(null);
    const dragging = useRef(false);
    selRef.current = selection;

    const codes = useMemo(() => Object.keys(types), [types]);
    const rect = rectOf(selection);

    /* ── Marcas de alertas sobre celdas y personas ── */
    const { flags, perEmployee, hoursState, lowCoverage } = useMemo(() => {
        const flags = new Map<string, 'crit' | 'warn'>();
        const perEmployee = new Map<number, { crit: number; warn: number; info: number }>();
        const hoursState = new Map<number, 'hi' | 'lo'>();
        const lowCoverage = new Set<string>();
        alerts.forEach((a) => {
            if (a.employeeId != null) {
                const p = perEmployee.get(a.employeeId) ?? { crit: 0, warn: 0, info: 0 };
                p[a.sev]++;
                perEmployee.set(a.employeeId, p);
            }
            if (a.type === 'rest' || a.type === 'unknown') a.cells.forEach(([e, d]) => flags.set(`${e}|${d}`, a.type === 'rest' ? 'crit' : 'warn'));
            if (a.type === 'run') a.cells.slice(-1).forEach(([e, d]) => !flags.has(`${e}|${d}`) && flags.set(`${e}|${d}`, 'warn'));
            if (a.type === 'max' && a.employeeId != null) hoursState.set(a.employeeId, 'hi');
            if (a.type === 'min' && a.employeeId != null && !hoursState.has(a.employeeId)) hoursState.set(a.employeeId, 'lo');
            if (a.type === 'cov' && a.code && a.date) lowCoverage.add(`${a.code}|${a.date}`);
        });
        return { flags, perEmployee, hoursState, lowCoverage };
    }, [alerts]);

    /* ── Selección y movimiento ── */
    const setSel = (s: Selection) => {
        selRef.current = s;
        props.onSelectionChange(s);
    };
    const scrollToCell = (r: number, c: number) => {
        requestAnimationFrame(() => {
            containerRef.current
                ?.querySelector<HTMLElement>(`td[data-r="${r}"][data-c="${c}"]`)
                ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        });
    };
    const move = (dr: number, dc: number, extend = false) => {
        const cur = selRef.current;
        const r = Math.max(0, Math.min(employees.length - 1, cur.focus.r + dr));
        const c = Math.max(0, Math.min(days.length - 1, cur.focus.c + dc));
        setSel({ anchor: extend ? cur.anchor : { r, c }, focus: { r, c } });
        scrollToCell(r, c);
    };
    const isSingle = () => {
        const q = rectOf(selRef.current);
        return q.r0 === q.r1 && q.c0 === q.c1;
    };
    const advance = () => {
        if (isSingle()) move(0, 1);
    };
    const settle = () => {
        if (pending.current) {
            window.clearTimeout(pending.current.timer);
            pending.current = null;
        }
    };
    useEffect(() => () => settle(), []);

    const applyToSelection = (code: string, merge = false) => {
        const q = rectOf(selRef.current);
        const changes: CellChange[] = [];
        for (let r = q.r0; r <= q.r1; r++) for (let c = q.c0; c <= q.c1; c++) changes.push({ employeeId: employees[r].id, date: days[c], code });
        props.onApply(changes, { merge });
    };

    /* Escritura tipo Excel: "MTTNNFLL" llena la fila; los códigos de dos letras (NE, LM) se completan si se escriben seguido. */
    const typeKey = (k: string) => {
        if (pending.current && codes.includes(pending.current.code + k)) {
            const code = pending.current.code + k;
            settle();
            applyToSelection(code, true);
            advance();
            return;
        }
        if (pending.current) {
            settle();
            advance();
        }
        if (!codes.includes(k)) {
            props.onNotify(`"${k}" no es un turno del catálogo.`, 'warn');
            return;
        }
        const single = isSingle();
        applyToSelection(k);
        if (!single) return;
        if (codes.some((c) => c !== k && c.startsWith(k))) {
            pending.current = {
                code: k,
                timer: window.setTimeout(() => {
                    pending.current = null;
                    advance();
                }, 900),
            };
        } else {
            advance();
        }
    };

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const mod = e.ctrlKey || e.metaKey;
        if (mod && e.key.toLowerCase() === 'z') {
            e.preventDefault();
            settle();
            props.onUndo();
            return;
        }
        if (mod || e.altKey) return;
        const arrows: Record<string, [number, number]> = {
            ArrowUp: [-1, 0],
            ArrowDown: [1, 0],
            ArrowLeft: [0, -1],
            ArrowRight: [0, 1],
            Enter: [1, 0],
            Tab: [0, 1],
        };
        const mv = arrows[e.key];
        if (mv) {
            e.preventDefault();
            settle();
            move(mv[0], e.key === 'Tab' && e.shiftKey ? -1 : mv[1], e.shiftKey && e.key.startsWith('Arrow'));
            return;
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            settle();
            applyToSelection('');
            return;
        }
        if (e.key === 'Escape') {
            settle();
            setSel({ anchor: selRef.current.focus, focus: selRef.current.focus });
            return;
        }
        if (e.key.length === 1 && /[0-9a-z]/i.test(e.key)) {
            e.preventDefault();
            typeKey(e.key.toUpperCase());
        }
    };

    const posFrom = (target: EventTarget) => {
        const td = (target as HTMLElement).closest<HTMLElement>('td[data-r]');
        return td ? { r: Number(td.dataset.r), c: Number(td.dataset.c) } : null;
    };
    const onMouseDown = (e: MouseEvent) => {
        const p = posFrom(e.target);
        if (!p) return;
        e.preventDefault();
        settle();
        containerRef.current?.focus({ preventScroll: true });
        setSel({ anchor: e.shiftKey ? selRef.current.anchor : p, focus: p });
        dragging.current = true;
    };
    const onMouseOver = (e: MouseEvent) => {
        if (!dragging.current) return;
        const p = posFrom(e.target);
        if (p && (p.r !== selRef.current.focus.r || p.c !== selRef.current.focus.c)) setSel({ anchor: selRef.current.anchor, focus: p });
    };
    useEffect(() => {
        const up = () => {
            dragging.current = false;
        };
        window.addEventListener('mouseup', up);
        return () => window.removeEventListener('mouseup', up);
    }, []);

    /* ── Portapapeles (compatible con Excel: columnas con tabulación, filas con salto de línea) ── */
    const onCopy = (e: ClipboardEvent<HTMLDivElement>) => {
        const q = rectOf(selRef.current);
        const lines: string[] = [];
        for (let r = q.r0; r <= q.r1; r++) {
            const row: string[] = [];
            for (let c = q.c0; c <= q.c1; c++) row.push(cells[employees[r].id]?.[days[c]] ?? '');
            lines.push(row.join('\t'));
        }
        e.clipboardData.setData('text/plain', lines.join('\n'));
        e.preventDefault();
        props.onNotify(`${(q.r1 - q.r0 + 1) * (q.c1 - q.c0 + 1)} celdas copiadas`);
    };
    const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
        const text = e.clipboardData.getData('text/plain');
        if (!text) return;
        e.preventDefault();
        settle();
        const rows = text.replace(/\r/g, '').split('\n');
        if (rows.length > 1 && rows[rows.length - 1] === '') rows.pop();
        const q = rectOf(selRef.current);
        const changes: CellChange[] = [];
        let bad = 0;
        const accept = (raw: string, r: number, c: number) => {
            const v = raw.trim().toUpperCase();
            if (v === '' || codes.includes(v)) changes.push({ employeeId: employees[r].id, date: days[c], code: v });
            else bad++;
        };
        if (rows.length === 1 && !rows[0].includes('\t')) {
            for (let r = q.r0; r <= q.r1; r++) for (let c = q.c0; c <= q.c1; c++) accept(rows[0], r, c);
        } else {
            rows.forEach((line, dr) =>
                line.split('\t').forEach((raw, dc) => {
                    const r = q.r0 + dr;
                    const c = q.c0 + dc;
                    if (r < employees.length && c < days.length) accept(raw, r, c);
                }),
            );
        }
        if (changes.length) props.onApply(changes);
        props.onNotify(
            bad ? `${changes.length} celdas pegadas. ${bad} tenían códigos que no existen y quedaron igual.` : `${changes.length} celdas pegadas`,
            bad ? 'warn' : 'ok',
        );
    };

    /* ── Conteos del pie ── */
    const count = (code: string, d: string) =>
        employees.reduce((n, e) => {
            const c = cells[e.id]?.[d] ?? '';
            return n + (baseCode(types[c], c) === code ? 1 : 0);
        }, 0);
    const footer = [
        ...footerRows.map((f) => ({ key: f.code, label: f.label, code: f.code, fn: (d: string) => count(f.code, d) })),
        { key: '__work', label: 'En servicio', code: null, fn: (d: string) => employees.filter((e) => isWork(types[cells[e.id]?.[d] ?? ''])).length },
        {
            key: '__abs',
            label: 'Ausentes',
            code: null,
            fn: (d: string) => employees.filter((e) => types[cells[e.id]?.[d] ?? '']?.category === 'absence').length,
        },
    ];

    const stickyHead = 'sticky top-0 z-20 bg-white dark:bg-slate-900';
    const nameCol = 'sticky left-0 w-38 min-w-38 max-w-38 truncate border-r border-b border-slate-300 px-2.5 text-left dark:border-slate-600';

    return (
        <div
            ref={containerRef}
            id="planilla-grid"
            tabIndex={0}
            role="grid"
            aria-label="Planilla de turnos del mes"
            aria-rowcount={employees.length}
            aria-colcount={days.length}
            onKeyDown={onKeyDown}
            onCopy={onCopy}
            onPaste={onPaste}
            className="h-full min-h-0 overflow-auto rounded-xl border border-slate-200 bg-white outline-none focus-visible:ring-2 focus-visible:ring-sky-600/40 dark:border-slate-700 dark:bg-slate-900"
        >
            <table className="border-separate border-spacing-0 text-xs tabular-nums" onMouseDown={onMouseDown} onMouseOver={onMouseOver}>
                <thead>
                    <tr>
                        <th
                            scope="col"
                            className={cn(nameCol, stickyHead, 'z-30 h-10 text-[11px] font-semibold tracking-wide text-slate-500 uppercase')}
                        >
                            Funcionarios · {employees.length}
                        </th>
                        {days.map((d) => {
                            const holiday = holidays[d];
                            return (
                                <th
                                    key={d}
                                    scope="col"
                                    title={holiday ? `Feriado: ${holiday}` : undefined}
                                    className={cn(
                                        stickyHead,
                                        'h-10 w-[26px] min-w-[26px] border-r border-b border-slate-200 text-center leading-tight font-medium text-slate-500 dark:border-slate-700',
                                        (isWeekend(d) || holiday) && 'bg-slate-50 dark:bg-slate-800',
                                        holiday && 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
                                        weekday(d) === 1 && 'border-l-2 border-l-slate-300 dark:border-l-slate-600',
                                    )}
                                >
                                    <span className="block text-[10px]">{WEEKDAY_LETTER[weekday(d)]}</span>
                                    <span
                                        className={cn(
                                            'mx-auto block w-[22px] rounded text-[12px] font-semibold text-slate-800 dark:text-slate-100',
                                            holiday && 'text-amber-700 dark:text-amber-300',
                                            d === today && 'bg-sky-600 text-white dark:bg-sky-500 dark:text-white',
                                        )}
                                    >
                                        {dayNumber(d)}
                                    </span>
                                </th>
                            );
                        })}
                        <th
                            scope="col"
                            className={cn(
                                stickyHead,
                                'right-9 z-30 w-14 min-w-14 border-b border-l border-slate-300 px-2 text-right text-[11px] font-semibold text-slate-500 dark:border-slate-600',
                            )}
                        >
                            Horas
                        </th>
                        <th
                            scope="col"
                            className={cn(
                                stickyHead,
                                'right-0 z-30 w-9 min-w-9 border-b border-slate-300 text-center text-[11px] font-semibold text-slate-500 dark:border-slate-600',
                            )}
                            title="Alertas por persona"
                        >
                            !
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((emp, r) => {
                        const p = perEmployee.get(emp.id);
                        const hs = hoursState.get(emp.id);
                        return (
                            <tr key={emp.id}>
                                <th
                                    scope="row"
                                    title={emp.name}
                                    className={cn(
                                        nameCol,
                                        'z-10 h-7 bg-white text-[13px] font-medium text-slate-800 dark:bg-slate-900 dark:text-slate-100',
                                        emp.status === 'inactivo' && 'text-slate-400 line-through',
                                    )}
                                >
                                    {emp.name}
                                </th>
                                {days.map((d, c) => {
                                    const code = cells[emp.id]?.[d] ?? '';
                                    const t = types[code];
                                    const key = `${emp.id}|${d}`;
                                    const dirty = (published[emp.id]?.[d] ?? '') !== code;
                                    const selected = r >= rect.r0 && r <= rect.r1 && c >= rect.c0 && c <= rect.c1;
                                    const active = r === selection.focus.r && c === selection.focus.c;
                                    const flag = flags.get(key);
                                    const offDay = isWeekend(d) || !!holidays[d];
                                    return (
                                        <td
                                            key={d}
                                            data-r={r}
                                            data-c={c}
                                            title={`${emp.name} · ${dayLabel(d)} · ${t ? `${t.name}${scheduleLabel(t) ? ` ${scheduleLabel(t)}` : ''}` : code ? `${code} (no existe en el catálogo)` : 'sin turno'}`}
                                            className={cn(
                                                'relative h-7 w-[26px] min-w-[26px] cursor-cell border-r border-b border-slate-200 text-center font-mono text-[11.5px] font-semibold select-none dark:border-slate-700',
                                                t
                                                    ? shiftColor(t)
                                                    : code
                                                      ? 'bg-white text-red-700 underline decoration-wavy dark:bg-slate-900 dark:text-red-300'
                                                      : 'bg-[repeating-linear-gradient(135deg,transparent_0_4px,rgb(226_232_240)_4px_5px)] dark:bg-[repeating-linear-gradient(135deg,transparent_0_4px,rgb(51_65_85)_4px_5px)]',
                                                t?.category === 'off' && offDay && 'bg-slate-50 dark:bg-slate-800/70',
                                                weekday(d) === 1 && 'border-l-2 border-l-slate-300 dark:border-l-slate-600',
                                                selected && 'shadow-[inset_0_0_0_999px_rgba(2,132,199,0.16)]',
                                                active && 'outline-2 -outline-offset-2 outline-sky-600 outline-solid dark:outline-sky-400',
                                                flashKeys.has(key) && 'plan-flash',
                                            )}
                                        >
                                            {code}
                                            {dirty && (
                                                <span
                                                    aria-hidden
                                                    className="absolute top-0.5 right-0.5 size-1.5 rounded-full bg-sky-600 dark:bg-sky-400"
                                                />
                                            )}
                                            {flag && (
                                                <span
                                                    aria-hidden
                                                    className={cn(
                                                        'absolute top-0 left-0 border-t-[7px] border-r-[7px] border-r-transparent',
                                                        flag === 'crit' ? 'border-t-red-600' : 'border-t-amber-500',
                                                    )}
                                                />
                                            )}
                                        </td>
                                    );
                                })}
                                <td
                                    className={cn(
                                        'sticky right-9 z-10 w-14 min-w-14 border-b border-l border-slate-300 bg-white px-2 text-right font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200',
                                        hs === 'hi' && 'text-red-700 dark:text-red-300',
                                        hs === 'lo' && 'text-amber-700 dark:text-amber-300',
                                    )}
                                >
                                    {hoursByEmployee[emp.id] ?? 0} h
                                </td>
                                <td className="sticky right-0 z-10 w-9 min-w-9 border-b border-slate-200 bg-white text-center dark:border-slate-700 dark:bg-slate-900">
                                    {p && (
                                        <span
                                            className={cn(
                                                'inline-grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[11px] font-bold',
                                                p.crit
                                                    ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                                                    : p.warn
                                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                                                      : 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300',
                                            )}
                                        >
                                            {p.crit + p.warn + p.info}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                <tfoot>
                    {footer.map((row, k) => {
                        const bottom = (footer.length - 1 - k) * ROW_H;
                        const rule = row.code ? minCoverage[row.code] : undefined;
                        const footCell = 'sticky z-20 bg-slate-50 dark:bg-slate-800';
                        return (
                            <tr key={row.key}>
                                <th
                                    scope="row"
                                    style={{ bottom }}
                                    className={cn(
                                        nameCol,
                                        footCell,
                                        'z-30 h-7 text-[12px] font-semibold text-slate-700 dark:text-slate-200',
                                        k === 0 && 'border-t border-t-slate-300 dark:border-t-slate-600',
                                    )}
                                >
                                    {row.code ? (
                                        <button
                                            type="button"
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={() => props.onEditMinimum(row.code!)}
                                            className="group flex w-full items-center gap-1.5 text-left hover:text-sky-700 dark:hover:text-sky-300"
                                            title="Definir el mínimo de personas para este turno"
                                        >
                                            <span className="truncate">{row.label}</span>
                                            <span className="shrink-0 text-[11px] font-medium text-slate-500">
                                                {rule?.min ? `· mín. ${rule.min}${rule.weekdays_only ? ' L-V' : ''}` : '· sin mínimo'}
                                            </span>
                                            <Pencil className="size-3 shrink-0 opacity-0 group-hover:opacity-100" />
                                        </button>
                                    ) : (
                                        row.label
                                    )}
                                </th>
                                {days.map((d) => {
                                    const n = row.fn(d);
                                    const low = row.code ? lowCoverage.has(`${row.code}|${d}`) : false;
                                    return (
                                        <td
                                            key={d}
                                            style={{ bottom }}
                                            className={cn(
                                                footCell,
                                                'h-7 border-r border-slate-200 text-center text-[12px] font-semibold dark:border-slate-700',
                                                n ? 'text-slate-800 dark:text-slate-100' : 'font-normal text-slate-400',
                                                low && 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
                                                weekday(d) === 1 && 'border-l-2 border-l-slate-300 dark:border-l-slate-600',
                                                k === 0 && 'border-t border-t-slate-300 dark:border-t-slate-600',
                                            )}
                                        >
                                            {n || '·'}
                                        </td>
                                    );
                                })}
                                <td
                                    style={{ bottom }}
                                    className={cn(
                                        footCell,
                                        'right-9 z-30 border-l border-slate-300 dark:border-slate-600',
                                        k === 0 && 'border-t border-t-slate-300',
                                    )}
                                />
                                <td style={{ bottom }} className={cn(footCell, 'right-0 z-30', k === 0 && 'border-t border-t-slate-300')} />
                            </tr>
                        );
                    })}
                </tfoot>
            </table>
        </div>
    );
}
