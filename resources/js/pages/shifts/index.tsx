import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import {
    Plane,
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
    TrendingUp,
    Search,
    Radio,
    Zap,
    UserCheck2,
    CircleDot
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Panel de Control',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    const { stats, roles, loading, error, message, refetch } = useDashboardStats();

    console.log(roles);

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
                                <div>
                                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                        Centro de roles de funcionarios
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
                            <div className="flex gap-4 h-auto">
                                {/* <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-800/40 dark:to-emerald-700/40 border-0 shadow-lg dark:shadow-slate-900/20">
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
                                </Card> */}

                                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-800/40 dark:to-blue-700/40 border-0 shadow-lg dark:shadow-slate-900/2 max-h-22">
                                    <CardContent className="flex items-center gap-3 p-4 h-auto">
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

                                <Card className="bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-800/40 dark:to-amber-700/40 border-0 shadow-lg dark:shadow-slate-900/20 max-h-22">
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
                                {Object.entries(roles)
                                    .filter(([roleId, roleName]) => {
                                        const lowerRoleName = roleName.toLowerCase();
                                        return !lowerRoleName.includes('administrativo') &&
                                               !lowerRoleName.includes('servicio') &&
                                               !lowerRoleName.includes('personal de servicio') &&
                                               !lowerRoleName.includes('desvinculado');
                                    })
                                    .map(([roleId, roleName], index) => {
                                    // Mapeo de colores específicos por rol
                                    const getRoleColors = (roleName: string) => {
                                        const lowerRoleName = roleName.toLowerCase();

                                        if (lowerRoleName.includes('proximidad') ) {
                                            return {
                                                from: 'from-red-500', to: 'to-red-600',
                                                darkFrom: 'dark:from-red-700/40', darkTo: 'dark:to-red-600/40',
                                                bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200',
                                                buttonFrom: 'from-red-600', buttonTo: 'to-red-700',
                                                statsBg: 'bg-red-50', statsText: 'text-red-600',
                                                icon: 'Car'
                                            };
                                        } else if (lowerRoleName.includes('fiscalización') || lowerRoleName.includes('fiscalizacion')) {
                                            return {
                                                from: 'from-amber-500', to: 'to-amber-600',
                                                darkFrom: 'dark:from-amber-700/40', darkTo: 'dark:to-amber-600/40',
                                                bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200',
                                                buttonFrom: 'from-amber-600', buttonTo: 'to-amber-700',
                                                statsBg: 'bg-amber-50', statsText: 'text-amber-600',
                                                icon: 'UserCheck2'
                                            };
                                        } else if (lowerRoleName.includes('ciclo') || lowerRoleName.includes('bicicleta') || lowerRoleName.includes('Ciclopatrullaje')) {
                                            return {
                                                from: 'from-purple-500', to: 'to-purple-600',
                                                darkFrom: 'dark:from-purple-700/40', darkTo: 'dark:to-purple-600/40',
                                                bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200',
                                                buttonFrom: 'from-purple-600', buttonTo: 'to-purple-700',
                                                statsBg: 'bg-purple-50', statsText: 'text-purple-600',
                                                icon: 'Bike'
                                            };
                                        } else if (lowerRoleName.includes('motorizado')) {
                                            return {
                                                from: 'from-emerald-500', to: 'to-emerald-600',
                                                darkFrom: 'dark:from-emerald-700/40', darkTo: 'dark:to-emerald-600/40',
                                                bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200',
                                                buttonFrom: 'from-emerald-600', buttonTo: 'to-emerald-700',
                                                statsBg: 'bg-emerald-50', statsText: 'text-emerald-600',
                                                icon: 'Bike'
                                            };
                                        } else if (lowerRoleName.includes('dron') || lowerRoleName.includes('drone')) {
                                            return {
                                                from: 'from-sky-500', to: 'to-sky-600',
                                                darkFrom: 'dark:from-sky-700/40', darkTo: 'dark:to-sky-600/40',
                                                bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200',
                                                buttonFrom: 'from-sky-600', buttonTo: 'to-sky-700',
                                                statsBg: 'bg-sky-50', statsText: 'text-sky-600',
                                                icon: 'Plane'
                                            };
                                        }  else {
                                            // Color por defecto para roles no especificados
                                            const defaultColors = [
                                                { from: 'from-indigo-500', to: 'to-indigo-600', darkFrom: 'dark:from-indigo-700/40', darkTo: 'dark:to-indigo-600/40', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', buttonFrom: 'from-indigo-600', buttonTo: 'to-indigo-700', statsBg: 'bg-indigo-50', statsText: 'text-indigo-600', icon: 'Users' },
                                                { from: 'from-cyan-500', to: 'to-cyan-600', darkFrom: 'dark:from-cyan-700/40', darkTo: 'dark:to-cyan-600/40', bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', buttonFrom: 'from-cyan-600', buttonTo: 'to-cyan-700', statsBg: 'bg-cyan-50', statsText: 'text-cyan-600', icon: 'Shield' },
                                                { from: 'from-orange-500', to: 'to-orange-600', darkFrom: 'dark:from-orange-700/40', darkTo: 'dark:to-orange-600/40', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', buttonFrom: 'from-orange-600', buttonTo: 'to-orange-700', statsBg: 'bg-orange-50', statsText: 'text-orange-600', icon: 'Zap' }
                                            ];
                                            return defaultColors[index % defaultColors.length];
                                        }
                                    };

                                    const colors = getRoleColors(roleName);
                                    const roleKey = roleName.toLowerCase().replace(/\s+/g, '');
                                    const roleStats = stats[roleKey] || { total: 0, activos: 0, trabajandoHoy: 0 };

                                    return (
                                        <Card key={roleId} className="group hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] bg-white/90 dark:bg-slate-800/40 backdrop-blur-sm border-slate-200/50 dark:border-slate-600/30 pb-6">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center justify-between">
                                                    <div className={`p-3 bg-gradient-to-br ${colors.from} ${colors.to} ${colors.darkFrom} ${colors.darkTo} rounded-xl shadow-lg group-hover:shadow-xl transition-shadow`}>
                                                        {colors.icon === 'Car' && <Car className="h-6 w-6 text-white" />}
                                                        {colors.icon === 'UserCheck2' && <UserCheck2 className="h-6 w-6 text-white" />}
                                                        {colors.icon === 'Bike' && <Bike className="h-6 w-6 text-white" />}
                                                        {colors.icon === 'Plane' && <Plane className="h-6 w-6 text-white" />}
                                                        {colors.icon === 'Search' && <Search className="h-6 w-6 text-white" />}
                                                        {colors.icon === 'Radio' && <Radio className="h-6 w-6 text-white" />}
                                                        {colors.icon === 'Users' && <Users className="h-6 w-6 text-white" />}
                                                        {colors.icon === 'Shield' && <Shield className="h-6 w-6 text-white" />}
                                                        {colors.icon === 'Zap' && <Zap className="h-6 w-6 text-white" />}
                                            </div>
                                                    <Badge variant="secondary" className={`${colors.bg} ${colors.text} ${colors.border}`}>
                                                        {loading ? '...' : `${roleStats.activos}/${roleStats.total}`}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-xl text-slate-900 dark:text-slate-100">
                                                    {roleName === "Alerta Móvil" ? "Patrullaje y Proximidad" : roleName}
                                        </CardTitle>
                                        <CardDescription className="dark:text-slate-300">
                                                    Personal operativo especializado
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3 text-center ">
                                                    <div className={`p-3 ${colors.statsBg} dark:bg-slate-700/30 rounded-lg`}>
                                                        <p className={`text-xl font-bold ${colors.statsText} dark:text-slate-200`}>
                                                            {loading ? '...' : roleStats.total}
                                                        </p>
                                                        <p className={`text-xs ${colors.statsText}/70 dark:text-slate-400`}>Total</p>
                                            </div>
                                                    {/* <div className="p-3 bg-green-50 dark:bg-slate-700/30 rounded-lg">
                                                <p className="text-xl font-bold text-green-600 dark:text-slate-200">
                                                            {loading ? '...' : roleStats.activos}
                                                </p>
                                                <p className="text-xs text-green-600/70 dark:text-slate-400">Activos</p>
                                                    </div> */}
                                            <div className="p-3 bg-blue-50 dark:bg-slate-700/30 rounded-lg">
                                                <p className="text-xl font-bold text-blue-600 dark:text-slate-200">
                                                            {loading ? '...' : roleStats.trabajandoHoy}
                                                </p>
                                                <p className="text-xs text-blue-600/70 dark:text-slate-400">Hoy</p>
                                            </div>
                                        </div>
                                                <Button asChild className={`w-full bg-gradient-to-r ${colors.buttonFrom} ${colors.buttonTo} hover:from-${colors.buttonFrom.split('-')[1]}-700 hover:to-${colors.buttonTo.split('-')[1]}-800 group-hover:shadow-lg transition-all`}>
                                                    <Link href={route('create-shifts', { id: parseInt(roleId) })} as="button">
                                                <Clock className="mr-2 h-4 w-4" />
                                                Gestionar Turnos
                                                <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                                    );
                                })}
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
