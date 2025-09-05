import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Home, FileSpreadsheet, Users, Settings, LogOut } from 'lucide-react';
import React from 'react';

interface MobileNavigationDrawerProps {
    children: React.ReactNode;
    className?: string;
}

export const MobileNavigationDrawer: React.FC<MobileNavigationDrawerProps> = ({
    children,
    className,
}) => {
    const navigationItems = [
        { label: 'Dashboard', href: '/dashboard', icon: Home },
        { label: 'Turnos', href: '/shifts', icon: FileSpreadsheet },
        { label: 'Empleados', href: '/employees', icon: Users },
        { label: 'Configuración', href: '/settings', icon: Settings },
    ];

    return (
        <Sheet>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="p-6 border-b">
                    <SheetTitle className="text-left text-lg font-semibold">
                        Navegación
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col p-4 space-y-2">
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Button
                                key={item.href}
                                variant="ghost"
                                className="justify-start gap-3 h-12 text-left"
                                onClick={() => {
                                    // Aquí podrías usar Inertia.js para navegar
                                    window.location.href = item.href;
                                }}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </Button>
                        );
                    })}

                    <div className="border-t pt-4 mt-4">
                        <Button
                            variant="ghost"
                            className="justify-start gap-3 h-12 text-left text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                                // Aquí podrías implementar logout
                                console.log('Logout');
                            }}
                        >
                            <LogOut className="h-5 w-5" />
                            Cerrar Sesión
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
