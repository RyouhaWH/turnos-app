import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <h1>Hola mundo</h1>
                <p>WIP de selector de funcionario</p>
                <Button asChild>
                    <Link href={route('create-shifts', {
                        id: 1
                    })} as="button">
                        Turnos Alerta Móvil
                    </Link>
                </Button>
                <Button asChild>
                    <Link href={route('create-shifts', {
                        id: 2
                    })} as="button">
                        Turnos Fiscalización
                    </Link>
                </Button>
                <Button asChild>
                    <Link href={route('create-shifts', {
                        id: 3
                    })} as="button">
                        Turnos Personal Motorizado
                    </Link>
                </Button>
                <Button asChild>
                    <Link href={route('upload-shift-file')} as="button">
                        Ingresar turnos
                    </Link>
                </Button>
                <Button asChild>
                    <Link href={route('test-shifts-history', {
                        employeeId: 3
                    })} as="button">
                        Historial de cambios
                    </Link>
                </Button>
            </div>
        </AppLayout>
    );
}
