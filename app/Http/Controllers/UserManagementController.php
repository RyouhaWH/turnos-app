<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller
{
    /**
     * Mostrar la lista de usuarios
     */
    public function index()
    {
        $users = User::with('roles')->get();
        $roles = Role::all();

        // Obtener roles operativos con colores
        $operationalRoles = \App\Models\Rol::where('is_operational', true)->get();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'roles' => $operationalRoles // Usar roles operativos con colores
        ]);
    }

    /**
     * Crear un nuevo usuario
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|exists:roles,id'
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // Asignar el rol de aplicación usando Spatie Permission
        $role = Role::find($request->role);
        if ($role) {
            $user->assignRole($role);
        }

        return back()->with('success', 'Usuario creado exitosamente');
    }

    /**
     * Actualizar los roles de un usuario
     */
    public function updateRole(Request $request, User $user)
    {
        $request->validate([
            'roles' => 'required|array',
            'roles.*' => 'exists:roles,id'
        ]);

        // Obtener los roles de aplicación seleccionados
        $roleIds = $request->roles;
        $roles = Role::whereIn('id', $roleIds)->get();

        // Sincronizar roles (reemplaza todos los roles existentes)
        $user->syncRoles($roles);

        return back()->with('success', 'Rol actualizado exitosamente');
    }

    /**
     * Eliminar un usuario
     */
    public function destroy(User $user)
    {
        // No permitir eliminar el usuario actual
        if ($user->id === request()->user()->id) {
            return back()->with('error', 'No puedes eliminar tu propia cuenta');
        }

        $user->delete();

        return back()->with('success', 'Usuario eliminado exitosamente');
    }
}
