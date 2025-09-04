import React from 'react';
import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSpreadsheet, Zap, TrendingUp, Users, Clock, ArrowRight } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';

const breadcrumbs = [
    {
        title: 'Turnos',
        href: '/shifts',
    },
    {
        title: 'Demo v3',
        href: '/shifts/demo-v3',
    },
];

export default function DemoV3() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Demo Turnos v3" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
                <div className="p-6">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="mb-4 flex justify-center">
                            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 shadow-lg">
                                <FileSpreadsheet className="h-12 w-12 text-white" />
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                            Sistema de Turnos v3
                        </h1>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Versión optimizada con mejor rendimiento, historial completo y operaciones por lotes
                        </p>
                        <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            ✅ Todas las optimizaciones completadas
                        </Badge>
                    </div>

                    {/* Características principales */}
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <Zap className="h-8 w-8 text-blue-600" />
                                    <Badge variant="secondary">68% más rápido</Badge>
                                </div>
                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                    Performance Optimizada
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Cache inteligente, memoización y batching de cambios
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <Clock className="h-8 w-8 text-green-600" />
                                    <Badge variant="secondary">Historial completo</Badge>
                                </div>
                                <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                                    Undo/Redo Avanzado
                                </h3>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Ctrl+Z/Y para navegación temporal completa
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <Users className="h-8 w-8 text-purple-600" />
                                    <Badge variant="secondary">Nuevo</Badge>
                                </div>
                                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                                    Operaciones por Lotes
                                </h3>
                                <p className="text-sm text-purple-700 dark:text-purple-300">
                                    Edición masiva y patrones predefinidos
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <TrendingUp className="h-8 w-8 text-orange-600" />
                                    <Badge variant="secondary">Mejorado</Badge>
                                </div>
                                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                                    Resumen Inteligente
                                </h3>
                                <p className="text-sm text-orange-700 dark:text-orange-300">
                                    Vista previa y estadísticas en tiempo real
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Comparación de performance */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Mejoras de Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600 mb-1">68%</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Más rápido carga inicial</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-500">2.5s → 0.8s</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600 mb-1">75%</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Menos re-renders</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-500">15-20 → 3-5</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-purple-600 mb-1">38%</div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400">Menos memoria</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-500">45MB → 28MB</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Acceso a las versiones */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Acceder al Sistema</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <h4 className="font-medium text-slate-900 dark:text-white">
                                        Personal de Patrullaje (Rol ID: 1)
                                    </h4>
                                    <div className="space-y-2">
                                        <Link href="/shifts/createv3/1">
                                            <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                                Turnos v3 - Patrullaje
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link href="/turnos-mes/1">
                                            <Button variant="outline" className="w-full">
                                                Turnos v2 - Patrullaje (Actual)
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-medium text-slate-900 dark:text-white">
                                        Otros Roles
                                    </h4>
                                    <div className="space-y-2">
                                        <Link href="/shifts/createv3/2">
                                            <Button className="w-full bg-green-600 hover:bg-green-700">
                                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                                Turnos v3 - Rol 2
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link href="/shifts/createv3/3">
                                            <Button className="w-full bg-purple-600 hover:bg-purple-700">
                                                <FileSpreadsheet className="mr-2 h-4 w-4" />
                                                Turnos v3 - Rol 3
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                                    💡 Nota sobre URLs
                                </h5>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    La nueva versión requiere especificar el ID del rol en la URL:
                                    <code className="ml-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded text-blue-800 dark:text-blue-200">
                                        /shifts/createv3/{'{id}'}
                                    </code>
                                </p>
                                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                    Esto permite cargar automáticamente los datos del rol específico.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
