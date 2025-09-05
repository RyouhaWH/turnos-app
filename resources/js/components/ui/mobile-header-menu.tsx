import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { MoreVertical, Eye, Users, Calendar, History } from 'lucide-react';
import React, { useState } from 'react';

interface MobileHeaderMenuProps {
    onShowSummary: () => void;
    onShowEmployees: () => void;
    onShowDatePicker: () => void;
    onShowHistory: () => void;
    changeCount: number;
    employeeCount: number;
    availableCount: number;
    currentMonthTitle: string;
    className?: string;
}

export const MobileHeaderMenu: React.FC<MobileHeaderMenuProps> = ({
    onShowSummary,
    onShowEmployees,
    onShowDatePicker,
    onShowHistory,
    changeCount,
    employeeCount,
    availableCount,
    currentMonthTitle,
    className,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        'h-8 w-8 p-0 flex items-center justify-center',
                        'bg-transparent border-none shadow-none text-slate-700 hover:bg-slate-100',
                        className
                    )}
                    title="Menú de opciones"
                >
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                side="bottom"
                align="end"
                className="w-64 p-2 mt-2 bg-white border-slate-200 shadow-xl antialiased"
            >
                <div className="space-y-1">
                    {/* Opción: Selector de fecha */}
                    <div
                        onClick={() => {
                            onShowDatePicker();
                            setIsOpen(false);
                        }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors"
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100">
                            <Calendar className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-900 antialiased">Cambiar Fecha</span>
                            <span className="text-xs text-slate-500 antialiased">{currentMonthTitle}</span>
                        </div>
                    </div>

                    {/* Opción: Ver resumen de cambios */}
                    {changeCount > 0 && (
                        <div
                            onClick={() => {
                                onShowSummary();
                                setIsOpen(false);
                            }}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                                <Eye className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-slate-900 antialiased">Ver Resumen</span>
                                <span className="text-xs text-slate-500 antialiased">{changeCount} cambio{changeCount !== 1 ? 's' : ''} pendiente{changeCount !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    )}

                    {/* Opción: Ver historial de cambios */}
                    <div
                        onClick={() => {
                            onShowHistory();
                            setIsOpen(false);
                        }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors"
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100">
                            <History className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-900 antialiased">Ver Historial</span>
                            <span className="text-xs text-slate-500 antialiased">Todos los cambios realizados</span>
                        </div>
                    </div>

                    {/* Opción: Gestionar empleados */}
                    <div
                        onClick={() => {
                            onShowEmployees();
                            setIsOpen(false);
                        }}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 cursor-pointer transition-colors"
                    >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
                            <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-slate-900 antialiased">Gestionar Empleados</span>
                            <span className="text-xs text-slate-500 antialiased">{employeeCount} en grid • {availableCount} disponibles</span>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};
