import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';

interface Sector {
    id: number;
    name: string;
    description: string | null;
    color: string | null;
    is_active: boolean;
}

interface Props {
    sectors: Sector[];
}

const emptyForm = { name: '', description: '', color: '#3B82F6', is_active: true };

export default function SectorsIndex({ sectors }: Props) {
    const [editing, setEditing] = useState<Sector | null>(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState(emptyForm);

    function openCreate() {
        setEditing(null);
        setForm(emptyForm);
        setCreating(true);
    }

    function openEdit(sector: Sector) {
        setEditing(sector);
        setForm({
            name: sector.name,
            description: sector.description ?? '',
            color: sector.color ?? '#3B82F6',
            is_active: sector.is_active,
        });
        setCreating(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            router.put(`/platform-data/sectors/${editing.id}`, form, {
                onSuccess: () => { setCreating(false); setEditing(null); },
            });
        } else {
            router.post('/platform-data/sectors', form, {
                onSuccess: () => { setCreating(false); },
            });
        }
    }

    function handleDelete(id: number) {
        if (!confirm('¿Eliminar sector?')) return;
        router.delete(`/platform-data/sectors/${id}`);
    }

    return (
        <AppLayout>
            <Head title="Sectores" />
            <div style={{ padding: '1rem', maxWidth: 700 }}>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Sectores</h1>

                <button onClick={openCreate} style={{ marginBottom: '1rem', padding: '0.4rem 1rem' }}>
                    + Nuevo sector
                </button>

                {creating && (
                    <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: 400 }}>
                        <h2>{editing ? 'Editar sector' : 'Nuevo sector'}</h2>
                        <label>
                            Nombre *
                            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ display: 'block', width: '100%' }} />
                        </label>
                        <label>
                            Descripción
                            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ display: 'block', width: '100%' }} />
                        </label>
                        <label>
                            Color
                            <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} style={{ display: 'block' }} />
                        </label>
                        <label>
                            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                            {' '}Activo
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="submit">{editing ? 'Actualizar' : 'Crear'}</button>
                            <button type="button" onClick={() => setCreating(false)}>Cancelar</button>
                        </div>
                    </form>
                )}

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #ccc' }}>
                            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Nombre</th>
                            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Descripción</th>
                            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Color</th>
                            <th style={{ textAlign: 'left', padding: '0.5rem' }}>Activo</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sectors.map(sector => (
                            <tr key={sector.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '0.5rem' }}>{sector.name}</td>
                                <td style={{ padding: '0.5rem' }}>{sector.description ?? '-'}</td>
                                <td style={{ padding: '0.5rem' }}>
                                    <span style={{ display: 'inline-block', width: 20, height: 20, background: sector.color ?? '#ccc', borderRadius: 4, verticalAlign: 'middle' }} />
                                    {' '}{sector.color}
                                </td>
                                <td style={{ padding: '0.5rem' }}>{sector.is_active ? 'Sí' : 'No'}</td>
                                <td style={{ padding: '0.5rem', display: 'flex', gap: '0.4rem' }}>
                                    <button onClick={() => openEdit(sector)}>Editar</button>
                                    <button onClick={() => handleDelete(sector.id)} style={{ color: 'red' }}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                        {sectors.length === 0 && (
                            <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#888' }}>Sin sectores registrados</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </AppLayout>
    );
}
