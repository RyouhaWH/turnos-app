import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { Button } from '@/components/ui/button';
import { MobileNavigationDrawer } from '@/components/ui/mobile-navigation-drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';
import { usePage } from '@inertiajs/react';

export default function AppSidebarLayout({ children, breadcrumbs = []}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const isMobile = useIsMobile();
    const { props } = usePage();

    // Obtener el nombre de la página desde el breadcrumb o props
    const pageTitle = breadcrumbs.length > 0
        ? breadcrumbs[breadcrumbs.length - 1]?.title || 'Página'
        : (props as any)?.title || 'Turnos App';

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />

                {/* Barra superior móvil */}
                {isMobile && (
                    <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 dark:bg-slate-900/95 dark:border-slate-700">
                        <div className="flex items-center justify-between h-14 px-4">
                            {/* Título de la página */}
                            <h1 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                                {pageTitle}
                            </h1>

                            {/* Botón de menú */}
                            <MobileNavigationDrawer>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    title="Menú de navegación"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </MobileNavigationDrawer>
                        </div>
                    </div>
                )}

                {/* Contenido con padding superior en móvil */}
                <div className={isMobile ? 'pt-14' : ''}>
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
