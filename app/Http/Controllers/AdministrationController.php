<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class AdministrationController extends Controller
{
    /**
     * Mostrar la página de administración
     */
    public function index()
    {
        $users = User::with('roles')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name
                    ];
                })
            ];
        });

        $roles = Role::all()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name
            ];
        });

        return Inertia::render('settings/administration', [
            'users' => $users,
            'roles' => $roles,
            'error' => session('error'),
            'auth' => [
                'user' => [
                    'id' => Auth::user()->id,
                    'name' => Auth::user()->name,
                    'email' => Auth::user()->email,
                    'roles' => Auth::user()->roles->map(function ($role) {
                        return [
                            'id' => $role->id,
                            'name' => $role->name
                        ];
                    })
                ]
            ]
        ]);
    }

    /**
     * Cambiar la contraseña de un usuario
     */
    public function changePassword(Request $request, User $user)
    {
        $request->validate([
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Actualizar la contraseña
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return back()->with('success', 'Contraseña actualizada correctamente para ' . $user->name);
    }

    /**
     * Cambiar el email de un usuario
     */
    public function changeEmail(Request $request, User $user)
    {
        $request->validate([
            'email' => ['required', 'email', 'unique:users,email,' . $user->id],
        ]);

        // Actualizar el email
        $user->update([
            'email' => $request->email,
        ]);

        return back()->with('success', 'Email actualizado correctamente para ' . $user->name);
    }

    /**
     * Crear un nuevo usuario
     */
    public function createUser(Request $request)
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
    public function updateUserRole(Request $request, User $user)
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
}
