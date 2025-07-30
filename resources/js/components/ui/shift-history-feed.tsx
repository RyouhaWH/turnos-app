import { useEffect, useState } from 'react';

interface LogItem {
    old_shift: string;
    new_shift: string;
    comment: string | null;
    changed_at: string;
    changed_by: string;
    empleado: string;
}

export default function ShiftHistoryFeed() {
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch('/api/shift-change-log');
                const data = await res.json();
                setLogs(data);
            } catch (error) {
                console.error('Error al cargar historial:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    return (
        <div className="p-4 border rounded-lg shadow-md max-h-[calc(100vh-5rem)] overflow-y-auto w-full bg-white dark:bg-gray-900">
            <h2 className="text-lg font-bold mb-4 text-center">🕓 Últimos cambios</h2>
            {loading ? (
                <p className="text-sm text-gray-500 text-center">Cargando historial...</p>
            ) : logs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">No hay cambios registrados.</p>
            ) : (
                <ul className="space-y-3">
                    {logs.map((log, index) => (
                        <li key={index} className="border-b pb-2">
                            <div className="text-sm text-gray-700 dark:text-gray-200">
                                <strong className="text-indigo-600">{log.changed_by}</strong>
                                cambió el turno de
                                <span> {log.empleado}</span>
                                <span className="text-red-500 font-semibold mx-1">{log.old_shift}</span>
                                a
                                <span className="text-green-600 font-semibold mx-1">{log.new_shift}</span>
                            </div>
                            {log.comment && (
                                <div className="text-xs italic text-gray-500 dark:text-gray-400 mt-1">
                                    “{log.comment}”
                                </div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                                {new Date(log.changed_at).toLocaleString()}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
