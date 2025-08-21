import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Shield } from 'lucide-react';

type Role = { id: number; nombre: string; color?: string; is_operational: boolean };
type User = { id: number; name: string; email: string; created_at: string; roles: string[] };

type PageProps = {
  users: User[];
  roles: Role[];
};

export default function UsersIndex() {
  const { props } = usePage<PageProps>();
  const roles = props.roles ?? [];
  const users = props.users ?? [];

  const createForm = useForm({
    name: '',
    email: '',
    password: '',
    role: roles[0]?.id ?? '',
  });

  const [assigning, setAssigning] = useState<Record<number, number>>({});

  // Función para obtener el color del rol
  const getRoleColor = (roleName: string) => {
    const role = roles.find(r => r.nombre === roleName);
    return role?.color || '#3B82F6'; // Color por defecto azul
  };

  // Función para obtener las clases CSS del badge según el color
  const getRoleBadgeClasses = (roleName: string) => {
    const color = getRoleColor(roleName);

    // Mapeo de colores hex a clases de Tailwind
    const colorMap: Record<string, string> = {
      '#3B82F6': 'bg-blue-100 text-blue-800 border-blue-200',
      '#EF4444': 'bg-red-100 text-red-800 border-red-200',
      '#10B981': 'bg-emerald-100 text-emerald-800 border-emerald-200',
      '#F59E0B': 'bg-amber-100 text-amber-800 border-amber-200',
      '#8B5CF6': 'bg-purple-100 text-purple-800 border-purple-200',
      '#06B6D4': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      '#EC4899': 'bg-pink-100 text-pink-800 border-pink-200',
      '#F97316': 'bg-orange-100 text-orange-800 border-orange-200',
      '#6366F1': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      '#84CC16': 'bg-lime-100 text-lime-800 border-lime-200'
    };

    return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post(route('user-management.store'), {
      onSuccess: () => {
        createForm.reset();
      },
    });
  };

  const handleAssign = (userId: number) => {
    const roleId = assigning[userId];
    if (!roleId) return;

    createForm.transform(() => ({ role: roleId })).patch(route('user-management.update-role', userId), {
      onSuccess: () => {
        setAssigning(prev => {
          const newState = { ...prev };
          delete newState[userId];
          return newState;
        });
      },
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <Head title="Gestión de usuarios" />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <Users className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra usuarios y sus roles en el sistema</p>
        </div>
      </div>

      {/* Formulario de creación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Crear nuevo usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={createForm.data.name}
                onChange={(e) => createForm.setData('name', e.target.value)}
                required
                placeholder="Juan Pérez"
              />
              {createForm.errors.name && (
                <p className="text-sm text-red-600 mt-1">{createForm.errors.name}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={createForm.data.email}
                onChange={(e) => createForm.setData('email', e.target.value)}
                required
                placeholder="juan@ejemplo.com"
              />
              {createForm.errors.email && (
                <p className="text-sm text-red-600 mt-1">{createForm.errors.email}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={createForm.data.password}
                onChange={(e) => createForm.setData('password', e.target.value)}
                required
                placeholder="Mínimo 8 caracteres"
              />
              {createForm.errors.password && (
                <p className="text-sm text-red-600 mt-1">{createForm.errors.password}</p>
              )}
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={createForm.data.role} onValueChange={(v) => createForm.setData('role', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: r.color || '#3B82F6' }}
                        ></div>
                        {r.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {createForm.errors.role && (
                <p className="text-sm text-red-600 mt-1">{createForm.errors.role}</p>
              )}
            </div>
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" disabled={createForm.processing} className="flex items-center gap-2">
                {createForm.processing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Crear usuario
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      {/* Lista de usuarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Usuarios del sistema ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay usuarios registrados</p>
            ) : (
              users.map((user) => (
                <div key={user.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Creado: {user.created_at}
                  </div>
                  <div className="flex gap-1">
                    {user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <Badge
                          key={role}
                          variant="outline"
                          className={`text-xs border ${getRoleBadgeClasses(role)}`}
                          style={{
                            backgroundColor: getRoleColor(role) + '20',
                            borderColor: getRoleColor(role) + '40'
                          }}
                        >
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Sin rol
                      </Badge>
                    )}
                  </div>
                  <div>
                    <Select
                      value={assigning[user.id] ?? ''}
                      onValueChange={(v) => setAssigning((s) => ({ ...s, [user.id]: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Asignar rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: r.color || '#3B82F6' }}
                              ></div>
                              {r.nombre}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAssign(user.id)}
                      disabled={!assigning[user.id]}
                    >
                      Guardar
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


