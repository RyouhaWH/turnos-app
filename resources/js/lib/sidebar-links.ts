import { type NavItem } from '@/types';
import { Folder, LayoutGrid, Calendar1, Settings, Calendar, MessageSquare, MapPin, Truck, ClipboardList } from 'lucide-react';


const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Turnos',
        href: '/turnos',
        icon: Calendar1,
    },
    {
        title: 'Mi Calendario',
        href: '/turno-mensual',
        icon: Calendar,
    },
    {
        title: 'Asignaciones',
        href: '/assignments',
        icon: ClipboardList,
        supervisorOnly: true,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Subir turnos',
        href: '/upload-csv',
        icon: Folder,
    },
    {
        title: 'Datos de Plataforma',
        href: '/platform-data',
        icon: Settings,
        adminOnly: true,
    },
    {
        title: 'Sectores',
        href: '/platform-data/sectors',
        icon: MapPin,
        adminOnly: true,
    },
    {
        title: 'Vehículos',
        href: '/platform-data/vehicles',
        icon: Truck,
        adminOnly: true,
    },
    {
        title: 'Notificaciones WhatsApp',
        href: '/admin/whatsapp-recipients',
        icon: MessageSquare,
        adminOnly: true,
    },
];

export { mainNavItems, footerNavItems }
