import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { useState } from 'react';
import { toast, Toaster } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sube tu turno en csv',
        href: '/import-shifts',
    },
];

export default function UploadShifts() {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpload = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append('archivo', file);
        setIsLoading(true);

        try {
            const response = await axios.post('import-shifts-csv', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Turnos importados correctamente');
            console.log(response.data);
        } catch (error) {
            console.error(error);
            toast.error('Error al importar los turnos');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="flex items-end gap-4 rounded border p-4 shadow-sm">
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="archivo">Archivo CSV</Label>
                        <Input id="archivo" type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </div>
                    <Button onClick={handleUpload} disabled={!file || isLoading}>
                        {isLoading ? 'Importando...' : 'Importar'}
                    </Button>
                </div>
            </div>
            <Toaster />
        </AppLayout>
    );
}
