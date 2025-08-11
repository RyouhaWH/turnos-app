import { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

type Role = { id: number; name: string };
type User = { id: number; name: string; email: string; roles: string[] };

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
    role: roles[0]?.name ?? '',
  });

  const [assigning, setAssigning] = useState<Record<number, string>>({});

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createForm.post(route('user-management.store'));
  };

  const handleAssign = (userId: number) => {
    const role = assigning[userId];
    if (!role) return;
    createForm.transform(() => ({ role })).patch(route('user-management.update-role', userId));
  };

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Head title="Gestión de usuarios" />

      <Card>
        <CardHeader>
          <CardTitle>Crear usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={createForm.data.name} onChange={(e) => createForm.setData('name', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={createForm.data.email} onChange={(e) => createForm.setData('email', e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" value={createForm.data.password} onChange={(e) => createForm.setData('password', e.target.value)} required />
            </div>
            <div>
              <Label>Rol</Label>
              <Select value={createForm.data.role} onValueChange={(v) => createForm.setData('role', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" disabled={createForm.processing}>Crear</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((u) => (
              <div key={u.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                <div className="font-medium">{u.name}</div>
                <div className="text-sm text-muted-foreground">{u.email}</div>
                <div className="text-sm">{u.roles.join(', ') || 'Sin rol'}</div>
                <div>
                  <Select value={assigning[u.id] ?? ''} onValueChange={(v) => setAssigning((s) => ({ ...s, [u.id]: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Asignar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button variant="secondary" onClick={() => handleAssign(u.id)}>Guardar</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


