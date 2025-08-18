import { type NavItem } from '@/types';
import { BookOpen, Folder, LayoutGrid, Calendar1, UserCheck2, Settings} from 'lucide-react';


const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },

    {
        title: 'Turnos',
        href: route('shifts'),
        icon: Calendar1,
    },
    // {
    //     title: 'Personal',
    //     href: route('staff-personal'),
    //     icon: UserCheck2,
    // },
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
        adminOnly: true, // Solo visible para administradores
    },

    // {
    //     title: 'Documentation',
    //     href: '',
    //     icon: BookOpen,
    // },

];

export { mainNavItems, footerNavItems}
