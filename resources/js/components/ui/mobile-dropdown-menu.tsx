import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ChevronUp, Eye, Users, Calendar, Undo2, Save, Loader2 } from 'lucide-react';
import React, { useState } from 'react';

interface MobileDropdownMenuProps {
    onShowSummary: () => void;
    onShowEmployees: () => void;
    onShowDatePicker: () => void;
    onUndo: () => void;
    onApplyChanges: () => void;
    changeCount: number;
    employeeCount: number;
    availableCount: number;
    currentMonthTitle: string;
    canUndo: boolean;
    isProcessingChanges: boolean;
    isSaving: boolean;
    className?: string;
}

export const MobileDropdownMenu: React.FC<MobileDropdownMenuProps> = ({
    onShowSummary,
    onShowEmployees,
    onShowDatePicker,
    onUndo,
    onApplyChanges,
    changeCount,
    employeeCount,
    availableCount,
    currentMonthTitle,
    canUndo,
    isProcessingChanges,
    isSaving,
    className,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-2 right-4 z-50 md:hidden">
            {/* FAB vacío - el botón de guardar ahora está en el header */}
        </div>
    );
};
