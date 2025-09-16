import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import { ShiftType } from '@/types/shift';

interface MobileShiftFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    shiftTypes: ShiftType[];
    selectedShiftTypes: string[];
    onShiftTypeToggle: (shiftTypeId: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
}

export const MobileShiftFilterModal: React.FC<MobileShiftFilterModalProps> = ({
    isOpen,
    onClose,
    shiftTypes,
    selectedShiftTypes,
    onShiftTypeToggle,
    onSelectAll,
    onDeselectAll,
}) => {
    const activeFiltersCount = shiftTypes.length - selectedShiftTypes.length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md mx-auto max-h-[80vh] overflow-hidden flex flex-col w-[calc(100vw-2rem)]">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-orange-600" />
                        Filtrar Turnos
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Resumen de filtros activos */}
                    {activeFiltersCount > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-orange-800">
                                    {activeFiltersCount} tipo{activeFiltersCount !== 1 ? 's' : ''} oculto{activeFiltersCount !== 1 ? 's' : ''}
                                </span>
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                    {selectedShiftTypes.length}/{shiftTypes.length} visibles
                                </Badge>
                            </div>
                        </div>
                    )}

                    {/* Botones de acción rápida */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onSelectAll}
                            className="flex-1"
                        >
                            Mostrar Todos
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onDeselectAll}
                            className="flex-1"
                        >
                            Ocultar Todos
                        </Button>
                    </div>

                    {/* Lista de tipos de turno */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-700 mb-3">
                            Tipos de Turno
                        </h4>
                        {shiftTypes.map((shiftType) => {
                            // Para grupos, verificar si todos sus códigos están seleccionados
                            const isSelected = shiftType.isGroup && shiftType.codes
                                ? shiftType.codes.every(code => selectedShiftTypes.includes(code))
                                : selectedShiftTypes.includes(shiftType.code);
                            return (
                                <div
                                    key={shiftType.code}
                                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                                        isSelected
                                            ? 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                                            : 'bg-slate-50 border-slate-100 dark:bg-slate-800 dark:border-slate-700'
                                    }`}
                                >
                                    <Checkbox
                                        id={`shift-type-${shiftType.code}`}
                                        checked={isSelected}
                                        onCheckedChange={() => onShiftTypeToggle(shiftType.code)}
                                        className="dark:bg-slate-600 dark:border-slate-500 dark:text-slate-50"
                                    />
                                    <label
                                        htmlFor={`shift-type-${shiftType.code}`}
                                        className="flex-1 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded-full border-2"
                                                style={{
                                                    backgroundColor: shiftType.color,
                                                    borderColor: shiftType.color,
                                                }}
                                            />
                                            <span
                                                className={`font-medium ${
                                                    isSelected ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
                                                }`}
                                            >
                                                {shiftType.name}
                                            </span>
                                        </div>
                                        {shiftType.description && (
                                            <p
                                                className={`text-xs mt-1 ${
                                                    isSelected ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'
                                                }`}
                                            >
                                                {shiftType.description}
                                            </p>
                                        )}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer con botón de cerrar */}
                <div className="flex-shrink-0 pt-4 border-t">
                    <Button
                        onClick={onClose}
                        className="w-full dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600 dark:hover:text-slate-100 dark:border-slate-600 dark:hover:border-slate-600"
                        variant="default"
                    >
                        Aplicar Filtros
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
