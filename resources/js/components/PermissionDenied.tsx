import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';

interface PermissionDeniedProps {
    message?: string;
}

export default function PermissionDenied({ message = 'No tienes permisos de administrador para acceder a esta función.' }: PermissionDeniedProps) {
    const handleGoBack = () => {
        router.visit('/dashboard');
    };

    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <Shield className="h-8 w-8 text-red-600" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                        Acceso Denegado
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        No tienes los permisos necesarios para acceder a esta página
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert className="border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            {message}
                        </AlertDescription>
                    </Alert>

                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={handleGoBack}
                            className="w-full"
                            variant="outline"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver al Dashboard
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
