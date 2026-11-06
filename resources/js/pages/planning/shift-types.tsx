import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/layouts/app-layout';
import { SHIFT_COLOR_CLASSES, type Category } from '@/lib/planning';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { BookOpen, Plus, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ShiftTypeRow {
    id: number;
    code: string;
    name: string;
    category: Category;
    starts_at: string | null;
    ends_at: string | null;
    hours: number;
    base_code: string | null;
    is_extra: boolean;
    color: string;
    is_active: boolean;
}

interface Props {
    shiftTypes: ShiftTypeRow[];
    categories: Category[];
    colors: string[];
}

const CATEGORY_LABEL: Record<Category, string> = { work: 'Trabajo', off: 'Libre', absence: 'Ausencia justificada' };
const input =
    'h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[13px] focus:border-sky-600 focus:ring-2 focus:ring-sky-600/20 focus:outline-none dark:border-slate-700 dark:bg-slate-900';

type Draft = Omit<ShiftTypeRow, 'id'> & { id?: number };
const empty: Draft = {
    code: '',
    name: '',
    category: 'work',
    starts_at: '',
    ends_at: '',
    hours: 8,
    base_code: '',
    is_extra: false,
    color: 'sky',
    is_active: true,
};

function payload(d: Draft) {
    return {
        ...d,
        starts_at: d.category === 'work' && d.starts_at ? d.starts_at : null,
        ends_at: d.category === 'work' && d.ends_at ? d.ends_at : null,
        base_code: d.base_code || null,
    };
}

function Row({
    value,
    codes,
    colors,
    categories,
    onSave,
    isNew,
}: {
    value: Draft;
    codes: string[];
    colors: string[];
    categories: Category[];
    onSave: (d: Draft) => void;
    isNew?: boolean;
}) {
    const [d, setD] = useState<Draft>(value);
    const changed = JSON.stringify(d) !== JSON.stringify(value);
    const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));
    const work = d.category === 'work';

    return (
        <tr className={cn('border-b border-slate-100 dark:border-slate-800', !d.is_active && 'opacity-60')}>
            <td className="py-1.5 pr-2">
                {isNew ? (
                    <input
                        aria-label="Código"
                        className={cn(input, 'w-16 font-mono uppercase')}
                        value={d.code}
                        maxLength={10}
                        onChange={(e) => set('code', e.target.value.toUpperCase())}
                        placeholder="NE"
                    />
                ) : (
                    <span
                        className={cn(
                            'inline-grid h-7 min-w-10 place-items-center rounded-md px-1.5 font-mono text-xs font-semibold',
                            SHIFT_COLOR_CLASSES[d.color],
                            d.category === 'off' && 'border border-slate-200',
                        )}
                    >
                        {d.code}
                    </span>
                )}
            </td>
            <td className="py-1.5 pr-2">
                <input aria-label="Nombre" className={input} value={d.name} onChange={(e) => set('name', e.target.value)} placeholder="Noche extra" />
            </td>
            <td className="py-1.5 pr-2">
                <select aria-label="Tipo" className={input} value={d.category} onChange={(e) => set('category', e.target.value as Category)}>
                    {categories.map((c) => (
                        <option key={c} value={c}>
                            {CATEGORY_LABEL[c]}
                        </option>
                    ))}
                </select>
            </td>
            <td className="py-1.5 pr-2">
                <input
                    aria-label="Inicio"
                    type="time"
                    className={input}
                    disabled={!work}
                    value={d.starts_at ?? ''}
                    onChange={(e) => set('starts_at', e.target.value)}
                />
            </td>
            <td className="py-1.5 pr-2">
                <input
                    aria-label="Término"
                    type="time"
                    className={input}
                    disabled={!work}
                    value={d.ends_at ?? ''}
                    onChange={(e) => set('ends_at', e.target.value)}
                />
            </td>
            <td className="py-1.5 pr-2">
                <input
                    aria-label="Horas"
                    type="number"
                    min={0}
                    max={24}
                    step={0.5}
                    className={cn(input, 'w-16')}
                    disabled={!work}
                    value={d.hours}
                    onChange={(e) => set('hours', Number(e.target.value))}
                />
            </td>
            <td className="py-1.5 pr-2">
                <select
                    aria-label="Cuenta como"
                    className={input}
                    disabled={!work}
                    value={d.base_code ?? ''}
                    onChange={(e) => set('base_code', e.target.value)}
                >
                    <option value="">Sí mismo</option>
                    {codes
                        .filter((c) => c !== d.code)
                        .map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                </select>
            </td>
            <td className="py-1.5 pr-2 text-center">
                <input
                    aria-label="Es extra"
                    type="checkbox"
                    className="size-4 accent-sky-700"
                    disabled={!work}
                    checked={d.is_extra}
                    onChange={(e) => set('is_extra', e.target.checked)}
                />
            </td>
            <td className="py-1.5 pr-2">
                <select aria-label="Color" className={input} value={d.color} onChange={(e) => set('color', e.target.value)}>
                    {colors.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </td>
            <td className="py-1.5 pr-2 text-center">
                <input
                    aria-label="Activo"
                    type="checkbox"
                    className="size-4 accent-sky-700"
                    checked={d.is_active}
                    onChange={(e) => set('is_active', e.target.checked)}
                />
            </td>
            <td className="py-1.5 text-right">
                <Button
                    size="sm"
                    variant={isNew ? 'default' : 'outline'}
                    disabled={!changed || !d.name || (isNew && !d.code)}
                    onClick={() => onSave(d)}
                >
                    {isNew ? <Plus /> : <Save />} {isNew ? 'Agregar' : 'Guardar'}
                </Button>
            </td>
        </tr>
    );
}

export default function ShiftTypes({ shiftTypes, categories, colors }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Turnos', href: '/turnos' },
        { title: 'Catálogo de turnos', href: '/planificacion/turnos', icon: BookOpen },
    ];
    const codes = shiftTypes.map((t) => t.code);
    const [newKey, setNewKey] = useState(0);

    const onError = (errors: Record<string, string>) => toast.error(Object.values(errors)[0] ?? 'No se pudo guardar.');
    const save = (d: Draft) =>
        router.put(`/planificacion/turnos/${d.id}`, payload(d), {
            preserveScroll: true,
            onSuccess: () => toast.success(`Turno ${d.code} guardado`),
            onError,
        });
    const create = (d: Draft) =>
        router.post('/planificacion/turnos', payload(d), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Turno ${d.code} agregado`);
                setNewKey((k) => k + 1);
            },
            onError,
        });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Catálogo de turnos" />
            <Toaster position="bottom-right" richColors />
            <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 sm:p-6">
                <div>
                    <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Planificación</p>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Catálogo de turnos</h1>
                    <p className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
                        Estos códigos son los únicos que acepta la planilla. Los horarios y horas se usan para calcular las alertas de jornada y
                        descanso: revísalos antes de planificar. Un turno nocturno que termina al día siguiente se escribe con término menor que el
                        inicio (por ejemplo 23:00 a 07:00).
                    </p>
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <table className="w-full min-w-[980px] text-left text-sm">
                        <thead className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="pb-2">Código</th>
                                <th className="pb-2">Nombre</th>
                                <th className="pb-2">Tipo</th>
                                <th className="pb-2">Inicio</th>
                                <th className="pb-2">Término</th>
                                <th className="pb-2">Horas</th>
                                <th className="pb-2" title="Para la cobertura: un extra de noche cuenta como Noche">
                                    Cuenta como
                                </th>
                                <th className="pb-2 text-center">Extra</th>
                                <th className="pb-2">Color</th>
                                <th className="pb-2 text-center">Activo</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {shiftTypes.map((t) => (
                                <Row
                                    key={`${t.id}-${t.code}-${t.name}-${t.starts_at}-${t.ends_at}-${t.hours}-${t.color}-${t.is_active}-${t.category}-${t.base_code}-${t.is_extra}`}
                                    value={t}
                                    codes={codes}
                                    colors={colors}
                                    categories={categories}
                                    onSave={save}
                                />
                            ))}
                            <Row key={`new-${newKey}`} value={empty} codes={codes} colors={colors} categories={categories} onSave={create} isNew />
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}
