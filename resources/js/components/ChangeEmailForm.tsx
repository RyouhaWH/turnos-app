import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import InputError from '@/components/input-error';

interface User {
    id: number;
    name: string;
    email: string;
}

interface ChangeEmailFormProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
}

export default function ChangeEmailForm({ user, isOpen, onClose }: ChangeEmailFormProps) {
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        email: user.email,
    });

    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        clearErrors();
        setSuccess(null);

        put(route('administration.users.change-email', user.id), {
            onSuccess: () => {
                setSuccess(`Email actualizado correctamente para ${user.name}`);
                setTimeout(() => {
                    setSuccess(null);
                    onClose();
                }, 2000);
            },
            onError: (errors) => {
                console.error('Error al cambiar email:', errors);
            },
        });
    };

    const handleClose = () => {
        reset();
        clearErrors();
        setSuccess(null);
        setData('email', user.email); // Resetear al email original
        onClose();
    };

    const hasChanges = data.email !== user.email && data.email.trim() !== '';

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Cambiar Email
                    </DialogTitle>
                    <DialogDescription>
                        Cambiar el email para <strong>{user.name}</strong>
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
                        <Label htmlFor="current-email">Email Actual</Label>
                        <Input
                            id="current-email"
                            type="email"
                            value={user.email}
                            disabled
                            className="bg-muted"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Nuevo Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="Ingresa el nuevo email"
                            disabled={processing}
                            required
                        />
                        <InputError message={errors.email} />
                    </div>

                    {errors.email && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                                {errors.email}
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
                            disabled={processing || !hasChanges}
                        >
                            {processing ? 'Cambiando...' : 'Cambiar Email'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
