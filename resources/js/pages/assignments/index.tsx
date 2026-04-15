import { useState, type CSSProperties } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';

interface Sector  { id: number; name: string; color: string | null }
interface Vehicle { id: number; name: string; type: string }
interface Rol     { id: number; nombre: string }

interface Assignment {
    id: number;
    sector_id: number | null;
    vehicle_id: number | null;
    notes: string | null;
}

interface Employee {
    id: number;
    name: string;
    first_name: string | null;
    paternal_lastname: string | null;
    rol_id: number;
    rol_name: string | null;
    rol_color: string | null;
    shift: string;
    shift_base: string;
    shift_label: string;
    shift_order: number;
    assignment: Assignment | null;
}

interface EditBuffer { sector_id: number | null; vehicle_id: number | null; notes: string }

interface Props {
    date: string;
    employees: Employee[];
    sectors: Sector[];
    vehicles: Vehicle[];
    roles: Rol[];
}

function displayName(emp: Employee): string {
    return [emp.first_name?.split(' ')[0], emp.paternal_lastname]
        .filter(Boolean).join(' ') || emp.name;
}

export default function AssignmentsIndex({ date, employees, sectors, vehicles, roles }: Props) {
    const [selectedDate]  = useState(date);
    const [filterRolId, setFilterRolId] = useState<number | ''>('');
    const [search, setSearch]   = useState('');
    const [edits, setEdits]     = useState<Record<number, EditBuffer>>({});
    const [saving, setSaving]   = useState(false);

    // vehicleVisible: por rol_id. Arranca en true solo si algún empleado
    // del grupo ya tiene vehículo asignado; de lo contrario false.
    const [vehicleVisible, setVehicleVisible] = useState<Record<number, boolean>>(() => {
        const map: Record<number, boolean> = {};
        for (const emp of employees) {
            if (!(emp.rol_id in map)) map[emp.rol_id] = false;
            if (emp.assignment?.vehicle_id) map[emp.rol_id] = true;
        }
        return map;
    });

    function toggleVehicle(rolId: number) {
        setVehicleVisible(prev => ({ ...prev, [rolId]: !prev[rolId] }));
    }

    function goToDate(d: string) {
        router.get('/assignments', { date: d }, { preserveState: false });
    }

    function currentEdit(emp: Employee): EditBuffer {
        return edits[emp.id] ?? {
            sector_id:  emp.assignment?.sector_id  ?? null,
            vehicle_id: emp.assignment?.vehicle_id ?? null,
            notes:      emp.assignment?.notes      ?? '',
        };
    }

    function setField(empId: number, field: keyof EditBuffer, value: number | null | string) {
        const emp = employees.find(e => e.id === empId)!;
        setEdits(prev => ({ ...prev, [empId]: { ...currentEdit(emp), [field]: value } }));
    }

    function saveAll() {
        if (!Object.keys(edits).length) return;
        setSaving(true);
        const assignments = Object.entries(edits).map(([id, data]) => ({
            employee_id: Number(id),
            sector_id:   data.sector_id,
            vehicle_id:  data.vehicle_id,
            notes:       data.notes || null,
        }));
        router.post('/assignments/bulk', { date: selectedDate, assignments }, {
            onFinish: () => { setSaving(false); setEdits({}); },
        });
    }

    const dirtyCount = Object.keys(edits).length;

    // ── Filtros ───────────────────────────────────────────────────────────────
    const needle = search.trim().toLowerCase();
    const visible = employees.filter(e => {
        if (filterRolId && e.rol_id !== Number(filterRolId)) return false;
        if (needle) {
            const full = `${displayName(e)} ${e.name}`.toLowerCase();
            return full.includes(needle);
        }
        return true;
    });

    // ── Agrupar: rol → shift_base → [employees] ───────────────────────────────
    type ShiftGroup = { label: string; order: number; employees: Employee[] };
    type RolGroup   = { rol_id: number; rol_name: string; color: string | null; shifts: Record<string, ShiftGroup> };

    const byRol: Record<number, RolGroup> = {};
    for (const emp of visible) {
        if (!byRol[emp.rol_id]) {
            byRol[emp.rol_id] = { rol_id: emp.rol_id, rol_name: emp.rol_name ?? 'Sin rol', color: emp.rol_color, shifts: {} };
        }
        const base = emp.shift_base;
        if (!byRol[emp.rol_id].shifts[base]) {
            byRol[emp.rol_id].shifts[base] = { label: emp.shift_label.replace(' (Extra)', ''), order: emp.shift_order, employees: [] };
        }
        byRol[emp.rol_id].shifts[base].employees.push(emp);
    }

    const rolGroups = Object.values(byRol).sort((a, b) => a.rol_name.localeCompare(b.rol_name));

    return (
        <AppLayout>
            <Head title="Asignaciones" />
            <div style={{ padding: '1rem', maxWidth: 960 }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '1rem' }}>
                    Asignaciones — Sector y Vehículo
                </h1>

                {/* ── Controles ──────────────────────────────────────────────── */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        Fecha:
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={e => goToDate(e.target.value)}
                            style={inputStyle}
                        />
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        Facción:
                        <select
                            value={filterRolId}
                            onChange={e => setFilterRolId(e.target.value ? Number(e.target.value) : '')}
                            style={inputStyle}
                        >
                            <option value="">Todas</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                        </select>
                    </label>

                    <input
                        type="search"
                        placeholder="Buscar funcionario…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ ...inputStyle, minWidth: 200 }}
                    />

                    <button
                        onClick={saveAll}
                        disabled={dirtyCount === 0 || saving}
                        style={{
                            marginLeft: 'auto',
                            padding: '0.4rem 1.2rem',
                            background: dirtyCount > 0 ? '#2563eb' : '#94a3b8',
                            color: '#fff', border: 'none', borderRadius: 6,
                            cursor: dirtyCount > 0 ? 'pointer' : 'default', fontWeight: 500,
                        }}
                    >
                        {saving ? 'Guardando…' : `Guardar${dirtyCount > 0 ? ` (${dirtyCount})` : ''}`}
                    </button>
                </div>

                {visible.length === 0 && (
                    <p style={{ color: '#64748b', marginTop: '2rem', textAlign: 'center' }}>
                        Sin funcionarios de turno para esta fecha.
                    </p>
                )}

                {/* ── Por facción ────────────────────────────────────────────── */}
                {rolGroups.map(rol => {
                    const shiftGroups  = Object.entries(rol.shifts).sort(([, a], [, b]) => a.order - b.order);
                    const showVehicle  = vehicleVisible[rol.rol_id] ?? false;
                    const totalInRole  = shiftGroups.reduce((s, [, g]) => s + g.employees.length, 0);

                    return (
                        <div key={rol.rol_id} style={{ marginBottom: '2rem' }}>
                            {/* Cabecera de facción */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.6rem',
                                marginBottom: '0.75rem', paddingBottom: '0.4rem',
                                borderBottom: `3px solid ${rol.color ?? '#3b82f6'}`,
                            }}>
                                <span style={{
                                    display: 'inline-block', width: 12, height: 12,
                                    borderRadius: '50%', background: rol.color ?? '#3b82f6', flexShrink: 0,
                                }} />
                                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{rol.rol_name}</span>
                                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                                    ({totalInRole} en servicio)
                                </span>

                                {/* Toggle vehículo */}
                                <button
                                    onClick={() => toggleVehicle(rol.rol_id)}
                                    title={showVehicle ? 'Ocultar columna vehículo' : 'Mostrar columna vehículo'}
                                    style={{
                                        marginLeft: 'auto',
                                        display: 'flex', alignItems: 'center', gap: '0.3rem',
                                        padding: '0.2rem 0.65rem',
                                        fontSize: '0.75rem', fontWeight: 500,
                                        border: `1px solid ${showVehicle ? '#3b82f6' : '#cbd5e1'}`,
                                        borderRadius: 20,
                                        background: showVehicle ? '#eff6ff' : '#f8fafc',
                                        color: showVehicle ? '#2563eb' : '#64748b',
                                        cursor: 'pointer',
                                    }}
                                >
                                    🚗 {showVehicle ? 'Ocultar vehículos' : 'Asignar vehículo'}
                                </button>
                            </div>

                            {/* Por turno */}
                            {shiftGroups.map(([shiftBase, group]) => (
                                <div key={shiftBase} style={{ marginBottom: '1.25rem' }}>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                        marginBottom: '0.4rem', padding: '0.2rem 0.7rem',
                                        background: SHIFT_BG[shiftBase] ?? '#f1f5f9',
                                        color: SHIFT_TEXT[shiftBase] ?? '#1e293b',
                                        borderRadius: 4, fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.02em',
                                    }}>
                                        {group.label} — {group.employees.length} func.
                                    </div>

                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', color: '#475569' }}>
                                                <th style={th}>Funcionario</th>
                                                <th style={th}>Turno</th>
                                                <th style={th}>Sector</th>
                                                {showVehicle && <th style={th}>Vehículo</th>}
                                                <th style={th}>Notas</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.employees.map(emp => {
                                                const edit  = currentEdit(emp);
                                                const dirty = !!edits[emp.id];
                                                return (
                                                    <tr
                                                        key={emp.id}
                                                        style={{
                                                            borderBottom: '1px solid #e2e8f0',
                                                            background: dirty ? '#fefce8' : undefined,
                                                        }}
                                                    >
                                                        <td style={td}>{displayName(emp)}</td>
                                                        <td style={td}>
                                                            <span style={{
                                                                padding: '2px 6px', borderRadius: 3,
                                                                background: SHIFT_BG[emp.shift_base] ?? '#f1f5f9',
                                                                color: SHIFT_TEXT[emp.shift_base] ?? '#1e293b',
                                                                fontSize: '0.75rem', fontWeight: 600,
                                                            }}>
                                                                {emp.shift}
                                                            </span>
                                                        </td>
                                                        <td style={td}>
                                                            <select
                                                                value={edit.sector_id ?? ''}
                                                                onChange={e => setField(emp.id, 'sector_id', e.target.value ? Number(e.target.value) : null)}
                                                                style={selectStyle}
                                                            >
                                                                <option value="">— Sin sector —</option>
                                                                {sectors.map(s => (
                                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        {showVehicle && (
                                                            <td style={td}>
                                                                <select
                                                                    value={edit.vehicle_id ?? ''}
                                                                    onChange={e => setField(emp.id, 'vehicle_id', e.target.value ? Number(e.target.value) : null)}
                                                                    style={selectStyle}
                                                                >
                                                                    <option value="">— Sin vehículo —</option>
                                                                    {vehicles.map(v => (
                                                                        <option key={v.id} value={v.id}>{v.name}</option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                        )}
                                                        <td style={td}>
                                                            <input
                                                                value={edit.notes}
                                                                onChange={e => setField(emp.id, 'notes', e.target.value)}
                                                                placeholder="—"
                                                                style={{ ...selectStyle, minWidth: 100 }}
                                                            />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </AppLayout>
    );
}

// ── Colores de turno ──────────────────────────────────────────────────────────
const SHIFT_BG: Record<string, string> = {
    M: '#fef9c3', T: '#fed7aa', N: '#e0e7ff',
    '1': '#dcfce7', '2': '#d1fae5', '3': '#ccfbf1',
};
const SHIFT_TEXT: Record<string, string> = {
    M: '#854d0e', T: '#9a3412', N: '#3730a3',
    '1': '#166534', '2': '#065f46', '3': '#0f766e',
};

// ── Estilos ───────────────────────────────────────────────────────────────────
const inputStyle: CSSProperties = {
    padding: '0.3rem 0.5rem', borderRadius: 4, border: '1px solid #cbd5e1',
};
const th: CSSProperties = {
    textAlign: 'left', padding: '0.4rem 0.6rem',
    fontWeight: 600, fontSize: '0.78rem', textTransform: 'uppercase',
    letterSpacing: '0.04em', color: '#64748b',
};
const td: CSSProperties = { padding: '0.35rem 0.6rem', verticalAlign: 'middle' };
const selectStyle: CSSProperties = {
    width: '100%', padding: '0.25rem 0.4rem',
    border: '1px solid #cbd5e1', borderRadius: 4, fontSize: '0.875rem', background: '#fff',
};
