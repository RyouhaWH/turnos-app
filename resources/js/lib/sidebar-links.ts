import { type NavItem } from '@/types';
import { BookOpen, Folder, LayoutGrid, Calendar1, UserCheck2} from 'lucide-react';


const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Turnos',
        href: route('create-shifts'),
        icon: Calendar1,
    },
    {
        title: 'Personal',
        href: route('staff-personal'),
        icon: UserCheck2,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },

];

export { mainNavItems, footerNavItems}
