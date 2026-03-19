import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Edit2, Plus, Trash2 } from 'lucide-react';

interface Mapping {
    id: number;
    shift_code: string;
    talana_id: number;
    description: string | null;
}

interface Props {
    mappings: Mapping[];
}

export default function TalanaMappings({ mappings }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        shift_code: '',
        talana_id: '',
        description: '',
    });
    const [isSaving, setIsSaving] = useState(false);

    const openDialog = (mapping?: Mapping) => {
        if (mapping) {
            setEditingId(mapping.id);
            setFormData({
                shift_code: mapping.shift_code,
                talana_id: mapping.talana_id.toString(),
                description: mapping.description || '',
            });
        } else {
            setEditingId(null);
            setFormData({
                shift_code: '',
                talana_id: '',
                description: '',
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingId 
            ? `/admin/talana-mappings/${editingId}` 
            : '/admin/talana-mappings';
            
        const method = editingId ? 'put' : 'post';

        router[method](url, formData as any, {
            onSuccess: () => {
                toast.success(editingId ? 'Vinculación actualizada' : 'Vinculación creada');
                setIsDialogOpen(false);
            },
            onError: (errors: any) => {
                console.error(errors);
                toast.error(errors.shift_code || errors.talana_id || 'Ocurrió un error al guardar');
            },
            onFinish: () => setIsSaving(false),
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta vinculación?')) {
            router.delete(`/admin/talana-mappings/${id}`, {
                onSuccess: () => toast.success('Vinculación eliminada'),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Vinculaciones de Talana', href: '/admin/talana-mappings' }]}>
            <Head title="Configurar IDs Talana" />

            <div className="mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">IDs de Exportación a Talana</h2>
                        <p className="text-slate-500 mt-1 text-sm">Configura la correspondencia entre los códigos de turno (M, T, N, 1, 2) y sus IDs internos en Talana.</p>
                    </div>
                    <Button onClick={() => openDialog()} className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Agregar Vínculo
                    </Button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Código Turno</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID Talana</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Descripción</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                            {mappings.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                        No hay vinculaciones configuradas.
                                    </td>
                                </tr>
                            ) : mappings.map((mapping) => (
                                <tr key={mapping.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{mapping.shift_code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-bold">{mapping.talana_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-sm">{mapping.description || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button variant="ghost" size="sm" onClick={() => openDialog(mapping)} className="text-indigo-600 hover:text-indigo-900">
                                            <Edit2 className="w-4 h-4 mb-0.5" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(mapping.id)} className="text-red-600 hover:text-red-900 ml-2">
                                            <Trash2 className="w-4 h-4 mb-0.5" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Vinculación' : 'Nueva Vinculación'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Código de Turno (ej. M, 1, PE)</label>
                            <Input 
                                value={formData.shift_code} 
                                onChange={(e) => setFormData({...formData, shift_code: e.target.value.toUpperCase()})}
                                required
                                placeholder="M"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">ID en Talana</label>
                            <Input 
                                type="number"
                                value={formData.talana_id} 
                                onChange={(e) => setFormData({...formData, talana_id: e.target.value})}
                                required
                                placeholder="236"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Descripción (Opcional)</label>
                            <Input 
                                value={formData.description} 
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                placeholder="Ej: Mañana"
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
