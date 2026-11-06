import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSidebar } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/layouts/app-layout';
import {
    type CellMap,
    MONTHS,
    type MinRule,
    type PlanAlert,
    type PlanEmployee,
    type PlanningRules,
    type ShiftType,
    dateRange,
    evaluatePlan,
    monthHours,
    scheduleLabel,
    shiftColor,
    shiftMonth,
} from '@/lib/planning';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    BookOpen,
    CalendarRange,
    ChevronLeft,
    ChevronRight,
    Loader2,
    PanelRightClose,
    PanelRightOpen,
    Send,
    Trash2,
    Undo2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertsPanel } from './components/alerts-panel';
import { type CellChange, type Selection, SheetGrid } from './components/sheet-grid';

interface SheetProps {
    rol: { id: number; name: string; color: string | null };
    month: string;
    monthLabel: string;
    range: { from: string; to: string; contextFrom: string; contextTo: string };
    employees: PlanEmployee[];
    published: CellMap;
    drafts: CellMap;
    draftCount: number;
    lastPublication: { at: string; by: string | null; changes: number } | null;
    shiftTypes: ShiftType[];
    minCoverage: Record<string, MinRule>;
    holidays: Record<string, string>;
    rules: Omit<PlanningRules, 'mode'>;
    whatsappRecipients: Array<{ id: number; name: string; role: string | null }>;
    canManageCatalog: boolean;
}

type UndoEntry = Array<CellChange & { prev: string }>;
const RULES_KEY = 'planilla.reglas';
const keyOf = (employeeId: number, date: string) => `${employeeId}|${date}`;

function buildCells(published: CellMap, drafts: CellMap): CellMap {
    const out: CellMap = {};
    Object.entries(published).forEach(([id, row]) => {
        out[Number(id)] = { ...row };
    });
    Object.entries(drafts).forEach(([id, row]) => {
        out[Number(id)] = { ...(out[Number(id)] ?? {}), ...row };
    });
    return out;
}

/** Pliega el menú lateral mientras se usa la planilla (para que quepa el mes completo) y lo restaura al salir. */
function CollapseSidebarWhileMounted() {
    const { open, setOpen, isMobile } = useSidebar();
    const restore = useRef<boolean | null>(null);
    useEffect(() => {
        if (isMobile || restore.current !== null) return;
        restore.current = open;
        if (open) setOpen(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(
        () => () => {
            if (restore.current) setOpen(true);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );
    return null;
}

function csrfHeaders(): HeadersInit {
    const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    return { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': token, 'X-Requested-With': 'XMLHttpRequest' };
}

function todayString(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function PlanningSheet(props: SheetProps) {
    const { rol, month, monthLabel, range, employees, published, shiftTypes, holidays, whatsappRecipients, canManageCatalog } = props;

    const types = useMemo(() => Object.fromEntries(shiftTypes.map((t) => [t.code, t])), [shiftTypes]);
    const monthDays = useMemo(() => dateRange(range.from, range.to), [range.from, range.to]);
    const contextDays = useMemo(() => dateRange(range.contextFrom, range.contextTo), [range.contextFrom, range.contextTo]);

    /* ── Celdas: lo publicado + el borrador ── */
    const [cells, setCells] = useState<CellMap>(() => buildCells(published, props.drafts));
    const cellsRef = useRef(cells);
    const undoRef = useRef<UndoEntry[]>([]);
    const [undoCount, setUndoCount] = useState(0);
    useEffect(() => {
        const fresh = buildCells(published, props.drafts);
        cellsRef.current = fresh;
        setCells(fresh);
        undoRef.current = [];
        setUndoCount(0);
    }, [published, props.drafts]);

    /* ── Reglas (por navegador) y mínimos (por facción) ── */
    const [rules, setRules] = useState<PlanningRules>(() => {
        const base: PlanningRules = { ...props.rules, mode: 'week' };
        try {
            const saved = JSON.parse(localStorage.getItem(RULES_KEY) ?? 'null');
            return saved ? { ...base, ...saved } : base;
        } catch {
            return base;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(RULES_KEY, JSON.stringify(rules));
        } catch {
            /* el navegador no permite guardar: se usan las reglas por defecto */
        }
    }, [rules]);
    const [minCoverage, setMinCoverage] = useState<Record<string, MinRule>>(props.minCoverage);
    useEffect(() => setMinCoverage(props.minCoverage), [props.minCoverage]);

    /* ── Guardado automático del borrador ── */
    const pending = useRef(new Map<string, CellChange>());
    const timer = useRef<number | null>(null);
    const inflight = useRef<Promise<boolean> | null>(null);
    const [saveState, setSaveState] = useState<{ state: 'idle' | 'saving' | 'saved' | 'error'; at?: Date }>({ state: 'idle' });

    const flush = useCallback(async (): Promise<boolean> => {
        if (timer.current) {
            window.clearTimeout(timer.current);
            timer.current = null;
        }
        if (inflight.current) await inflight.current;
        if (!pending.current.size) return true;
        const batch = [...pending.current.values()];
        pending.current.clear();
        setSaveState({ state: 'saving' });

        const run = (async () => {
            try {
                const res = await fetch(`/planificacion/${rol.id}/borrador`, {
                    method: 'PUT',
                    credentials: 'same-origin',
                    headers: csrfHeaders(),
                    body: JSON.stringify({ mes: month, changes: batch.map((c) => ({ employee_id: c.employeeId, date: c.date, shift: c.code })) }),
                });
                if (!res.ok) {
                    const body = await res.json().catch(() => null);
                    const msg =
                        res.status === 419
                            ? 'Tu sesión expiró. Recarga la página para seguir guardando.'
                            : (body?.message ?? 'No se pudo guardar el borrador.');
                    throw new Error(msg);
                }
                setSaveState({ state: 'saved', at: new Date() });
                return true;
            } catch (err) {
                batch.forEach((c) => {
                    const k = keyOf(c.employeeId, c.date);
                    if (!pending.current.has(k)) pending.current.set(k, c);
                });
                setSaveState({ state: 'error' });
                toast.error((err as Error).message);
                return false;
            }
        })();
        inflight.current = run;
        const ok = await run;
        inflight.current = null;
        return ok;
    }, [rol.id, month]);

    const schedule = useCallback(() => {
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => void flush(), 800);
    }, [flush]);

    useEffect(() => {
        const warn = (e: BeforeUnloadEvent) => {
            if (pending.current.size || inflight.current) e.preventDefault();
        };
        window.addEventListener('beforeunload', warn);
        const off = router.on('before', (event) => {
            const visit = event.detail.visit;
            if (!pending.current.size || visit.method !== 'get') return;
            event.preventDefault();
            void flush().then((ok) => ok && router.visit(visit.url.toString()));
        });
        return () => {
            window.removeEventListener('beforeunload', warn);
            off();
        };
    }, [flush]);

    /* ── Edición ── */
    const apply = useCallback(
        (changes: CellChange[], opts?: { merge?: boolean }) => {
            const prev = cellsRef.current;
            const next: CellMap = { ...prev };
            const copied = new Set<number>();
            const entry: UndoEntry = [];
            changes.forEach((ch) => {
                const old = prev[ch.employeeId]?.[ch.date] ?? '';
                if (old === ch.code) return;
                if (!copied.has(ch.employeeId)) {
                    next[ch.employeeId] = { ...(prev[ch.employeeId] ?? {}) };
                    copied.add(ch.employeeId);
                }
                next[ch.employeeId][ch.date] = ch.code;
                entry.push({ ...ch, prev: old });
                pending.current.set(keyOf(ch.employeeId, ch.date), ch);
            });
            if (!entry.length) return;
            cellsRef.current = next;
            setCells(next);
            const stack = undoRef.current;
            if (opts?.merge && stack.length) {
                const last = stack[stack.length - 1];
                const seen = new Set(last.map((x) => keyOf(x.employeeId, x.date)));
                const merged = last.map((x) => {
                    const upd = entry.find((y) => y.employeeId === x.employeeId && y.date === x.date);
                    return upd ? { ...x, code: upd.code } : x;
                });
                undoRef.current = [...stack.slice(0, -1), [...merged, ...entry.filter((y) => !seen.has(keyOf(y.employeeId, y.date)))]];
            } else {
                undoRef.current = [...stack.slice(-199), entry];
            }
            setUndoCount(undoRef.current.length);
            schedule();
        },
        [schedule],
    );

    const undo = useCallback(() => {
        const last = undoRef.current[undoRef.current.length - 1];
        if (!last) {
            toast('No hay cambios para deshacer');
            return;
        }
        undoRef.current = undoRef.current.slice(0, -1);
        setUndoCount(undoRef.current.length);
        const next: CellMap = { ...cellsRef.current };
        last.forEach((x) => {
            next[x.employeeId] = { ...(next[x.employeeId] ?? {}), [x.date]: x.prev };
            pending.current.set(keyOf(x.employeeId, x.date), { employeeId: x.employeeId, date: x.date, code: x.prev });
        });
        cellsRef.current = next;
        setCells(next);
        schedule();
    }, [schedule]);

    /* ── Selección, alertas y derivados ── */
    const [selection, setSelection] = useState<Selection>({ anchor: { r: 0, c: 0 }, focus: { r: 0, c: 0 } });
    const [flashKeys, setFlashKeys] = useState<Set<string>>(new Set());
    const [showAlerts, setShowAlerts] = useState(true);

    const alerts = useMemo(
        () => evaluatePlan({ employees, cells, monthDays, contextDays, types, rules, minCoverage, holidays }),
        [employees, cells, monthDays, contextDays, types, rules, minCoverage, holidays],
    );
    const critCount = alerts.filter((a) => a.sev === 'crit').length;

    const hoursByEmployee = useMemo(
        () => Object.fromEntries(employees.map((e) => [e.id, monthHours(cells, e.id, monthDays, types)])),
        [employees, cells, monthDays, types],
    );

    const { dirty, dirtyPeople, publishedInMonth } = useMemo(() => {
        let n = 0;
        let any = false;
        const people = new Set<number>();
        employees.forEach((e) =>
            monthDays.forEach((d) => {
                const pub = published[e.id]?.[d] ?? '';
                if (pub) any = true;
                if ((cells[e.id]?.[d] ?? '') !== pub) {
                    n++;
                    people.add(e.id);
                }
            }),
        );
        return { dirty: n, dirtyPeople: people.size, publishedInMonth: any };
    }, [employees, monthDays, cells, published]);

    const footerRows = useMemo(() => {
        const used = new Set<string>(Object.keys(minCoverage));
        employees.forEach((e) =>
            monthDays.forEach((d) => {
                const t = types[cells[e.id]?.[d] ?? ''];
                if (t?.category === 'work') used.add(t.base_code || t.code);
            }),
        );
        return shiftTypes.filter((t) => used.has(t.code) && !t.is_extra).map((t) => ({ code: t.code, label: t.name }));
    }, [minCoverage, employees, monthDays, types, cells, shiftTypes]);

    const selectAlert = (a: PlanAlert) => {
        const rowIdx = new Map(employees.map((e, i) => [e.id, i]));
        const colIdx = new Map(monthDays.map((d, i) => [d, i]));
        const pos = a.cells.map(([e, d]) => [rowIdx.get(e), colIdx.get(d)]).filter((p): p is [number, number] => p[0] != null && p[1] != null);
        if (!pos.length) return;
        const rs = pos.map((p) => p[0]);
        const cs = pos.map((p) => p[1]);
        setSelection({ anchor: { r: Math.min(...rs), c: Math.min(...cs) }, focus: { r: Math.max(...rs), c: Math.max(...cs) } });
        setFlashKeys(new Set(a.cells.map(([e, d]) => keyOf(e, d))));
        window.setTimeout(() => setFlashKeys(new Set()), 1900);
        const grid = document.getElementById('planilla-grid');
        grid?.focus({ preventScroll: true });
        requestAnimationFrame(() =>
            grid
                ?.querySelector<HTMLElement>(`td[data-r="${Math.min(...rs)}"][data-c="${Math.min(...cs)}"]`)
                ?.scrollIntoView({ block: 'center', inline: 'center' }),
        );
    };

    /* ── Navegación de mes ── */
    const goToMonth = async (mes: string) => {
        if (!/^\d{4}-\d{2}$/.test(mes)) return;
        if (!(await flush())) return;
        router.get(`/planificacion/${rol.id}`, { mes });
    };

    /* ── Publicar y descartar ── */
    const [publishOpen, setPublishOpen] = useState(false);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [notifyEmployees, setNotifyEmployees] = useState(true);
    const [copyTo, setCopyTo] = useState<number[]>([]);
    const [busy, setBusy] = useState(false);
    // Resumen fijado al abrir el diálogo, para que no cambie mientras se cierra tras publicar.
    const [summary, setSummary] = useState({ changes: 0, people: 0, first: false });

    const openPublish = async () => {
        if (!(await flush())) return;
        if (!dirty) {
            toast('No hay cambios sin publicar en este mes');
            return;
        }
        setSummary({ changes: dirty, people: dirtyPeople, first: !publishedInMonth && !props.lastPublication });
        setPublishOpen(true);
    };
    const publish = () => {
        setBusy(true);
        router.post(
            `/planificacion/${rol.id}/publicar`,
            { mes: month, notify_employees: notifyEmployees, recipients: copyTo },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setPublishOpen(false);
                    setSaveState({ state: 'idle' });
                    toast.success(
                        `Planilla publicada: ${summary.changes} cambio${summary.changes === 1 ? '' : 's'} para ${summary.people} persona${summary.people === 1 ? '' : 's'}`,
                    );
                },
                onError: () => toast.error('No se pudo publicar. Revisa tu conexión e inténtalo de nuevo.'),
                onFinish: () => setBusy(false),
            },
        );
    };
    const discard = async () => {
        await flush();
        setBusy(true);
        router.delete(`/planificacion/${rol.id}/borrador`, {
            data: { mes: month },
            preserveScroll: true,
            onSuccess: () => {
                setDiscardOpen(false);
                toast.success('Borrador descartado. La planilla volvió a lo publicado.');
            },
            onFinish: () => setBusy(false),
        });
    };

    /* ── Mínimos de cobertura ── */
    const [minEdit, setMinEdit] = useState<{ code: string; min: string; weekdays: boolean } | null>(null);
    const saveMinimum = async () => {
        if (!minEdit) return;
        const value = parseInt(minEdit.min || '0', 10);
        if (Number.isNaN(value) || value < 0 || value > 99) {
            toast.error('Ingresa un número entre 0 y 99.');
            return;
        }
        const next = { ...minCoverage, [minEdit.code]: { min: value, weekdays_only: minEdit.weekdays } };
        try {
            const res = await fetch(`/planificacion/${rol.id}/minimos`, {
                method: 'PUT',
                credentials: 'same-origin',
                headers: csrfHeaders(),
                body: JSON.stringify({ minimums: next }),
            });
            if (!res.ok) throw new Error();
            const body = await res.json();
            setMinCoverage(body.minCoverage ?? {});
            setMinEdit(null);
            toast.success('Mínimo actualizado');
        } catch {
            toast.error('No se pudo guardar el mínimo.');
        }
    };

    /* ── Vista ── */
    const today = todayString();
    const [year, monthNum] = month.split('-').map(Number);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Turnos', href: '/turnos' },
        { title: `Planilla ${rol.name}`, href: `/planificacion/${rol.id}?mes=${month}`, icon: CalendarRange },
    ];
    const palette = shiftTypes;
    const q = {
        r0: Math.min(selection.anchor.r, selection.focus.r),
        r1: Math.max(selection.anchor.r, selection.focus.r),
        c0: Math.min(selection.anchor.c, selection.focus.c),
        c1: Math.max(selection.anchor.c, selection.focus.c),
    };
    const selCount = (q.r1 - q.r0 + 1) * (q.c1 - q.c0 + 1);

    const status = dirty
        ? { tone: 'bg-amber-100 text-amber-800 ring-amber-200', text: `En elaboración · ${dirty} cambio${dirty === 1 ? '' : 's'} sin publicar` }
        : props.lastPublication
          ? {
                tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
                text: `Publicado el ${new Date(props.lastPublication.at).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}${props.lastPublication.by ? ` por ${props.lastPublication.by}` : ''}`,
            }
          : publishedInMonth
            ? { tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200', text: 'Publicado' }
            : { tone: 'bg-slate-100 text-slate-700 ring-slate-200', text: 'Sin turnos cargados' };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Planilla ${rol.name} · ${monthLabel}`} />
            <Toaster position="bottom-right" richColors />
            <CollapseSidebarWhileMounted />

            <div className="flex flex-col gap-3 bg-slate-50 p-3 sm:p-4 lg:h-[calc(100svh-4rem)] dark:bg-slate-950">
                {/* Encabezado */}
                <header className="flex flex-wrap items-center gap-x-5 gap-y-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Planificación de turnos</p>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{rol.name}</h1>
                    </div>

                    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => goToMonth(shiftMonth(month, -1))}
                            aria-label="Mes anterior"
                        >
                            <ChevronLeft />
                        </Button>
                        <label className="sr-only" htmlFor="plan-month">
                            Mes
                        </label>
                        <input
                            id="plan-month"
                            type="month"
                            value={month}
                            onChange={(e) => goToMonth(e.target.value)}
                            className="h-8 rounded-md px-2 text-sm font-semibold text-slate-800 capitalize focus:ring-2 focus:ring-sky-600/30 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
                            aria-describedby="plan-month-label"
                        />
                        <span id="plan-month-label" className="sr-only">
                            {MONTHS[monthNum - 1]} {year}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => goToMonth(shiftMonth(month, 1))}
                            aria-label="Mes siguiente"
                        >
                            <ChevronRight />
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={cn(
                                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12.5px] font-semibold ring-1 ring-inset',
                                status.tone,
                            )}
                        >
                            <span className="size-1.5 rounded-full bg-current" />
                            {status.text}
                        </span>
                        <span className="text-xs text-slate-500" aria-live="polite">
                            {saveState.state === 'saving' && (
                                <span className="inline-flex items-center gap-1">
                                    <Loader2 className="size-3 animate-spin" /> Guardando borrador…
                                </span>
                            )}
                            {saveState.state === 'saved' &&
                                saveState.at &&
                                `Borrador guardado ${saveState.at.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}`}
                            {saveState.state === 'error' && (
                                <button type="button" className="font-semibold text-red-700 underline" onClick={() => void flush()}>
                                    No se pudo guardar · Reintentar
                                </button>
                            )}
                        </span>
                    </div>

                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        {canManageCatalog && (
                            <Button asChild variant="ghost" size="sm">
                                <Link href="/planificacion/turnos">
                                    <BookOpen /> Catálogo de turnos
                                </Link>
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={undo} disabled={!undoCount}>
                            <Undo2 /> Deshacer
                        </Button>
                        {dirty > 0 && (
                            <Button variant="outline" size="sm" onClick={() => setDiscardOpen(true)}>
                                <Trash2 /> Descartar borrador
                            </Button>
                        )}
                        <Button size="sm" onClick={openPublish} className="bg-sky-700 text-white hover:bg-sky-800">
                            <Send /> Publicar
                        </Button>
                    </div>
                </header>

                {/* Paleta y ayuda */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex flex-wrap gap-1" aria-label="Turnos del catálogo">
                        {palette.map((t) => (
                            <button
                                key={t.code}
                                type="button"
                                title={`${t.code} · ${t.name}${scheduleLabel(t) ? ` · ${scheduleLabel(t)}` : ''}`}
                                onClick={() => {
                                    const changes: CellChange[] = [];
                                    for (let r = q.r0; r <= q.r1; r++)
                                        for (let c = q.c0; c <= q.c1; c++)
                                            changes.push({ employeeId: employees[r].id, date: monthDays[c], code: t.code });
                                    if (employees.length) apply(changes);
                                    document.getElementById('planilla-grid')?.focus({ preventScroll: true });
                                }}
                                className={cn(
                                    'h-7 min-w-9 rounded-md border border-black/5 px-1.5 font-mono text-xs font-semibold transition hover:-translate-y-px hover:shadow-sm',
                                    t.category === 'off' ? 'bg-white text-slate-500 dark:bg-slate-900' : shiftColor(t),
                                )}
                            >
                                {t.code}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500">
                        Escribe el código sobre la celda (<b className="font-mono text-slate-700">MTTNNFLL</b> llena la fila), arrastra para
                        seleccionar, <kbd className="rounded border border-slate-300 bg-white px-1 font-mono text-[10px]">Supr</kbd> borra y{' '}
                        <kbd className="rounded border border-slate-300 bg-white px-1 font-mono text-[10px]">Ctrl</kbd>+
                        <kbd className="rounded border border-slate-300 bg-white px-1 font-mono text-[10px]">V</kbd> pega desde Excel.
                    </p>
                    <div className="ml-auto flex items-center gap-3">
                        <span className="text-xs text-slate-500 tabular-nums">
                            {selCount} celda{selCount === 1 ? '' : 's'} seleccionada{selCount === 1 ? '' : 's'}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => setShowAlerts((v) => !v)} className="hidden lg:inline-flex">
                            {showAlerts ? <PanelRightClose /> : <PanelRightOpen />}
                            {showAlerts ? 'Ocultar alertas' : `Ver alertas (${alerts.length})`}
                        </Button>
                    </div>
                </div>

                {/* Planilla + alertas */}
                <div className={cn('grid min-h-0 flex-1 gap-3', showAlerts ? 'lg:grid-cols-[minmax(0,1fr)_280px]' : 'lg:grid-cols-1')}>
                    {employees.length === 0 ? (
                        <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
                            Esta facción no tiene funcionarios activos. Agrégalos desde Datos de Plataforma.
                        </div>
                    ) : (
                        <div className="max-h-[70vh] min-h-0 lg:max-h-none">
                            <SheetGrid
                                employees={employees}
                                days={monthDays}
                                cells={cells}
                                published={published}
                                types={types}
                                holidays={holidays}
                                alerts={alerts}
                                selection={selection}
                                onSelectionChange={setSelection}
                                onApply={apply}
                                onUndo={undo}
                                onNotify={(m, kind) => (kind === 'warn' ? toast.warning(m) : toast(m))}
                                footerRows={footerRows}
                                minCoverage={minCoverage}
                                onEditMinimum={(code) =>
                                    setMinEdit({
                                        code,
                                        min: String(minCoverage[code]?.min ?? ''),
                                        weekdays: minCoverage[code]?.weekdays_only ?? false,
                                    })
                                }
                                hoursByEmployee={hoursByEmployee}
                                flashKeys={flashKeys}
                                today={today}
                            />
                        </div>
                    )}
                    {showAlerts && <AlertsPanel alerts={alerts} rules={rules} onRulesChange={setRules} onSelectAlert={selectAlert} />}
                </div>
            </div>

            {/* Publicar */}
            <Dialog open={publishOpen} onOpenChange={(o) => !busy && setPublishOpen(o)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Publicar {monthLabel}</DialogTitle>
                        <DialogDescription>
                            {summary.first
                                ? `Vas a publicar la planilla de ${rol.name} para ${summary.people} funcionario${summary.people === 1 ? '' : 's'}.`
                                : `Vas a publicar ${summary.changes} cambio${summary.changes === 1 ? '' : 's'} que afectan a ${summary.people} persona${summary.people === 1 ? '' : 's'} de ${rol.name}.`}{' '}
                            Desde ese momento la verán en "Mi Calendario".
                        </DialogDescription>
                    </DialogHeader>

                    {critCount > 0 && (
                        <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                            <p>
                                Quedan <b>{critCount} alertas críticas</b> (cobertura, descanso o jornada). Puedes publicar igual, pero conviene
                                revisarlas.{' '}
                                <button type="button" className="font-semibold underline" onClick={() => setPublishOpen(false)}>
                                    Revisar alertas
                                </button>
                            </p>
                        </div>
                    )}

                    <div className="space-y-3 text-sm">
                        <label className="flex items-start gap-3">
                            <Checkbox checked={notifyEmployees} onCheckedChange={(v) => setNotifyEmployees(v === true)} className="mt-0.5" />
                            <span>
                                <span className="font-medium text-slate-800 dark:text-slate-100">
                                    Avisar por WhatsApp a cada funcionario afectado
                                </span>
                                <span className="block text-xs text-slate-500">Cada persona recibe un solo mensaje con todos sus cambios.</span>
                            </span>
                        </label>
                        {whatsappRecipients.length > 0 && (
                            <div>
                                <p className="mb-1.5 text-xs font-semibold text-slate-500">Enviar una copia a</p>
                                <div className="grid max-h-40 grid-cols-1 gap-1.5 overflow-auto sm:grid-cols-2">
                                    {whatsappRecipients.map((r) => (
                                        <label key={r.id} className="flex items-center gap-2 text-[13px]">
                                            <Checkbox
                                                checked={copyTo.includes(r.id)}
                                                onCheckedChange={(v) =>
                                                    setCopyTo((prev) => (v === true ? [...prev, r.id] : prev.filter((x) => x !== r.id)))
                                                }
                                            />
                                            <span className="truncate">
                                                {r.name}
                                                {r.role ? <span className="text-slate-500"> · {r.role}</span> : null}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPublishOpen(false)} disabled={busy}>
                            Cancelar
                        </Button>
                        <Button onClick={publish} disabled={busy} className="bg-sky-700 text-white hover:bg-sky-800">
                            {busy ? <Loader2 className="animate-spin" /> : <Send />} Publicar ahora
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Descartar */}
            <Dialog open={discardOpen} onOpenChange={(o) => !busy && setDiscardOpen(o)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Descartar el borrador</DialogTitle>
                        <DialogDescription>
                            Se borran los {dirty} cambios sin publicar de {monthLabel} y la planilla vuelve a lo que ya estaba publicado. Esto no se
                            puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDiscardOpen(false)} disabled={busy}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={discard} disabled={busy}>
                            Descartar cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Mínimo de cobertura */}
            <Dialog open={minEdit !== null} onOpenChange={(o) => !o && setMinEdit(null)}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Mínimo de personas · {minEdit ? (types[minEdit.code]?.name ?? minEdit.code) : ''}</DialogTitle>
                        <DialogDescription>
                            Si un día queda bajo este número, aparece una alerta crítica. Usa 0 para no exigir mínimo.
                        </DialogDescription>
                    </DialogHeader>
                    {minEdit && (
                        <div className="space-y-3">
                            <label htmlFor="min-value" className="flex flex-col gap-1 text-sm font-medium">
                                Personas como mínimo
                                <input
                                    id="min-value"
                                    type="number"
                                    min={0}
                                    max={99}
                                    value={minEdit.min}
                                    onChange={(e) => setMinEdit({ ...minEdit, min: e.target.value })}
                                    className="h-9 rounded-md border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-sky-600/30 focus:outline-none dark:border-slate-600 dark:bg-slate-900"
                                />
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox checked={minEdit.weekdays} onCheckedChange={(v) => setMinEdit({ ...minEdit, weekdays: v === true })} />
                                Solo de lunes a viernes (sin feriados)
                            </label>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMinEdit(null)}>
                            Cancelar
                        </Button>
                        <Button onClick={saveMinimum} className="bg-sky-700 text-white hover:bg-sky-800">
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
