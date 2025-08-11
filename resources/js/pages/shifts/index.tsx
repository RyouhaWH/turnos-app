import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import {
    Car,
    Users,
    Bike,
    Shield,
    Clock,
    Upload,
    History,
    ChevronRight,
    BarChart3,
    Settings,
    Calendar,
    Activity,
    FileSpreadsheet,
    UserCheck,
    RefreshCw,
    AlertCircle,
    TrendingUp
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Panel de Control',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const { stats, loading, error, message, refetch } = useDashboardStats();

    if (error) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Panel de Control - Error" />
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            Error al cargar estadísticas
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
                        <Button onClick={refetch}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reintentar
                        </Button>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Panel de Control - Gestión de Turnos" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/50">
                {/* Header Section */}
                <div className="border-b border-slate-200 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                    <div className="px-6 py-8">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                            {/* Title Section */}
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                                    <Shield className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                        Centro de Control
                                    </h1>
                                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                                        Gestión centralizada de turnos y personal operativo
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                                        <Activity className="h-4 w-4" />
                                        <span>Sistema activo - {new Date().toLocaleDateString('es-CL')}</span>
                                        {loading && (
                                            <div className="flex items-center gap-1 ml-2">
                                                <RefreshCw className="h-3 w-3 animate-spin" />
                                                <span className="text-xs">Actualizando...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="flex flex-wrap gap-4">
                                <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-800/40 dark:to-emerald-700/40 border-0 shadow-lg dark:shadow-slate-900/20">
                                    <CardContent className="flex items-center gap-3 p-4">
                                        <div className="p-2 bg-white/20 dark:bg-emerald-700/40 rounded-lg">
                                            <UserCheck className="h-5 w-5 text-white dark:text-emerald-200" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white dark:text-emerald-100">
                                                {loading ? '...' : stats.totals.activos}
                                            </p>
                                            <p className="text-emerald-100 dark:text-emerald-200 text-sm">Personal Activo</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-800/40 dark:to-blue-700/40 border-0 shadow-lg dark:shadow-slate-900/20">
                                    <CardContent className="flex items-center gap-3 p-4">
                                        <div className="p-2 bg-white/20 dark:bg-blue-700/40 rounded-lg">
                                            <Users className="h-5 w-5 text-white dark:text-blue-200" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white dark:text-blue-100">
                                                {loading ? '...' : stats.totals.total}
                                            </p>
                                            <p className="text-blue-100 dark:text-blue-200 text-sm">Personal Total</p>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-800/40 dark:to-amber-700/40 border-0 shadow-lg dark:shadow-slate-900/20">
                                    <CardContent className="flex items-center gap-3 p-4">
                                        <div className="p-2 bg-white/20 dark:bg-amber-700/40 rounded-lg">
                                            <TrendingUp className="h-5 w-5 text-white dark:text-amber-200" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-white dark:text-amber-100">
                                                {loading ? '...' : stats.totals.trabajandoHoy}
                                            </p>
                                            <p className="text-amber-100 dark:text-amber-200 text-sm">Trabajando Hoy</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="p-6">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {/* Departamentos Section */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-slate-700/40 rounded-lg">
                                        <Users className="h-5 w-5 text-blue-600 dark:text-slate-300" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                            Departamentos Operativos
                                        </h2>
                                        <p className="text-slate-600 dark:text-slate-300">
                                            {message || "Selecciona un departamento para gestionar sus turnos"}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={refetch}
                                    disabled={loading}
                                    className="shrink-0"
                                >
                                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                    Actualizar
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Alerta Móvil */}
                                <Card className="group hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 dark:from-red-700/40 dark:to-red-600/40 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                                                <Car className="h-6 w-6 text-white dark:text-red-200" />
                                            </div>
                                            <Badge variant="secondary" className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700/50">
                                                {loading ? '...' : `${stats.alertaMovil.activos}/${stats.alertaMovil.total}`}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                                            Alerta Móvil
                                        </CardTitle>
                                        <CardDescription className="dark:text-slate-300">
                                            Patrulleros de respuesta rápida y emergencias
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-3 gap-3 text-center">
                                            <div className="p-3 bg-red-50 dark:bg-slate-700/30 rounded-lg">
                                                <p className="text-xl font-bold text-red-600 dark:text-slate-200">
                                                    {loading ? '...' : stats.alertaMovil.total}
                                                </p>
                                                <p className="text-xs text-red-600/70 dark:text-slate-400">Total</p>
                                            </div>
                                            <div className="p-3 bg-green-50 dark:bg-slate-700/30 rounded-lg">
                                                <p className="text-xl font-bold text-green-600 dark:text-slate-200">
                                                    {loading ? '...' : stats.alertaMovil.activos}
                                                </p>
                                                <p className="text-xs text-green-600/70 dark:text-slate-400">Activos</p>
                                            </div>
                                            <div className="p-3 bg-blue-50 dark:bg-slate-700/30 rounded-lg">
                                                <p className="text-xl font-bold text-blue-600 dark:text-slate-200">
                                                    {loading ? '...' : stats.alertaMovil.trabajandoHoy}
                                                </p>
                                                <p className="text-xs text-blue-600/70 dark:text-slate-400">Hoy</p>
                                            </div>
                                        </div>
                                        <Button asChild className="w-full bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700/60 dark:to-red-600/60 hover:from-red-700 hover:to-red-800 dark:hover:from-red-600/70 dark:hover:to-red-500/70 group-hover:shadow-lg transition-all">
                                            <Link href={route('create-shifts', { id: 1 })} as="button">
                                                <Clock className="mr-2 h-4 w-4" />
                                                Gestionar Turnos
                                                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Fiscalización */}
                                <Card className="group hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 dark:from-amber-700/40 dark:to-amber-600/40 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                                                <FileSpreadsheet className="h-6 w-6 text-white dark:text-amber-200" />
                                            </div>
                                            <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50">
                                                {loading ? '...' : `${stats.fiscalizacion.activos}/${stats.fiscalizacion.total}`}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                                            Fiscalización
                                        </CardTitle>
                                        <CardDescription className="dark:text-slate-300">
                                            Personal de control y supervisión normativa
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-3 gap-3 text-center">
                                            <div className="p-3 bg-amber-50 dark:bg-slate-700/30 rounded-lg">
                                                <p className="text-xl font-bold text-amber-600 dark:text-slate-200">
                                                    {loading ? '...' : stats.fiscalizacion.total}
                                                </p>
                                                <p className="text-xs text-amber-600/70 dark:text-slate-400">Total</p>
                                            </div>
                                            <div className="p-3 bg-green-50 dark:bg-slate-700/30 rounded-lg">
                                                <p className="text-xl font-bold text-green-600 dark:text-slate-200">
                                                    {loading ? '...' : stats.fiscalizacion.activos}
                                                </p>
                                                <p className="text-xs text-green-600/70 dark:text-slate-400">Activos</p>
                                            </div>
                                            <div className="p-3 bg-blue-50 dark:bg-slate-700/30 rounded-lg">
                                                <p className="text-xl font-bold text-blue-600 dark:text-slate-200">
                                                    {loading ? '...' : stats.fiscalizacion.trabajandoHoy}
                                                </p>
                                                <p className="text-xs text-blue-600/70 dark:text-slate-400">Hoy</p>
                                            </div>
                                        </div>
                                        <Button asChild className="w-full bg-gradient-to-r from-amber-600 to-amber-700 dark:from-amber-700/60 dark:to-amber-600/60 hover:from-amber-700 hover:to-amber-800 dark:hover:from-amber-600/70 dark:hover:to-amber-500/70 group-hover:shadow-lg transition-all">
                                            <Link href={route('create-shifts', { id: 2 })} as="button">
                                                <Clock className="mr-2 h-4 w-4" />
                                                Gestionar Turnos
                                                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>

                                {/* Personal Motorizado */}
                                <Card className="group hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                            <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-700/40 dark:to-emerald-600/40 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                                                <Bike className="h-6 w-6 text-white dark:text-emerald-200" />
                                            </div>
                                            <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50">
                                                {loading ? '...' : `${stats.motorizado.activos}/${stats.motorizado.total}`}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                                            Personal Motorizado
                                        </CardTitle>
                                        <CardDescription className="dark:text-slate-300">
                                            Unidades móviles de patrullaje urbano
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-3 gap-3 text-center">
                                            <div className="p-3 bg-emerald-50 dark:bg-slate-700/30 rounded-lg">
                                                <p className="text-xl font-bold text-emerald-600 dark:text-slate-200">
                                                    {loading ? '...' : stats.motorizado.total}
                                                </p>
                                                <p className="text-xs text-emerald-600/70 dark:text-slate-400">Total</p>
                                            </div>
                                            <div className="p-3 bg-green-50 dark:bg-slate-700/30 rounded-lg">
                                                <p className="text-xl font-bold text-green-600 dark:text-slate-200">
                                                    {loading ? '...' : stats.motorizado.activos}
                                                </p>
                                                <p className="text-xs text-green-600/70 dark:text-slate-400">Activos</p>
                                            </div>
                                            <div className="p-3 bg-blue-50 dark:bg-slate-700/30 rounded-lg">
                                                <p className="text-xl font-bold text-blue-600 dark:text-slate-200">
                                                    {loading ? '...' : stats.motorizado.trabajandoHoy}
                                                </p>
                                                <p className="text-xs text-blue-600/70 dark:text-slate-400">Hoy</p>
                                            </div>
                                        </div>
                                        <Button asChild className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-700/60 dark:to-emerald-600/60 hover:from-emerald-700 hover:to-emerald-800 dark:hover:from-emerald-600/70 dark:hover:to-emerald-500/70 group-hover:shadow-lg transition-all">
                                            <Link href={route('create-shifts', { id: 3 })} as="button">
                                                <Clock className="mr-2 h-4 w-4" />
                                                Gestionar Turnos
                                                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {/* Herramientas Administrativas */}
                        {/* <section>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                    <Settings className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                        Herramientas Administrativas
                                    </h2>
                                    <p className="text-slate-600 dark:text-slate-400">
                                        Funciones de gestión y configuración del sistema
                                    </p>
                                </div>
                            </div> */}


                            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> */}
                                {/* Cargar Turnos */}
                                {/* <Card className="group hover:shadow-lg transition-all duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-slate-200/50">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                                                <Upload className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                    Cargar Turnos
                                                </h3>
                                                <p className="text-slate-600 dark:text-slate-400 text-sm">
                                                    Importar planillas de turnos desde archivos
                                                </p>
                                            </div>
                                            <Button asChild variant="outline" className="shrink-0 group-hover:bg-blue-50 group-hover:border-blue-200">
                                                <Link href={route('upload-shift-file')} as="button">
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    Subir
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card> */}

                                {/* Historial */}
                                {/* <Card className="group hover:shadow-lg transition-all duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-slate-200/50">
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl shadow-md">
                                                <History className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                    Historial de Cambios
                                                </h3>
                                                <p className="text-slate-600 dark:text-slate-400 text-sm">
                                                    Revisar modificaciones y auditoría
                                                </p>
                                            </div>
                                            <Button asChild variant="outline" className="shrink-0 group-hover:bg-slate-50 group-hover:border-slate-200">
                                                <Link href={route('test-shifts-history', { employeeId: 3 })} as="button">
                                                    <BarChart3 className="mr-2 h-4 w-4" />
                                                    Ver
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </section> */}

                        {/* Footer Info */}
                        {/* <div className="text-center py-8 border-t border-slate-200 dark:border-slate-800">
                            <p className="text-slate-500 dark:text-slate-400 text-sm">
                                Sistema de Gestión de Turnos - Desarrollado por JorgeWH optimizar la operación diaria
                            </p>
                        </div> */}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
