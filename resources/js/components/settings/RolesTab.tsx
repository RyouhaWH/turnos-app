import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Save, X, Users } from 'lucide-react';
import { AVAILABLE_COLORS } from '@/lib/role-colors';

interface Rol {
    id: number;
    nombre: string;
    is_operational: boolean;
    color?: string;
    created_at: string;
    updated_at: string;
}

interface RolesTabProps {
    roles: Rol[];
    onRoleUpdate: (roleId: number, data: Partial<Rol>) => void;
    onRoleCreate: (data: Partial<Rol>) => void;
}

export default function RolesTab({ roles, onRoleUpdate, onRoleCreate }: RolesTabProps) {
    const [editingRole, setEditingRole] = useState<number | null>(null);
    const [editingRoleData, setEditingRoleData] = useState<Partial<Rol>>({});
    const [newRole, setNewRole] = useState({ nombre: '', is_operational: true, color: '#3B82F6' });
    const [isAddingRole, setIsAddingRole] = useState(false);

    const colorPalette = AVAILABLE_COLORS;

    const handleSaveRole = (roleId: number, data: Partial<Rol>) => {
        onRoleUpdate(roleId, data);
        setEditingRole(null);
    };

    const handleCreateRole = () => {
        if (newRole.nombre.trim()) {
            onRoleCreate(newRole);
            setNewRole({ nombre: '', is_operational: true, color: '#3B82F6' });
            setIsAddingRole(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingRole(null);
    };

    const handleCancelCreate = () => {
        setIsAddingRole(false);
        setNewRole({ nombre: '', is_operational: true, color: '#3B82F6' });
    };

    const handleStartEdit = (role: Rol) => {
        setEditingRole(role.id);
        setEditingRoleData({
            nombre: role.nombre,
            is_operational: role.is_operational,
            color: role.color
        });
    };

    return (
        <div className="space-y-6">
            <Card className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Gestión de Roles
                            </CardTitle>
                            <CardDescription>
                                Crea, edita y configura roles operativos con colores personalizados
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => setIsAddingRole(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo Rol
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Agregar nuevo rol */}
                    {isAddingRole && (
                        <Card className="mb-6 border-2 border-dashed border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20 backdrop-blur-sm">
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="new-role-name" className="text-sm font-medium">Nombre del Rol</Label>
                                        <Input
                                            id="new-role-name"
                                            value={newRole.nombre}
                                            onChange={(e) => setNewRole(prev => ({ ...prev, nombre: e.target.value }))}
                                            placeholder="Ej: Alerta Móvil"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium">Color del Rol</Label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {colorPalette.map((color) => (
                                                <button
                                                    key={color.hex}
                                                    type="button"
                                                    onClick={() => setNewRole(prev => ({ ...prev, color: color.hex }))}
                                                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                                                        newRole.color === color.hex
                                                            ? 'border-gray-800 scale-110'
                                                            : 'border-gray-300 hover:scale-105'
                                                    }`}
                                                    style={{ backgroundColor: color.hex }}
                                                    title={color.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-4">
                                    <input
                                        type="checkbox"
                                        id="new-role-operational"
                                        checked={newRole.is_operational}
                                        onChange={(e) => setNewRole(prev => ({ ...prev, is_operational: e.target.checked }))}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <Label htmlFor="new-role-operational" className="text-sm">
                                        Rol operativo (aparece en dashboard)
                                    </Label>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Button onClick={handleCreateRole} className="bg-blue-600 hover:bg-blue-700">
                                        <Save className="h-4 w-4 mr-2" />
                                        Crear Rol
                                    </Button>
                                    <Button variant="outline" onClick={handleCancelCreate}>
                                        <X className="h-4 w-4 mr-2" />
                                        Cancelar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Lista de roles existentes */}
                    <div className="space-y-4">
                        {roles.map((role) => (
                            <Card key={role.id} className="border-l-4" style={{ borderLeftColor: role.color || '#3B82F6' }}>
                                <CardContent className="pt-6">
                                    {editingRole === role.id ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor={`role-name-${role.id}`} className="text-sm font-medium">Nombre del Rol</Label>
                                                <Input
                                                    id={`role-name-${role.id}`}
                                                    value={editingRoleData?.nombre || role.nombre}
                                                    onChange={(e) => setEditingRoleData(prev => ({ ...prev, nombre: e.target.value }))}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-sm font-medium">Color del Rol</Label>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {colorPalette.map((color) => (
                                                        <button
                                                            key={color.hex}
                                                            type="button"
                                                            onClick={() => setEditingRoleData(prev => ({ ...prev, color: color.hex }))}
                                                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                                                                editingRoleData?.color === color.hex
                                                                    ? 'border-gray-800 scale-110'
                                                                    : 'border-gray-300 hover:scale-105'
                                                            }`}
                                                            style={{ backgroundColor: color.hex }}
                                                            title={color.name}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`role-operational-${role.id}`}
                                                    checked={editingRoleData?.is_operational ?? role.is_operational}
                                                    onChange={(e) => setEditingRoleData(prev => ({ ...prev, is_operational: e.target.checked }))}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <Label htmlFor={`role-operational-${role.id}`} className="text-sm">
                                                    Rol operativo
                                                </Label>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleSaveRole(role.id, editingRoleData || {})}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Guardar
                                                </Button>
                                                <Button variant="outline" onClick={handleCancelEdit}>
                                                    <X className="h-4 w-4 mr-2" />
                                                    Cancelar
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Badge
                                                    style={{
                                                        backgroundColor: role.color || '#3B82F6',
                                                        color: '#ffffff'
                                                    }}
                                                    className="px-3 py-1 text-sm font-medium"
                                                >
                                                    {role.nombre}
                                                </Badge>
                                                {role.is_operational && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Operativo
                                                    </Badge>
                                                )}
                                                <span className="text-sm text-gray-500">
                                                    Creado: {new Date(role.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleStartEdit(role)}
                                                className="text-blue-600 hover:text-blue-700"
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Editar
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
