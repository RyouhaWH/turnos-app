import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Settings, Users, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePage } from '@inertiajs/react';

interface WhatsAppRecipient {
    id: string;
    name: string;
    phone: string;
    rut?: string;
    role?: string;
}

interface WhatsAppNotificationsConfigProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selectedRecipients: string[]) => void;
    selectedRecipients?: string[];
    isMobile?: boolean;
}

// Lista de destinatarios basada en los números del ShiftsUpdateController
const DEFAULT_RECIPIENTS: WhatsAppRecipient[] = [
    { id: 'julio-sarmiento', name: 'Julio Sarmiento', phone: 'Se obtiene de BD', rut: '12282547-7', role: 'Supervisor' },
    { id: 'marianela-huequelef', name: 'Marianela Huequelef', phone: 'Se obtiene de BD', rut: '10604235-7', role: 'Supervisor' },
    { id: 'priscila-escobar', name: 'Priscila Escobar', phone: 'Se obtiene de BD', rut: '18522287-K', role: 'Supervisor' },
    { id: 'javier-alvarado', name: 'Javier Alvarado', phone: 'Se obtiene de BD', rut: '18984596-0', role: 'Supervisor' },
    { id: 'eduardo-esparza', name: 'Eduardo Esparza', phone: 'Se obtiene de BD', rut: '16948150-4', role: 'Supervisor' },
    { id: 'dayana-chavez', name: 'Dayana Chavez', phone: '981841759', role: 'Supervisor' },
    { id: 'central', name: 'Central', phone: '964949887', role: 'Central' },
    { id: 'manuel-verdugo', name: 'Manuel Verdugo', phone: 'Se obtiene de BD', rut: '15987971-2', role: 'Supervisor' },
    { id: 'paola-carrasco', name: 'Paola Carrasco', phone: 'Se obtiene de BD', rut: '12389084-1', role: 'Supervisor' },
    { id: 'cesar-soto', name: 'Cesar Soto', phone: 'Se obtiene de BD', rut: '16533970-3', role: 'Supervisor' },
    { id: 'cristian-montecinos', name: 'Cristian Montecinos', phone: '975952121', role: 'Supervisor' },
    { id: 'informaciones-amzoma', name: 'Informaciones Amzoma', phone: '985639782', role: 'Central' },
    { id: 'jorge-waltemath', name: 'Jorge Waltemath', phone: 'Se obtiene de BD', rut: '18198426-0', role: 'Supervisor' },
];

export function WhatsAppNotificationsConfig({ 
    isOpen, 
    onClose, 
    onSave, 
    selectedRecipients = [], 
    isMobile = false 
}: WhatsAppNotificationsConfigProps) {
    const { props: pageProps } = usePage<{ auth: { user: any } }>();
    const user = pageProps.auth?.user;
    
    // Verificar si el usuario tiene permisos de administrador
    const hasAdminPermissions = user?.roles?.some((role: any) =>
        role.name === 'Administrador'
    ) || false;

    const [localSelectedRecipients, setLocalSelectedRecipients] = useState<string[]>(selectedRecipients);
    const [isLoading, setIsLoading] = useState(false);

    // Estado para los números de teléfono actualizados
    const [phoneNumbers, setPhoneNumbers] = useState<Record<string, string>>({});

    // Cargar números de teléfono desde la base de datos
    useEffect(() => {
        const loadPhoneNumbers = async () => {
            setIsLoading(true);
            try {
                // Hacer llamada a la API para obtener los números actualizados
                const response = await fetch('/api/whatsapp-recipients', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setPhoneNumbers(data.phoneNumbers || {});
                    console.log('Números de teléfono cargados:', data.phoneNumbers);
                } else {
                    console.warn('No se pudieron cargar los números de teléfono, usando valores por defecto');
                }
            } catch (error) {
                console.error('Error al cargar números de teléfono:', error);
                // En caso de error, usar los valores por defecto
            } finally {
                setIsLoading(false);
            }
        };

        if (isOpen) {
            loadPhoneNumbers();
        }
    }, [isOpen]);

    // Si no es administrador, no mostrar el componente
    if (!hasAdminPermissions) {
        return null;
    }

    const handleRecipientToggle = (recipientId: string) => {
        setLocalSelectedRecipients(prev => 
            prev.includes(recipientId) 
                ? prev.filter(id => id !== recipientId)
                : [...prev, recipientId]
        );
    };

    const handleSelectAll = () => {
        setLocalSelectedRecipients(DEFAULT_RECIPIENTS.map(r => r.id));
    };

    const handleSelectNone = () => {
        setLocalSelectedRecipients([]);
    };

    const handleSave = () => {
        onSave(localSelectedRecipients);
        onClose();
    };

    const selectedCount = localSelectedRecipients.length;
    const totalCount = DEFAULT_RECIPIENTS.length;

    // Agrupar destinatarios por rol
    const recipientsByRole = DEFAULT_RECIPIENTS.reduce((acc, recipient) => {
        const role = recipient.role || 'Otros';
        if (!acc[role]) {
            acc[role] = [];
        }
        acc[role].push(recipient);
        return acc;
    }, {} as Record<string, WhatsAppRecipient[]>);

    const content = (
        <div className="space-y-6">
            {/* Header con estadísticas */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/20">
                        <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Configuración de Notificaciones WhatsApp
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Selecciona a quiénes notificar cuando se modifiquen los turnos
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                    {selectedCount} de {totalCount} seleccionados
                </Badge>
            </div>

            <Separator />

            {/* Controles de selección masiva */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        disabled={selectedCount === totalCount}
                        className="text-xs"
                    >
                        Seleccionar todos
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectNone}
                        disabled={selectedCount === 0}
                        className="text-xs"
                    >
                        Deseleccionar todos
                    </Button>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedCount > 0 && (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                            {selectedCount} destinatario{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* Lista de destinatarios agrupados por rol */}
            <ScrollArea className="h-[400px] w-full">
                <div className="space-y-4 pr-4">
                    {Object.entries(recipientsByRole).map(([role, recipients]) => (
                        <div key={role} className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {role}
                                </h4>
                                <Badge variant="secondary" className="text-xs">
                                    {recipients.length}
                                </Badge>
                            </div>
                            
                            <div className="space-y-2 ml-6">
                                {recipients.map((recipient) => (
                                    <div
                                        key={recipient.id}
                                        className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <Checkbox
                                            id={recipient.id}
                                            checked={localSelectedRecipients.includes(recipient.id)}
                                            onCheckedChange={() => handleRecipientToggle(recipient.id)}
                                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <label
                                                    htmlFor={recipient.id}
                                                    className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer flex-1"
                                                >
                                                    {recipient.name}
                                                </label>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1">
                                                {recipient.rut && (
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                        <span className="font-medium">RUT:</span>
                                                        <span>{recipient.rut}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                    <Phone className="h-3 w-3" />
                                                    <span className="font-medium">Tel:</span>
                                                    <span>
                                                        {phoneNumbers[recipient.id] || recipient.phone}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Información adicional */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                            Información importante
                        </h4>
                        <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                            <li>• Los mensajes se enviarán automáticamente cuando se modifiquen turnos en el grid</li>
                            <li>• Solo se notificarán cambios que afecten a empleados asignados</li>
                            <li>• Los números sin teléfono se obtendrán automáticamente de la base de datos</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );

    if (isMobile) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] max-h-[90vh] w-full h-full p-2 mx-auto flex flex-col">
                <DialogHeader className="px-4 py-3 border-b bg-white dark:bg-slate-900 flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-left">
                        <Settings className="h-5 w-5 flex-shrink-0" />
                        <span className="whitespace-nowrap">Configuración WhatsApp</span>
                    </DialogTitle>
                    <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 text-left">
                        Selecciona destinatarios para notificaciones de cambios de turnos
                    </DialogDescription>
                </DialogHeader>
                    
                    <div className="flex-1 overflow-y-auto px-4 py-3 bg-slate-50 dark:bg-slate-800">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            </div>
                        ) : (
                            content
                        )}
                    </div>

                    <DialogFooter className="px-4 py-3 border-t bg-white dark:bg-slate-900 flex-shrink-0">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Cancelar
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            disabled={selectedCount === 0}
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Guardar ({selectedCount})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Card className="w-full max-w-2xl mx-auto border-slate-200/50 shadow-xl backdrop-blur-sm dark:bg-slate-900/90">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl text-left">
                    <Settings className="h-5 w-5 flex-shrink-0" />
                    <span className="whitespace-nowrap">Configuración de Notificaciones WhatsApp</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                ) : (
                    content
                )}
            </CardContent>
        </Card>
    );
}
