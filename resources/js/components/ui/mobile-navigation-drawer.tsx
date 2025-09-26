import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Home, FileSpreadsheet, User, Key, Palette, LogOut } from 'lucide-react';
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
        { label: 'Turnos', href: '/turnos', icon: FileSpreadsheet },
    ];

    const userSettingsItems = [
        { label: 'Mi Perfil', href: '/settings/profile', icon: User },
        { label: 'Cambiar Contraseña', href: '/settings/password', icon: Key },
        { label: 'Apariencia', href: '/settings/appearance', icon: Palette },
    ];

    return (
        <Sheet>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 mobile-animation-fix" style={{ transformOrigin: 'left center' }}>
                <SheetHeader className="p-6 border-b">
                    <SheetTitle className="text-left text-lg font-semibold">
                        Navegación
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col p-4 space-y-2">
                    {/* Navegación principal */}
                    {navigationItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Button
                                key={item.href}
                                variant="ghost"
                                className="justify-start gap-3 h-12 text-left text-slate-700 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-700/50 transition-colors duration-200"
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

                    {/* Separador */}
                    <div className="border-t pt-4 mt-4">
                        <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3 px-3">Configuración de Usuario</h3>

                        {/* Configuración de usuario */}
                        {userSettingsItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Button
                                    key={item.href}
                                    variant="ghost"
                                    className="justify-start gap-3 h-12 text-left text-slate-700 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-700/50 transition-colors duration-200"
                                    onClick={() => {
                                        window.location.href = item.href;
                                    }}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.label}
                                </Button>
                            );
                        })}
                    </div>

                    {/* Cerrar sesión */}
                    <div className="border-t pt-4 mt-4">
                        <Button
                            variant="ghost"
                            className="justify-start gap-3 h-12 text-left text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20 transition-colors duration-200"
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
