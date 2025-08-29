import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, CheckCircle, AlertCircle } from 'lucide-react';

interface CreateUserProps {
  roles?: Array<{ id: number; name: string }>;
}

export default function CreateUser({ roles = [] }: CreateUserProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    }

    if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Las contraseñas no coinciden';
    }

    if (!formData.role) {
      newErrors.role = 'El rol es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSuccess(false);

    try {
      await router.post('/settings/administration/users', formData, {
        onSuccess: () => {
          setSuccess(true);
          setFormData({
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            role: ''
          });
          setErrors({});
        },
        onError: (errors) => {
          setErrors(errors);
        },
        onFinish: () => {
          setIsSubmitting(false);
        }
      });
    } catch (error) {
      setIsSubmitting(false);
      console.error('Error creating user:', error);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <UserPlus className="h-5 w-5" />
          Crear Nuevo Usuario
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Completa el formulario para crear un nuevo usuario en el sistema
        </p>
      </div>

      <div>
        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Usuario creado exitosamente
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre */}
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre completo</Label>
            <Input
              id="name"
              type="text"
              className="mt-1 block w-full"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              autoComplete="name"
              placeholder="Ingresa el nombre completo"
            />
            {errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              className="mt-1 block w-full"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              autoComplete="username"
              placeholder="usuario@ejemplo.com"
            />
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              className="mt-1 block w-full"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              required
              placeholder="Mínimo 8 caracteres"
            />
            {errors.password && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirmar Contraseña */}
          <div className="grid gap-2">
            <Label htmlFor="password_confirmation">Confirmar Contraseña</Label>
            <Input
              id="password_confirmation"
              type="password"
              className="mt-1 block w-full"
              value={formData.password_confirmation}
              onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
              required
              placeholder="Repite la contraseña"
            />
            {errors.password_confirmation && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password_confirmation}
              </p>
            )}
          </div>

          {/* Rol */}
          <div className="grid gap-2">
            <Label htmlFor="role">Rol</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
            >
              <SelectTrigger className="mt-1 block w-full">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.role}
              </p>
            )}
          </div>

          {/* Botón Submit */}
          <div className="flex items-center gap-4">
            <Button disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando usuario...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Crear Usuario
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
