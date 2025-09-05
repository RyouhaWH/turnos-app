import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import React from 'react';

interface MobileFABProps {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
    variant?: 'default' | 'secondary' | 'outline';
    size?: 'sm' | 'default' | 'lg';
    disabled?: boolean;
    title?: string;
}

export const MobileFAB: React.FC<MobileFABProps> = ({
    children,
    onClick,
    className,
    variant = 'default',
    size = 'default',
    disabled = false,
    title,
}) => {
    return (
        <Button
            onClick={onClick}
            variant={variant}
            size={size}
            disabled={disabled}
            title={title}
            className={cn(
                'fixed bottom-4 right-4 z-50 rounded-full shadow-lg hover:shadow-xl transition-all duration-300',
                'h-12 w-12 p-0 flex items-center justify-center',
                'md:hidden', // Solo visible en móvil
                className
            )}
        >
            {children}
        </Button>
    );
};

interface MobileFABGroupProps {
    children: React.ReactNode;
    className?: string;
}

export const MobileFABGroup: React.FC<MobileFABGroupProps> = ({
    children,
    className,
}) => {
    return (
        <div
            className={cn(
                'fixed bottom-4 right-4 z-50 flex flex-col gap-2',
                'md:hidden', // Solo visible en móvil
                className
            )}
        >
            {children}
        </div>
    );
};
