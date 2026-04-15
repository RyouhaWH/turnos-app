import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage<{ auth: { user: any } }>();
    const user = page.props.auth?.user;

    const isAdmin = user?.roles?.some((r: any) => r.name === 'Administrador') ?? false;
    const isSupervisor = isAdmin || (user?.roles?.some((r: any) => r.name === 'Supervisor') ?? false);

    const visibleItems = items.filter((item) => {
        if (item.adminOnly) return isAdmin;
        if (item.supervisorOnly) return isSupervisor;
        return true;
    });

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={page.url.startsWith(item.href)} tooltip={{ children: item.title }}>
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
