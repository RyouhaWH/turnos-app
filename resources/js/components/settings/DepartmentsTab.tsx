import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Save, X, Building2, Users } from 'lucide-react';

interface Department {
    id: number;
    name: string;
    description?: string;
    manager_id?: number;
    manager_name?: string;
    employee_count: number;
    created_at: string;
    updated_at: string;
}

interface DepartmentsTabProps {
    departments: Department[];
    onDepartmentCreate: (data: Partial<Department>) => void;
    onDepartmentUpdate: (departmentId: number, data: Partial<Department>) => void;
    onDepartmentDelete: (departmentId: number) => void;
}

export default function DepartmentsTab({
    departments,
    onDepartmentCreate,
    onDepartmentUpdate,
    onDepartmentDelete
}: DepartmentsTabProps) {
    const [editingDepartment, setEditingDepartment] = useState<number | null>(null);
    const [editingDepartmentData, setEditingDepartmentData] = useState<Partial<Department>>({});
    const [newDepartment, setNewDepartment] = useState({ name: '', description: '' });
    const [isAddingDepartment, setIsAddingDepartment] = useState(false);

    const handleStartEdit = (department: Department) => {
        setEditingDepartment(department.id);
        setEditingDepartmentData({
            name: department.name,
            description: department.description
        });
    };

    const handleSaveDepartment = (departmentId: number) => {
        onDepartmentUpdate(departmentId, editingDepartmentData);
        setEditingDepartment(null);
        setEditingDepartmentData({});
    };

    const handleCancelEdit = () => {
        setEditingDepartment(null);
        setEditingDepartmentData({});
    };

    const handleCreateDepartment = () => {
        if (newDepartment.name.trim()) {
            onDepartmentCreate(newDepartment);
            setNewDepartment({ name: '', description: '' });
            setIsAddingDepartment(false);
        }
    };

    const handleCancelCreate = () => {
        setIsAddingDepartment(false);
        setNewDepartment({ name: '', description: '' });
    };

    return (
        <div className="space-y-6">
            <Card className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Gestión de Departamentos
                            </CardTitle>
                            <CardDescription>
                                Administra los departamentos de la organización
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => setIsAddingDepartment(true)}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo Departamento
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Agregar nuevo departamento */}
                    {isAddingDepartment && (
                        <Card className="mb-6 border-2 border-dashed border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20 backdrop-blur-sm">
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="new-department-name" className="text-sm font-medium">Nombre del Departamento</Label>
                                        <Input
                                            id="new-department-name"
                                            value={newDepartment.name}
                                            onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Ej: Recursos Humanos"
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="new-department-description" className="text-sm font-medium">Descripción</Label>
                                        <Input
                                            id="new-department-description"
                                            value={newDepartment.description}
                                            onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                                            placeholder="Descripción del departamento"
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Button onClick={handleCreateDepartment} className="bg-blue-600 hover:bg-blue-700">
                                        <Save className="h-4 w-4 mr-2" />
                                        Crear Departamento
                                    </Button>
                                    <Button variant="outline" onClick={handleCancelCreate}>
                                        <X className="h-4 w-4 mr-2" />
                                        Cancelar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Lista de departamentos existentes */}
                    <div className="space-y-4">
                        {departments.map((department) => (
                            <Card key={department.id} className="border-l-4 border-blue-400">
                                <CardContent className="pt-6">
                                    {editingDepartment === department.id ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor={`department-name-${department.id}`} className="text-sm font-medium">Nombre del Departamento</Label>
                                                <Input
                                                    id={`department-name-${department.id}`}
                                                    value={editingDepartmentData.name || ''}
                                                    onChange={(e) => setEditingDepartmentData(prev => ({ ...prev, name: e.target.value }))}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor={`department-description-${department.id}`} className="text-sm font-medium">Descripción</Label>
                                                <Input
                                                    id={`department-description-${department.id}`}
                                                    value={editingDepartmentData.description || ''}
                                                    onChange={(e) => setEditingDepartmentData(prev => ({ ...prev, description: e.target.value }))}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    onClick={() => handleSaveDepartment(department.id)}
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
                                                <div>
                                                    <h3 className="font-semibold text-lg">{department.name}</h3>
                                                    {department.description && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {department.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-4 w-4" />
                                                            {department.employee_count} empleados
                                                        </span>
                                                        <span>
                                                            Creado: {new Date(department.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleStartEdit(department)}
                                                    className="text-blue-600 hover:text-blue-700"
                                                >
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Editar
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => onDepartmentDelete(department.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    Eliminar
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}

                        {departments.length === 0 && (
                            <div className="text-center py-8">
                                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    No hay departamentos configurados
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Comienza creando el primer departamento de tu organización
                                </p>
                                <Button
                                    onClick={() => setIsAddingDepartment(true)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Crear Departamento
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
