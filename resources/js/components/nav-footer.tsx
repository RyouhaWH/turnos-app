import { Icon } from '@/components/icon';
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { type ComponentPropsWithoutRef } from 'react';
import { usePage } from '@inertiajs/react';

export function NavFooter({
    items,
    className,
    ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
}) {
    const { props: pageProps } = usePage<{ auth: { user: any } }>();
    const user = pageProps.auth?.user;

    // Verificar si el usuario tiene permisos de administrador
    const hasAdminPermissions = user?.roles?.some((role: any) =>
        role.name === 'Administrador'
    ) || false;

    // Filtrar elementos según permisos
    const filteredItems = items.filter((item) => {
        // Si el elemento es solo para administradores, verificar permisos
        if (item.adminOnly) {
            return hasAdminPermissions;
        }
        // Si es "Subir turnos", solo mostrar a administradores
        if (item.title === 'Subir turnos') {
            return hasAdminPermissions;
        }
        // Para otros elementos, mostrar a todos
        return true;
    });

    return (
        <SidebarGroup {...props} className={`group-data-[collapsible=icon]:p-0 ${className || ''}`}>
            <SidebarGroupContent>
                <SidebarMenu>
                    {filteredItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                className="text-neutral-600 hover:text-neutral-800 dark:text-slate-200 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                            >
                                <a href={item.href}>
                                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                    <span>{item.title}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
