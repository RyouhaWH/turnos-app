import React, { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Edit2, Plus, Trash2, Phone, CheckCircle2, XCircle } from 'lucide-react';

interface WhatsAppRecipient {
    id: number;
    name: string;
    phone: string;
    role: string | null;
    identifier_id: string;
    is_active: boolean;
}

interface Props {
    recipients: WhatsAppRecipient[];
}

export default function WhatsAppRecipientsAdmin({ recipients }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        role: '',
        identifier_id: '',
        is_active: true,
    });
    const [isSaving, setIsSaving] = useState(false);

    const openDialog = (recipient?: WhatsAppRecipient) => {
        if (recipient) {
            setEditingId(recipient.id);
            setFormData({
                name: recipient.name,
                phone: recipient.phone,
                role: recipient.role || '',
                identifier_id: recipient.identifier_id,
                is_active: recipient.is_active,
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                phone: '',
                role: '',
                identifier_id: '',
                is_active: true,
            });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        const url = editingId 
            ? `/admin/whatsapp-recipients/${editingId}` 
            : '/admin/whatsapp-recipients';
            
        const method = editingId ? 'put' : 'post';

        router[method](url, formData as any, {
            onSuccess: () => {
                toast.success(editingId ? 'Destinatario actualizado' : 'Destinatario creado');
                setIsDialogOpen(false);
            },
            onError: (errors: any) => {
                console.error(errors);
                toast.error(errors.identifier_id || errors.name || 'Ocurrió un error al guardar');
            },
            onFinish: () => setIsSaving(false),
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('¿Estás seguro de que deseas eliminar a este destinatario?')) {
            router.delete(`/admin/whatsapp-recipients/${id}`, {
                onSuccess: () => toast.success('Destinatario eliminado'),
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'Notificaciones WhatsApp', href: '/admin/whatsapp-recipients' }]}>
            <Head title="Configurar Destinatarios WhatsApp" />

            <div className="mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Destinatarios WhatsApp</h2>
                        <p className="text-slate-500 mt-1 text-sm">Gestiona los contactos que recibirán notificaciones automáticas al modificar turnos.</p>
                    </div>
                    <Button onClick={() => openDialog()} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="w-4 h-4" />
                        Agregar Destinatario
                    </Button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Teléfono</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID Interno</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
                            {recipients.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        No hay destinatarios configurados.
                                    </td>
                                </tr>
                            ) : recipients.map((recipient) => (
                                <tr key={recipient.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{recipient.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-mono text-sm flex items-center gap-1">
                                        <Phone className="w-3 h-3" />
                                        {recipient.phone}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-sm">{recipient.role || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-xs">{recipient.identifier_id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {recipient.is_active ? 
                                            <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-4 h-4"/> Activo</span> : 
                                            <span className="flex items-center gap-1 text-slate-400"><XCircle className="w-4 h-4"/> Inactivo</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button variant="ghost" size="sm" onClick={() => openDialog(recipient)} className="text-indigo-600 hover:text-indigo-900">
                                            <Edit2 className="w-4 h-4 mb-0.5" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(recipient.id)} className="text-red-600 hover:text-red-900 ml-2">
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
                        <DialogTitle>{editingId ? 'Editar Destinatario' : 'Nuevo Destinatario'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nombre Completo</label>
                            <Input 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                                placeholder="Ej: Javier Alvarado"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Número de Teléfono</label>
                            <Input 
                                value={formData.phone} 
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                required
                                placeholder="Ej: 912345678"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rol (Opcional)</label>
                            <Input 
                                value={formData.role} 
                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                                placeholder="Ej: Supervisor"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">ID de Identificación (Único)</label>
                            <Input 
                                value={formData.identifier_id} 
                                onChange={(e) => setFormData({...formData, identifier_id: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                                required
                                placeholder="ej: javier-alvarado"
                                disabled={editingId !== null}
                            />
                            <p className="text-xs text-slate-500">Un identificador único sin espacios para uso interno del sistema.</p>
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox 
                                id="is_active" 
                                checked={formData.is_active}
                                onCheckedChange={(checked) => setFormData({...formData, is_active: checked === true})}
                            />
                            <label htmlFor="is_active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Contacto Activo
                            </label>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
                                {isSaving ? 'Guardando...' : 'Guardar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
