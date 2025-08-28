import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, AlertCircle, CheckCircle } from 'lucide-react';
import InputError from '@/components/input-error';

interface User {
    id: number;
    name: string;
    email: string;
}

interface ChangePasswordFormProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
}

export default function ChangePasswordForm({ user, isOpen, onClose }: ChangePasswordFormProps) {
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        password: '',
        password_confirmation: '',
    });

    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();
        setSuccess(null);

        put(route('administration.users.change-password', user.id), {
            onSuccess: () => {
                setSuccess(`Contraseña actualizada correctamente para ${user.name}`);
                reset();
                setTimeout(() => {
                    setSuccess(null);
                    onClose();
                }, 2000);
            },
            onError: (errors) => {
                console.error('Error al cambiar contraseña:', errors);
            },
        });
    };

    const handleClose = () => {
        reset();
        clearErrors();
        setSuccess(null);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Cambiar Contraseña
                    </DialogTitle>
                    <DialogDescription>
                        Cambiar la contraseña para <strong>{user.name}</strong> ({user.email})
                    </DialogDescription>
                </DialogHeader>

                {success && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            {success}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="password">Nueva Contraseña</Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Ingresa la nueva contraseña"
                            disabled={processing}
                            required
                        />
                        <InputError message={errors.password} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password_confirmation">Confirmar Contraseña</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="Confirma la nueva contraseña"
                            disabled={processing}
                            required
                        />
                        <InputError message={errors.password_confirmation} />
                    </div>

                    {errors.password && !errors.password_confirmation && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                                {errors.password}
                            </AlertDescription>
                        </Alert>
                    )}

                    <DialogFooter className="gap-2">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleClose}
                            disabled={processing}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={processing || !data.password || !data.password_confirmation}
                        >
                            {processing ? 'Cambiando...' : 'Cambiar Contraseña'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
