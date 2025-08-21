import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
    Clock,
    User,
    ArrowRight,
    MessageSquare,
    Calendar,
    RefreshCw,
    Activity,
    AlertCircle
} from 'lucide-react';

interface LogItem {
    old_shift: string;
    new_shift: string;
    comment: string | null;
    changed_at: string;
    changed_by: string;
    empleado: string;
    shift_date?: string;
}

interface ShiftHistoryFeedProps {
    employee_rol_id?: number;
}

export default function ShiftHistoryFeed({ employee_rol_id }: ShiftHistoryFeedProps) {
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setError(false);
                // Construir la URL con el filtro de rol si está disponible
                const url = employee_rol_id
                    ? `/api/shift-change-log?rol_id=${employee_rol_id}`
                    : '/api/shift-change-log';

                const res = await fetch(url);
                if (!res.ok) throw new Error('Error al cargar');
                const data = await res.json();
                setLogs(data);
            } catch (error) {
                console.error('Error al cargar historial:', error);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchLogs, 30000);
        return () => clearInterval(interval);
    }, [employee_rol_id]); // Agregar employee_rol_id como dependencia

    const getTurnoInfo = (turno: string) => {
        const turnos = {
            'M': { label: 'Mañana', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: '🌅' },
            'T': { label: 'Tarde', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '☀️' },
            'N': { label: 'Noche', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '🌙' }
        };
        return turnos[turno as keyof typeof turnos] || {
            label: turno,
            color: 'bg-gray-100 text-gray-800 border-gray-200',
            icon: '⏰'
        };
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) {
        return 'Justo ahora';
    } else if (diffMinutes < 60) {
        return `Hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
        return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    } else {
        return date.toLocaleDateString('es-CL', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    }
};

    if (loading) {
        return (
            <div className="p-6 h-full flex flex-col items-center justify-center bg-white dark:bg-slate-900">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mb-4"></div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Cargando actividad reciente...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 h-full flex flex-col items-center justify-center bg-white dark:bg-slate-900">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 text-center">
                    Error al cargar el historial
                </p>
            </div>
        );
    }

    console.log(logs);

    return (
        <div className="h-full bg-white dark:bg-slate-900 overflow-hidden">
            {/* Feed Content */}
             <div className="p-1 overflow-y-auto h-[calc(100%-80px)] custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                            <Clock className="h-6 w-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                            Sin actividad reciente
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Los cambios de turnos aparecerán aquí
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {logs.map((log, index) => {
                            const oldTurno = getTurnoInfo(log.old_shift);
                            const newTurno = getTurnoInfo(log.new_shift);

                            return (
                                <div key={index} className="group">
                                    <div className="flex gap-3 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all duration-200 hover:border-slate-200 dark:hover:border-slate-600">
                                        {/* Avatar */}
                                        {/* <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarFallback className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                                                {getInitials(log.changed_by)}
                                            </AvatarFallback>
                                        </Avatar> */}

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Main Action */}
                                            <div className="flex flex-wrap items-center gap-1 text-sm">
                                                <span className="font-medium text-slate-900 dark:text-white">
                                                    {log.changed_by}
                                                </span>
                                                <span className="text-slate-600 dark:text-slate-400">
                                                    cambió el turno de:
                                                </span>
                                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                                    {log.empleado}
                                                </span>
                                                <span className="text-slate-600 dark:text-slate-400">
                                                    el día:
                                                </span>
                                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                                    {log.shift_date || 'N/A'}
                                                </span>

                                            </div>

                                            {/* Shift Change Visual */}
                                            <div className="flex items-center w-full justify-center gap-2 mt-2 mb-2">
                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${oldTurno.color} border`}
                                                >
                                                    <span className="mr-1">{oldTurno.icon}</span>
                                                    {oldTurno.label}
                                                </Badge>

                                                <ArrowRight className="h-3 w-3 text-slate-400" />

                                                <Badge
                                                    variant="outline"
                                                    className={`text-xs ${newTurno.color} border`}
                                                >
                                                    <span className="mr-1">{newTurno.icon}</span>
                                                    {newTurno.label}
                                                </Badge>
                                            </div>

                                                                                         {/* Comment */}
                                             {log.comment && log.comment !== "hola mundo" && (
                                                 <div className="mt-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
                                                    <div className="flex items-start gap-2">
                                                        <MessageSquare className="h-3 w-3 text-slate-400 mt-0.5 flex-shrink-0" />
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                                                            "{log.comment}"
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                                                                         {/* Timestamp */}
                                             <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDate(log.changed_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Auto-refresh indicator */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1 px-2 py-1 bg-slate-800 dark:bg-slate-700 text-white rounded text-xs">
                    <RefreshCw className="h-3 w-3" />
                    <span>Auto-actualización</span>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(148, 163, 184, 0.5);
                    border-radius: 2px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(148, 163, 184, 0.8);
                }
            `}</style>
        </div>
    );
}
