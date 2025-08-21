import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, CheckCircle, AlertCircle, Save } from 'lucide-react';

interface Role {
    id: number;
    nombre: string;
    is_operational: boolean;
}

interface RoleDashboardSettingsProps {
    roles: Role[];
}

export default function RoleDashboardSettings({ roles }: RoleDashboardSettingsProps) {


    const [roleSettings, setRoleSettings] = useState<Record<number, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Inicializar configuración desde props
    useEffect(() => {
        const initialSettings: Record<number, boolean> = {};
        roles.forEach(role => {
            initialSettings[role.id] = role.is_operational;
        });
        setRoleSettings(initialSettings);
    }, [roles]);

    const handleRoleToggle = (roleId: number, checked: boolean) => {
        setRoleSettings(prev => ({
            ...prev,
            [roleId]: checked
        }));
    };

    const saveSettings = async () => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const rolesToUpdate = Object.entries(roleSettings).map(([roleId, isOperational]) => ({
                id: parseInt(roleId),
                is_operational: isOperational
            }));

            const response = await fetch('/api/roles/update-multiple', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({ roles: rolesToUpdate })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Configuración de roles actualizada correctamente');
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(data.message || 'Error al actualizar configuración');
            }
        } catch (err) {
            setError('Error de conexión al guardar configuración');
        } finally {
            setIsLoading(false);
        }
    };

    const hasChanges = () => {
        return roles.some(role => roleSettings[role.id] !== role.is_operational);
    };

    const getRoleBadgeColor = (roleName: string) => {
        const lowerRoleName = roleName.toLowerCase();
        if (lowerRoleName.includes('alerta') || lowerRoleName.includes('patrullaje')) {
            return 'bg-red-100 text-red-800 hover:bg-red-200';
        } else if (lowerRoleName.includes('fiscalización') || lowerRoleName.includes('fiscalizacion')) {
            return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
        } else if (lowerRoleName.includes('motorizado')) {
            return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
        } else if (lowerRoleName.includes('dron')) {
            return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
        } else if (lowerRoleName.includes('ciclopatrullaje')) {
            return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
        } else if (lowerRoleName.includes('despacho') || lowerRoleName.includes('coordinador')) {
            return 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
        } else {
            return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
        }
    };

    return (
        <div className="w-full pb-6">
            <div className="mb-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Settings className="h-5 w-5" />
                    Configuración de Roles Operativos
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Selecciona qué roles son operativos (desempeñan funciones de prevención de delito). Solo estos roles aparecerán en la vista de turnos.
                </p>
            </div>

            {success && (
                <Alert className="mb-4 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                        {success}
                    </AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Roles Operativos
                    </CardTitle>
                    <CardDescription>
                        Marca los roles que son operativos (desempeñan funciones de prevención de delito). Solo estos roles aparecerán en la vista de turnos.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {roles.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay roles configurados en el sistema
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {roles.map((role) => (
                                        <div key={role.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                                            <Checkbox
                                                id={`role-${role.id}`}
                                                checked={roleSettings[role.id] || false}
                                                onCheckedChange={(checked) => handleRoleToggle(role.id, checked as boolean)}
                                            />
                                            <div className="flex-1">
                                                <label
                                                    htmlFor={`role-${role.id}`}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {role.nombre}
                                                </label>
                                                <div className="mt-1">
                                                    <Badge className={getRoleBadgeColor(role.nombre)}>
                                                        {roleSettings[role.id] ? 'Operativo' : 'No Operativo'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-4 border-t">
                                    <Button
                                        onClick={saveSettings}
                                        disabled={isLoading || !hasChanges()}
                                        className="flex items-center gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        {isLoading ? 'Guardando...' : 'Guardar Configuración'}
                                    </Button>
                                </div>

                                <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <strong>Nota:</strong> Los cambios se aplicarán inmediatamente a la vista de turnos.
                                    Solo se mostrarán los empleados de roles marcados como "Operativo".
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
