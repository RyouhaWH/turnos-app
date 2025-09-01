import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Search, TrendingUp, Users, Mail, Phone, IdCard } from 'lucide-react';

interface EmployeeWithMissingData {
    id: number;
    name: string;
    first_name?: string;
    paternal_lastname?: string;
    maternal_lastname?: string;
    rut?: string;
    phone?: string;
    email?: string;
    rol_nombre: string;
    amzoma: boolean;
    missing_fields: string[];
}

interface MissingDataCategories {
    missing_email: EmployeeWithMissingData[];
    missing_rut: EmployeeWithMissingData[];
    missing_phone: EmployeeWithMissingData[];
    missing_multiple: EmployeeWithMissingData[];
    complete_data: EmployeeWithMissingData[];
}

interface MissingDataStats {
    total_employees: number;
    complete_data: number;
    missing_email: number;
    missing_rut: number;
    missing_phone: number;
    missing_multiple: number;
    completion_percentage: number;
}

interface MissingDataTabProps {
    onLoadMissingData: () => void;
    missingDataResponse: MissingDataCategories | null;
    stats: MissingDataStats | null;
    loading: boolean;
}

export default function MissingDataTab({
    onLoadMissingData,
    missingDataResponse,
    stats,
    loading
}: MissingDataTabProps) {
    const [selectedCategory, setSelectedCategory] = useState<keyof MissingDataCategories | 'all'>('all');
    const [searchMissingData, setSearchMissingData] = useState('');
    const [filteredData, setFilteredData] = useState<EmployeeWithMissingData[]>([]);

    useEffect(() => {
        if (!missingDataResponse) return;

        let dataToFilter: EmployeeWithMissingData[] = [];

        if (selectedCategory === 'all') {
            // Combinar todos los empleados con datos faltantes
            dataToFilter = [
                ...missingDataResponse.missing_email,
                ...missingDataResponse.missing_rut,
                ...missingDataResponse.missing_phone,
                ...missingDataResponse.missing_multiple
            ];
            // Remover duplicados
            dataToFilter = dataToFilter.filter((item, index, self) =>
                index === self.findIndex(t => t.id === item.id)
            );
        } else {
            dataToFilter = missingDataResponse[selectedCategory] || [];
        }

        // Aplicar filtro de búsqueda
        if (searchMissingData.trim() === '') {
            setFilteredData(dataToFilter);
        } else {
            const filtered = dataToFilter.filter(emp =>
                emp.name.toLowerCase().includes(searchMissingData.toLowerCase()) ||
                emp.rut?.toLowerCase().includes(searchMissingData.toLowerCase()) ||
                emp.email?.toLowerCase().includes(searchMissingData.toLowerCase())
            );
            setFilteredData(filtered);
        }
    }, [selectedCategory, searchMissingData, missingDataResponse]);

    const getCategoryIcon = (category: keyof MissingDataCategories | 'all') => {
        switch (category) {
            case 'missing_email':
                return <Mail className="h-4 w-4" />;
            case 'missing_rut':
                return <IdCard className="h-4 w-4" />;
            case 'missing_phone':
                return <Phone className="h-4 w-4" />;
            case 'missing_multiple':
                return <AlertCircle className="h-4 w-4" />;
            case 'complete_data':
                return <CheckCircle className="h-4 w-4" />;
            default:
                return <Users className="h-4 w-4" />;
        }
    };

    const getCategoryLabel = (category: keyof MissingDataCategories | 'all') => {
        switch (category) {
            case 'missing_email':
                return 'Sin Email';
            case 'missing_rut':
                return 'Sin RUT';
            case 'missing_phone':
                return 'Sin Teléfono';
            case 'missing_multiple':
                return 'Múltiples Campos Faltantes';
            case 'complete_data':
                return 'Datos Completos';
            default:
                return 'Todos';
        }
    };

    const getCategoryColor = (category: keyof MissingDataCategories | 'all') => {
        switch (category) {
            case 'missing_email':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'missing_rut':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'missing_phone':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'missing_multiple':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'complete_data':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    const getMissingFieldsBadges = (missingFields: string[]) => {
        return missingFields.map((field) => {
            let icon, label, color;
            switch (field) {
                case 'email':
                    icon = <Mail className="h-3 w-3" />;
                    label = 'Email';
                    color = 'bg-orange-100 text-orange-700 border-orange-200';
                    break;
                case 'rut':
                    icon = <IdCard className="h-3 w-3" />;
                    label = 'RUT';
                    color = 'bg-red-100 text-red-700 border-red-200';
                    break;
                case 'phone':
                    icon = <Phone className="h-3 w-3" />;
                    label = 'Teléfono';
                    color = 'bg-yellow-100 text-yellow-700 border-yellow-200';
                    break;
                default:
                    icon = <AlertCircle className="h-3 w-3" />;
                    label = field;
                    color = 'bg-gray-100 text-gray-700 border-gray-200';
            }
            return (
                <Badge key={field} variant="outline" className={`text-xs ${color}`}>
                    {icon} {label}
                </Badge>
            );
        });
    };

    if (!missingDataResponse && !loading) {
        return (
            <div className="space-y-6">
                <Card className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                    <CardContent className="pt-6">
                        <div className="text-center py-8">
                            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                No hay datos cargados
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Haz clic en "Cargar Datos Faltantes" para analizar la información de los empleados
                            </p>
                            <Button onClick={onLoadMissingData} className="bg-blue-600 hover:bg-blue-700">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Cargar Datos Faltantes
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header con estadísticas */}
            {stats && (
                <Card className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Estadísticas de Datos
                        </CardTitle>
                        <CardDescription>
                            Resumen de la completitud de información de los empleados
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{stats.total_employees}</div>
                                <div className="text-sm text-gray-600">Total Empleados</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{stats.complete_data}</div>
                                <div className="text-sm text-gray-600">Datos Completos</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">{stats.total_employees - stats.complete_data}</div>
                                <div className="text-sm text-gray-600">Con Datos Faltantes</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{stats.completion_percentage}%</div>
                                <div className="text-sm text-gray-600">Porcentaje de Completitud</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filtros y búsqueda */}
            <Card className="bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        {/* Filtro de categoría */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Categoría
                            </label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value as keyof MissingDataCategories | 'all')}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">Todos los empleados con datos faltantes</option>
                                <option value="missing_email">Sin Email ({stats?.missing_email || 0})</option>
                                <option value="missing_rut">Sin RUT ({stats?.missing_rut || 0})</option>
                                <option value="missing_phone">Sin Teléfono ({stats?.missing_phone || 0})</option>
                                <option value="missing_multiple">Múltiples campos ({stats?.missing_multiple || 0})</option>
                                <option value="complete_data">Datos completos ({stats?.complete_data || 0})</option>
                            </select>
                        </div>

                        {/* Búsqueda */}
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Buscar
                            </label>
                            <Input
                                placeholder="Buscar por nombre, RUT o email..."
                                value={searchMissingData}
                                onChange={(e) => setSearchMissingData(e.target.value)}
                            />
                        </div>

                        {/* Botón de recarga */}
                        <div className="flex items-end">
                            <Button
                                onClick={onLoadMissingData}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {loading ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                )}
                                {loading ? 'Cargando...' : 'Recargar'}
                            </Button>
                        </div>
                    </div>

                    {/* Lista de empleados */}
                    <div className="space-y-4">
                        {filteredData.map((empleado) => (
                            <Card key={empleado.id} className="border-l-4 border-orange-400">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg">{empleado.name}</h3>
                                                <Badge variant="outline" className="text-xs">
                                                    {empleado.rol_nombre}
                                                </Badge>
                                                <Badge variant="outline" className={`text-xs ${empleado.amzoma ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                    {empleado.amzoma ? 'Amzoma' : 'Municipal'}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                {empleado.first_name} {empleado.paternal_lastname} {empleado.maternal_lastname}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {empleado.rut && (
                                                    <span className="text-sm text-gray-600">RUT: {empleado.rut}</span>
                                                )}
                                                {empleado.phone && (
                                                    <span className="text-sm text-gray-600">Tel: {empleado.phone}</span>
                                                )}
                                                {empleado.email && (
                                                    <span className="text-sm text-gray-600">Email: {empleado.email}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    Campos Faltantes:
                                                </div>
                                                <div className="flex gap-1 mt-1">
                                                    {getMissingFieldsBadges(empleado.missing_fields)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {filteredData.length === 0 && (
                            <div className="text-center py-8">
                                <div className="text-gray-500">
                                    {searchMissingData.trim() !== ''
                                        ? 'No se encontraron empleados con los criterios de búsqueda'
                                        : 'No hay empleados en esta categoría'
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
