import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';

interface Vehicle {
    id: number;
    name: string;
    plate_number: string | null;
    type: string;
    status: string;
    notes: string | null;
    is_active: boolean;
}

interface Props {
    vehicles: Vehicle[];
    types: string[];
    statuses: string[];
}

const TYPE_LABELS: Record<string, string> = {
    patrol: 'Patrullaje', motorcycle: 'Motorizado', bicycle: 'Ciclo',
    drone: 'Dron', van: 'Furgón', other: 'Otro',
};

const STATUS_LABELS: Record<string, string> = {
    available: 'Disponible', in_use: 'En uso',
    maintenance: 'Mantención', inactive: 'Inactivo',
};

const emptyForm = { name: '', plate_number: '', type: 'patrol', status: 'available', notes: '', is_active: true };

export default function VehiclesIndex({ vehicles, types, statuses }: Props) {
    const [editing, setEditing] = useState<Vehicle | null>(null);
    const [showing, setShowing] = useState(false);
    const [form, setForm] = useState(emptyForm);

    function openCreate() {
        setEditing(null);
        setForm(emptyForm);
        setShowing(true);
    }

    function openEdit(v: Vehicle) {
        setEditing(v);
        setForm({
            name: v.name,
            plate_number: v.plate_number ?? '',
            type: v.type,
            status: v.status,
            notes: v.notes ?? '',
            is_active: v.is_active,
        });
        setShowing(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const payload = { ...form, plate_number: form.plate_number || null, notes: form.notes || null };
        if (editing) {
            router.put(`/platform-data/vehicles/${editing.id}`, payload, {
                onSuccess: () => { setShowing(false); setEditing(null); },
            });
        } else {
            router.post('/platform-data/vehicles', payload, {
                onSuccess: () => setShowing(false),
            });
        }
    }

    function handleDelete(id: number) {
        if (!confirm('¿Eliminar vehículo?')) return;
        router.delete(`/platform-data/vehicles/${id}`);
    }

    return (
        <AppLayout>
            <Head title="Vehículos" />
            <div style={{ padding: '1rem', maxWidth: 800 }}>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Vehículos (Móviles)</h1>

                <button onClick={openCreate} style={{ marginBottom: '1rem', padding: '0.4rem 1rem' }}>
                    + Nuevo vehículo
                </button>

                {showing && (
                    <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 400 }}>
                        <h2>{editing ? 'Editar vehículo' : 'Nuevo vehículo'}</h2>
                        <label>
                            Nombre *
                            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ display: 'block', width: '100%' }} />
                        </label>
                        <label>
                            Patente
                            <input value={form.plate_number} onChange={e => setForm({ ...form, plate_number: e.target.value })} style={{ display: 'block', width: '100%' }} />
                        </label>
                        <label>
                            Tipo *
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ display: 'block', width: '100%' }}>
                                {types.map(t => <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>)}
                            </select>
                        </label>
                        <label>
                            Estado *
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} style={{ display: 'block', width: '100%' }}>
                                {statuses.map(s => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
                            </select>
                        </label>
                        <label>
                            Notas
                            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ display: 'block', width: '100%' }} />
                        </label>
                        <label>
                            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                            {' '}Activo
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="submit">{editing ? 'Actualizar' : 'Crear'}</button>
                            <button type="button" onClick={() => setShowing(false)}>Cancelar</button>
                        </div>
                    </form>
                )}

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #ccc' }}>
                            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Nombre</th>
                            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Patente</th>
                            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Tipo</th>
                            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Estado</th>
                            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Activo</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {vehicles.map(v => (
                            <tr key={v.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '0.5rem' }}>{v.name}</td>
                                <td style={{ padding: '0.5rem' }}>{v.plate_number ?? '-'}</td>
                                <td style={{ padding: '0.5rem' }}>{TYPE_LABELS[v.type] ?? v.type}</td>
                                <td style={{ padding: '0.5rem' }}>{STATUS_LABELS[v.status] ?? v.status}</td>
                                <td style={{ padding: '0.5rem' }}>{v.is_active ? 'Sí' : 'No'}</td>
                                <td style={{ padding: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                                    <button onClick={() => openEdit(v)}>Editar</button>
                                    <button onClick={() => handleDelete(v.id)} style={{ color: 'red' }}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                        {vehicles.length === 0 && (
                            <tr><td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>Sin vehículos registrados</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
