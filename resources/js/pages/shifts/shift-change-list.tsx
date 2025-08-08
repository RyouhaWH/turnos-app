// Updated ListaCambios component (shift-change-list.tsx)
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save, Trash2, Edit, Calendar, User, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface ListaCambiosProps {
    cambios: Record<string, Record<string, string>>;
    onActualizar: (comentario: string) => void;
    isProcesing: boolean;
    isCollapsed?: boolean;
}

export default function ListaCambios({ cambios, onActualizar, isProcesing, isCollapsed }: ListaCambiosProps) {
    const [comentario, setComentario] = useState('');

    const totalCambios = Object.values(cambios).reduce((acc, fechas) => acc + Object.keys(fechas).length, 0);
    const totalEmpleados = Object.keys(cambios).length;

    // Separate deletions from updates
    const getChangeType = (turno: string) => {
        if (turno === '__DELETE__' || !turno) return 'delete';
        return 'update';
    };

    const formatEmployeeName = (key: string) => {
        return key.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T12:00:00'); // Add time to avoid timezone issues
        return date.toLocaleDateString('es-CL', {
            day: '2-digit',
            month: 'short'
        });
    };

    if (totalCambios === 0) {
        return (
            <CardContent className="py-8">
                <div className="text-center text-slate-500 dark:text-slate-400">
                    <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No hay cambios pendientes</p>
                    <p className="text-xs mt-1">Edita las celdas en la tabla para ver los cambios aquí</p>
                </div>
            </CardContent>
        );
    }

    return (
        <CardContent className="p-4">
            {/* Summary Stats */}
            <div className="flex gap-2 mb-3">
                <Badge variant="outline" className="text-xs">
                    <User className="h-3 w-3 mr-1" />
                    {totalEmpleados} {totalEmpleados === 1 ? 'empleado' : 'empleados'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {totalCambios} {totalCambios === 1 ? 'cambio' : 'cambios'}
                </Badge>
            </div>

            {/* Changes List */}
            <ScrollArea className="h-[200px] mb-3">
                <div className="space-y-2">
                    {Object.entries(cambios).map(([empleado, fechas]) => (
                        <Card key={empleado} className="p-3 bg-slate-50 dark:bg-slate-800/50">
                            <div className="space-y-1">
                                <div className="font-medium text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                    <User className="h-3 w-3 text-slate-500" />
                                    {formatEmployeeName(empleado)}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {Object.entries(fechas).map(([fecha, turno]) => {
                                        const changeType = getChangeType(turno);
                                        const isDelete = changeType === 'delete';

                                        return (
                                            <Badge
                                                key={fecha}
                                                variant={isDelete ? "destructive" : "secondary"}
                                                className="text-xs px-2 py-0.5"
                                            >
                                                {isDelete ? (
                                                    <>
                                                        <Trash2 className="h-3 w-3 mr-1" />
                                                        {formatDate(fecha)}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Edit className="h-3 w-3 mr-1" />
                                                        {formatDate(fecha)}: {turno}
                                                    </>
                                                )}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </ScrollArea>

            {/* Comment Section */}
            <div className="space-y-2">
                <Textarea
                    placeholder="Agregar comentario (opcional)..."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    className="min-h-[60px] text-sm resize-none"
                />

                {/* Action Button */}
                <Button
                    onClick={() => onActualizar(comentario)}
                    disabled={isProcesing || totalCambios === 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                    {isProcesing ? (
                        <>
                            <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Guardar {totalCambios} {totalCambios === 1 ? 'Cambio' : 'Cambios'}
                        </>
                    )}
                </Button>
            </div>
        </CardContent>
    );
}
