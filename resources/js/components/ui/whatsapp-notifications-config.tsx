import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Settings, Users, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePage } from '@inertiajs/react';

interface WhatsAppRecipient {
    id: number;
    identifier_id: string;
    name: string;
    phone: string;
    role?: string;
}

interface WhatsAppNotificationsConfigProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selectedRecipients: string[], testingMode: boolean, sendToEmployee: boolean) => void;
    selectedRecipients?: string[];
    isMobile?: boolean;
    initialTestingMode?: boolean;
    initialSendToEmployee?: boolean;
    allowTestingToggle?: boolean;
}

// Lista de destinatarios ahora se carga dinámicamente desde el backend.

export function WhatsAppNotificationsConfig({
    isOpen,
    onClose,
    onSave,
    selectedRecipients = [],
    isMobile = false,
    initialTestingMode = false,
    initialSendToEmployee = true,
    allowTestingToggle = true,
}: WhatsAppNotificationsConfigProps) {
    const { props: pageProps } = usePage<{ auth: { user: any } }>();
    const user = pageProps.auth?.user;

    // Verificar si el usuario tiene permisos de administrador
    const hasAdminPermissions = user?.roles?.some((role: any) =>
        role.name === 'Administrador'
    ) || false;

    const [availableRecipients, setAvailableRecipients] = useState<WhatsAppRecipient[]>([]);

    const [localSelectedRecipients, setLocalSelectedRecipients] = useState<string[]>(() => {
        // Inicializado vacío hasta que cargue la lista
        return selectedRecipients && selectedRecipients.length > 0 ? selectedRecipients : [];
    });
    const [isLoading, setIsLoading] = useState(false);
    const [testingMode, setTestingMode] = useState<boolean>(initialTestingMode);
    const [sendToEmployee, setSendToEmployee] = useState<boolean>(initialSendToEmployee);

    // Estado para los números de teléfono actualizados
    const [phoneNumbers, setPhoneNumbers] = useState<Record<string, string>>({});

    // Sincronizar estado local con props cuando se abre el modal
    useEffect(() => {
        if (isOpen && availableRecipients.length > 0) {
            // Filtrar solo los IDs válidos
            const validIds = availableRecipients.map(r => r.identifier_id);
            const filteredRecipients = Array.isArray(selectedRecipients)
                ? selectedRecipients.filter(id => validIds.includes(id))
                : [];

            // Si selectedRecipients tiene valores válidos, usarlos; si no, usar todos por defecto
            const recipientsToUse = filteredRecipients.length > 0
                ? filteredRecipients
                : validIds;

            setLocalSelectedRecipients(recipientsToUse);
            setTestingMode(initialTestingMode);
            setSendToEmployee(initialSendToEmployee);
        }
    }, [isOpen, selectedRecipients, initialTestingMode, initialSendToEmployee, availableRecipients]);

    // Cargar números de teléfono desde la base de datos
    useEffect(() => {
        const loadPhoneNumbers = async () => {
            setIsLoading(true);
            try {
                console.log('🔄 Iniciando carga de números de teléfono...');

                // Hacer llamada a la API para obtener los números actualizados
                const response = await fetch('/api/whatsapp-recipients', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        'Accept': 'application/json',
                    },
                });

                console.log('📡 Respuesta del servidor:', response.status, response.statusText);

                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Datos recibidos:', data);

                    if (data.success && data.recipients) {
                        setAvailableRecipients(data.recipients);
                        setPhoneNumbers(data.phoneNumbers || {});
                        console.log('📱 Destinatarios cargados exitosamente:', data.recipients);
                        
                        // Si no hay seleccionados y acabamos de cargar, inicializar con todos
                        if (!selectedRecipients || selectedRecipients.length === 0) {
                            setLocalSelectedRecipients(data.recipients.map((r: WhatsAppRecipient) => r.identifier_id));
                        }
                    } else {
                        console.warn('⚠️ Respuesta no exitosa:', data);
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('❌ Error en la respuesta:', response.status, errorData);
                }
            } catch (error) {
                console.error('💥 Error al cargar números de teléfono:', error);
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
        setLocalSelectedRecipients(availableRecipients.map(r => r.identifier_id));
    };

    const handleSelectNone = () => {
        setLocalSelectedRecipients([]);
    };

    const handleSave = () => {
        onSave(localSelectedRecipients, testingMode, sendToEmployee);
        onClose();
    };



    const selectedCount = localSelectedRecipients.length;
    const totalCount = availableRecipients.length;

    // Agrupar destinatarios por rol
    const recipientsByRole = availableRecipients.reduce((acc, recipient) => {
        const role = recipient.role || 'Otros';
        if (!acc[role]) {
            acc[role] = [];
        }
        acc[role].push(recipient);
        return acc;
    }, {} as Record<string, WhatsAppRecipient[]>);

    const content = (
        <div className="space-y-6">
            {/* Checkbox para modo testing (solo si el usuario está autorizado) */}
            {allowTestingToggle && (
                <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/30 dark:border-yellow-600 shadow-sm">
                    <Checkbox
                        id="testing-mode-desktop"
                        checked={testingMode}
                        onCheckedChange={(checked) => setTestingMode(checked as boolean)}
                        className="h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-2 border-yellow-400 rounded data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500 dark:border-yellow-500 dark:data-[state=checked]:bg-yellow-400 dark:data-[state=checked]:border-yellow-400"
                    />
                    <label htmlFor="testing-mode-desktop" className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 cursor-pointer">
                        🧪 Modo Testing - Para realizar pruebas de envío de mensajes
                    </label>
                </div>
            )}
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
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                    {selectedCount} de {totalCount} seleccionados
                </Badge>
            </div>

            {/* Lista de destinatarios agrupados por rol */}
            <ScrollArea className="h-[400px] w-full">
                <div className="space-y-4 pr-4">
                    {Object.entries(recipientsByRole).map(([role, recipients]) => (
                        <div key={role} className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {role}
                                </h4>
                                <Badge variant="secondary" className="text-xs">
                                    {recipients.length}
                                </Badge>
                            </div>

                            <div className="space-y-2 ml-6">
                                {recipients.map((recipient) => (
                                    <div
                                        key={recipient.identifier_id}
                                        className="flex items-center space-x-3 p-3 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/70 transition-colors bg-white dark:bg-slate-800/80"
                                    >
                                        <Checkbox
                                            id={recipient.identifier_id}
                                            checked={localSelectedRecipients.includes(recipient.identifier_id)}
                                            onCheckedChange={() => handleRecipientToggle(recipient.identifier_id)}
                                            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <label
                                                    htmlFor={recipient.identifier_id}
                                                    className="text-sm font-medium text-slate-900 dark:text-slate-100 cursor-pointer flex-1"
                                                >
                                                    {recipient.name}
                                                </label>
                                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-300">
                                                    <Phone className="h-3 w-3" />
                                                    <span className="font-mono">
                                                        {phoneNumbers[recipient.identifier_id] || recipient.phone}
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

            {/* Checkbox para enviar al funcionario afectado */}
            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/30 dark:border-green-600 shadow-sm">
                <Checkbox
                    id="send-to-employee-desktop"
                    checked={sendToEmployee}
                    onCheckedChange={(checked) => setSendToEmployee(checked as boolean)}
                    className="h-5 w-5 text-green-600 focus:ring-green-500 border-2 border-green-400 rounded data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 dark:border-green-500 dark:data-[state=checked]:bg-green-400 dark:data-[state=checked]:border-green-400"
                />
                <label htmlFor="send-to-employee-desktop" className="text-sm font-semibold text-green-900 dark:text-green-100 cursor-pointer">
                    Enviar mensaje al funcionario afectado
                </label>
            </div>

            {/* Información adicional */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-600 dark:bg-blue-800/40">
                <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-300 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-100 mb-1">
                            Información importante
                        </h4>
                        <ul className="text-xs text-blue-700 dark:text-blue-200 space-y-1">
                            <li>• Los mensajes se enviarán automáticamente cuando se modifiquen turnos en el grid</li>
                            <li>• Solo se notificarán cambios que afecten a empleados asignados</li>
                            <li>• Los números sin teléfono se obtendrán automáticamente de la base de datos</li>
                            <li>• Los funcionarios afectados recibirán el mensaje solo si está habilitada la opción "Enviar mensaje al funcionario afectado"</li>
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
                    <div className="flex justify-end">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                            {selectedCount} de {totalCount} seleccionados
                        </Badge>
                    </div>
                </DialogHeader>

                    <div className="flex-1 overflow-y-auto px-4 py-3 bg-slate-50 dark:bg-slate-800">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Controles de selección masiva */}
                                <div className="flex items-center justify-center gap-2">
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

                                {/* Checkbox de Modo Testing (solo si está permitido) */}
                                {allowTestingToggle && (
                                    <div className="flex items-center space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/30 dark:border-yellow-600 shadow-sm">
                                        <Checkbox
                                            id="testing-mode"
                                            checked={testingMode}
                                            onCheckedChange={(checked) => setTestingMode(checked as boolean)}
                                            className="h-5 w-5 text-yellow-600 focus:ring-yellow-500 border-2 border-yellow-400 rounded data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500 dark:border-yellow-500 dark:data-[state=checked]:bg-yellow-400 dark:data-[state=checked]:border-yellow-400"
                                        />
                                        <label htmlFor="testing-mode" className="text-sm font-semibold text-yellow-900 dark:text-yellow-100 cursor-pointer">
                                            🧪 Modo Testing - Para realizar pruebas de envío de mensajes
                                        </label>
                                    </div>
                                )}

                                {testingMode && (
                                    <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg dark:bg-blue-900/40 dark:border-blue-500 shadow-sm">
                                        <div className="flex items-start gap-2">
                                            <div className="text-lg">⚠️</div>
                                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                                <strong>Modo Testing Activado:</strong> Todos los mensajes de WhatsApp se enviarán a tu número de prueba,
                                                pero se simulará el comportamiento de producción (múltiples destinatarios).
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Checkbox para enviar al funcionario afectado */}
                                <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/30 dark:border-green-600 shadow-sm">
                                    <Checkbox
                                        id="send-to-employee"
                                        checked={sendToEmployee}
                                        onCheckedChange={(checked) => setSendToEmployee(checked as boolean)}
                                        className="h-5 w-5 text-green-600 focus:ring-green-500 border-2 border-green-400 rounded data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 dark:border-green-500 dark:data-[state=checked]:bg-green-400 dark:data-[state=checked]:border-green-400"
                                    />
                                    <label htmlFor="send-to-employee" className="text-sm font-semibold text-green-900 dark:text-green-100 cursor-pointer">
                                        Enviar mensaje al funcionario afectado
                                    </label>
                                </div>

                                {/* Lista de destinatarios sin agrupación */}
                                <div className="w-full ">
                                    <ScrollArea className="h-[400px] w-full">
                                        <div className="space-y-2 w-full ">
                                            {availableRecipients.map((recipient) => {
                                                const isSpecial = recipient.identifier_id === 'funcionarios-afectados';
                                                return (
                                                    <div
                                                        key={recipient.identifier_id}
                                                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors min-w-full ${
                                                            isSpecial
                                                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700'
                                                                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800/50'
                                                        }`}
                                                    >
                                                        <Checkbox
                                                            id={recipient.identifier_id}
                                                            checked={localSelectedRecipients.includes(recipient.identifier_id)}
                                                            onCheckedChange={() => handleRecipientToggle(recipient.identifier_id)}
                                                            className={`data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 ${
                                                                isSpecial ? 'border-blue-300' : ''
                                                            }`}
                                                        />
                                                        <div className="flex-1 min-w-0 w-full">
                                                            <div className="flex items-center justify-between gap-2 w-full">
                                                                <label
                                                                    htmlFor={recipient.identifier_id}
                                                                    className={`text-sm font-medium cursor-pointer flex-1 ${
                                                                        isSpecial
                                                                            ? 'text-blue-900 dark:text-blue-100 font-semibold'
                                                                            : 'text-slate-900 dark:text-white'
                                                                    }`}
                                                                >
                                                                    {recipient.name}
                                                                    {isSpecial && (
                                                                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full dark:bg-blue-800 dark:text-blue-200">
                                                                            Automático
                                                                        </span>
                                                                    )}
                                                                </label>
                                                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                                    <Phone className="h-3 w-3" />
                                                                    <span className="font-mono">
                                                                        {phoneNumbers[recipient.identifier_id] || recipient.phone}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </ScrollArea>
                                </div>

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
                                                <li>• Los funcionarios afectados recibirán el mensaje solo si está habilitada la opción "Enviar mensaje al funcionario afectado"</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="px-4 py-3 border-t bg-white dark:bg-slate-900 flex-shrink-0">
                        <div className="flex gap-2 w-full">
                            <Button variant="outline" onClick={onClose} className="flex-1">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Guardar ({selectedCount})
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <div className="w-full">
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {content}

                    {/* Botones de acción para desktop */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-600">
                        <Button variant="outline" onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Guardar ({selectedCount})
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
