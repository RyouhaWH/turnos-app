import { ALERT_GROUPS, type AlertType, type PlanAlert, type PlanningRules } from '@/lib/planning';
import { cn } from '@/lib/utils';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface AlertsPanelProps {
    alerts: PlanAlert[];
    rules: PlanningRules;
    onRulesChange: (rules: PlanningRules) => void;
    onSelectAlert: (alert: PlanAlert) => void;
}

const sevDot = { crit: 'bg-red-600', warn: 'bg-amber-500', info: 'bg-sky-600' } as const;

export function AlertsPanel({ alerts, rules, onRulesChange, onSelectAlert }: AlertsPanelProps) {
    const [closed, setClosed] = useState<Set<AlertType>>(new Set(['empty']));
    const counts = { crit: 0, warn: 0, info: 0 };
    alerts.forEach((a) => counts[a.sev]++);

    const toggle = (t: AlertType) =>
        setClosed((prev) => {
            const next = new Set(prev);
            if (next.has(t)) next.delete(t);
            else next.add(t);
            return next;
        });

    const numberField = (id: keyof PlanningRules, label: string, min: number, max: number) => (
        <label htmlFor={`rule-${id}`} className="flex flex-col gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {label}
            <input
                id={`rule-${id}`}
                type="number"
                min={min}
                max={max}
                step={1}
                value={rules[id] as number}
                onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!Number.isNaN(v)) onRulesChange({ ...rules, [id]: v });
                }}
                className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-[13px] font-medium text-slate-800 focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
        </label>
    );

    return (
        <aside
            aria-label="Alertas de la planilla"
            className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
        >
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-center justify-between">
                    <h2 className="text-[15px] font-bold text-slate-900 dark:text-white">Alertas</h2>
                    <span className="text-xs text-slate-500">{alerts.length} en total</span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11.5px] font-bold">
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700 dark:bg-red-500/20 dark:text-red-300">
                        {counts.crit} críticas
                    </span>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                        {counts.warn} avisos
                    </span>
                    <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300">
                        {counts.info} informativas
                    </span>
                </div>
                <details className="group rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                    <summary className="flex cursor-pointer list-none items-center justify-between text-[12px] font-semibold text-slate-600 dark:text-slate-300 [&::-webkit-details-marker]:hidden">
                        Reglas: {rules.weekly_target} h objetivo · {rules.weekly_max} h máx. · {rules.min_rest_hours} h descanso
                        <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                        {numberField('weekly_target', 'Objetivo semanal (h)', 0, 80)}
                        {numberField('weekly_max', 'Máximo semanal (h)', 0, 80)}
                        {numberField('min_rest_hours', 'Descanso mínimo (h)', 0, 24)}
                        {numberField('max_consecutive_days', 'Días seguidos máx.', 1, 14)}
                        <label
                            htmlFor="rule-mode"
                            className="col-span-2 flex flex-col gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400"
                        >
                            Calcular horas por
                            <select
                                id="rule-mode"
                                value={rules.mode}
                                onChange={(e) => onRulesChange({ ...rules, mode: e.target.value as PlanningRules['mode'] })}
                                className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2 text-[13px] font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            >
                                <option value="week">Semana completa (lunes a domingo)</option>
                                <option value="avg">Promedio del mes</option>
                            </select>
                        </label>
                        <p className="col-span-2 text-[11px] leading-snug text-slate-500">
                            Vacaciones, licencias, administrativos y feriados de lunes a viernes suman al objetivo. Estas reglas se guardan solo en
                            este navegador.
                        </p>
                    </div>
                </details>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-2 pt-1 pb-3">
                {alerts.length === 0 ? (
                    <p className="flex items-start gap-2 px-2 py-5 text-[13px] font-semibold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                        Sin alertas. La planilla está lista para publicar.
                    </p>
                ) : (
                    ALERT_GROUPS.map((g) => {
                        const items = alerts.filter((a) => a.type === g.type);
                        if (!items.length) return null;
                        const isOpen = !closed.has(g.type);
                        return (
                            <section key={g.type} className="border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => toggle(g.type)}
                                    aria-expanded={isOpen}
                                    className="flex w-full items-center gap-2 px-2 py-2.5 text-left text-[13px] font-semibold text-slate-800 dark:text-slate-100"
                                >
                                    <span className={cn('size-2 shrink-0 rounded-full', sevDot[items[0].sev])} />
                                    {g.label}
                                    <span className="ml-auto text-xs font-medium text-slate-500 tabular-nums">{items.length}</span>
                                    <ChevronDown className={cn('size-4 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
                                </button>
                                {isOpen && (
                                    <ul className="pb-1.5">
                                        {items.map((a) => (
                                            <li key={a.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => onSelectAlert(a)}
                                                    className="flex w-full flex-col gap-0.5 rounded-md py-1.5 pr-2 pl-6 text-left text-[12.5px] leading-snug hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-sky-600/40 focus-visible:outline-none dark:hover:bg-slate-800"
                                                >
                                                    <span className="font-semibold text-slate-800 dark:text-slate-100">{a.who}</span>
                                                    <span className="text-slate-500 dark:text-slate-400">{a.text}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        );
                    })
                )}
            </div>
        </aside>
    );
}
