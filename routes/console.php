<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Models\User;
use Spatie\Permission\Models\Role;
use App\Http\Controllers\AdministrationController;
use Illuminate\Support\Facades\Auth;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('user:make-admin {email?} {--first}', function (?string $email = null) {
    if ($this->option('first')) {
        $user = User::first();
        if (! $user) {
            $this->error('No users found in the database.');
            return;
        }
    } elseif ($email) {
        $user = User::where('email', $email)->first();
        if (! $user) {
            $this->error("User with email {$email} not found.");
            return;
        }
    } else {
        $this->error('Please provide an email or use the --first option.');
        return;
    }

    $adminRole = Role::firstOrCreate(['name' => 'Administrador']);
    $user->assignRole($adminRole);
    $this->info("Usuario {$user->email} ahora tiene el rol Administrador.");
})->purpose('Assigns the Administrator role to a user or the first user.');

Artisan::command('user:check-roles', function () {
    $users = User::with('roles')->get();

    $this->info('Usuarios y sus roles:');
    $this->info('==================');

    foreach ($users as $user) {
        $roles = $user->roles->pluck('name')->join(', ') ?: 'Sin roles';
        $this->line("{$user->name} ({$user->email}) - Roles: {$roles}");
    }
})->purpose('Check all users and their roles.');

Artisan::command('admin:test-controller', function () {
    try {
        $users = User::with('roles')->get();
        $roles = Role::all();

        $this->info('Controlador funcionando correctamente');
        $this->info('Datos que se pasan a la vista:');
        $this->line('Usuarios: ' . $users->count());
        $this->line('Roles: ' . $roles->count());

        foreach ($users as $user) {
            $userRoles = $user->roles->pluck('name')->join(', ') ?: 'Sin roles';
            $this->line("- {$user->name}: {$userRoles}");
        }

    } catch (\Exception $e) {
        $this->error('Error en el controlador: ' . $e->getMessage());
    }
})->purpose('Test the administration controller.');

Artisan::command('admin:test-auth', function () {
    try {
        // Simular una petición HTTP
        $request = \Illuminate\Http\Request::create('/settings/administration', 'GET');

        // Crear una instancia de la aplicación
        $app = app();

        // Simular middleware de autenticación
        $this->info('Verificando autenticación...');

        // Verificar si hay usuarios en la base de datos
        $userCount = User::count();
        $this->line("Usuarios en BD: {$userCount}");

        // Verificar roles
        $roleCount = Role::count();
        $this->line("Roles en BD: {$roleCount}");

        // Verificar si el primer usuario tiene roles
        $firstUser = User::with('roles')->first();
        if ($firstUser) {
            $roles = $firstUser->roles->pluck('name')->join(', ') ?: 'Sin roles';
            $this->line("Primer usuario: {$firstUser->name} - Roles: {$roles}");
        }

        $this->info('✅ Todo parece estar bien con la autenticación y datos');

    } catch (\Exception $e) {
        $this->error('Error: ' . $e->getMessage());
    }
})->purpose('Test authentication and data for administration.');

Artisan::command('admin:check-session', function () {
    try {
        $this->info('Verificando configuración de sesión...');

        // Verificar configuración de sesión
        $sessionDriver = config('session.driver');
        $this->line("Driver de sesión: {$sessionDriver}");

        // Verificar configuración de cookies
        $cookieName = config('session.cookie');
        $this->line("Nombre de cookie: {$cookieName}");

        // Verificar configuración de autenticación
        $authGuard = config('auth.defaults.guard');
        $this->line("Guard de autenticación: {$authGuard}");

        // Verificar si hay sesiones activas en la base de datos
        if ($sessionDriver === 'database') {
            $sessionCount = \Illuminate\Support\Facades\DB::table('sessions')->count();
            $this->line("Sesiones activas en BD: {$sessionCount}");
        }

        $this->info('✅ Configuración de sesión verificada');

    } catch (\Exception $e) {
        $this->error('Error: ' . $e->getMessage());
    }
})->purpose('Check session configuration.');

Artisan::command('admin:test-route', function () {
    try {
        $this->info('Probando la ruta de administración...');

        // Crear una petición HTTP simulada
        $request = \Illuminate\Http\Request::create('/settings/administration', 'GET');

        // Obtener la respuesta
        $response = app()->handle($request);

        $this->info('Status Code: ' . $response->getStatusCode());
        $this->info('Content Type: ' . $response->headers->get('Content-Type'));

        if ($response->getStatusCode() === 200) {
            $this->info('✅ La ruta responde correctamente');
        } else {
            $this->error('❌ La ruta no responde correctamente');
        }

    } catch (\Exception $e) {
        $this->error('Error: ' . $e->getMessage());
        $this->error('Stack trace: ' . $e->getTraceAsString());
    }
})->purpose('Test the administration route directly.');

Artisan::command('admin:test-middleware', function () {
    try {
        $this->info('Probando el middleware de administración...');

        // Verificar si el middleware está registrado
        $middleware = app('router')->getMiddleware();

        if (isset($middleware['admin'])) {
            $this->info('✅ Middleware admin registrado: ' . $middleware['admin']);
        } else {
            $this->error('❌ Middleware admin no está registrado');
        }

        // Verificar si el middleware está aplicado a la ruta
        $routes = app('router')->getRoutes();
        $adminRoute = null;

        foreach ($routes as $route) {
            if ($route->getName() === 'administration.edit') {
                $adminRoute = $route;
                break;
            }
        }

        if ($adminRoute) {
            $this->info('✅ Ruta encontrada: ' . $adminRoute->uri());
            $this->info('Middleware aplicado: ' . implode(', ', $adminRoute->middleware()));
        } else {
            $this->error('❌ Ruta no encontrada');
        }

    } catch (\Exception $e) {
        $this->error('Error: ' . $e->getMessage());
    }
})->purpose('Test the admin middleware configuration.');

Artisan::command('admin:test-auth-status', function () {
    try {
        $this->info('Verificando estado de autenticación...');

        // Verificar si hay usuarios en la base de datos
        $userCount = User::count();
        $this->line("Usuarios en BD: {$userCount}");

        // Verificar si el primer usuario tiene roles
        $firstUser = User::with('roles')->first();
        if ($firstUser) {
            $roles = $firstUser->roles->pluck('name')->join(', ') ?: 'Sin roles';
            $this->line("Primer usuario: {$firstUser->name} ({$firstUser->email}) - Roles: {$roles}");
        }

        // Verificar configuración de sesión
        $sessionDriver = config('session.driver');
        $this->line("Driver de sesión: {$sessionDriver}");

        // Verificar si hay sesiones activas
        if ($sessionDriver === 'database') {
            $sessionCount = \Illuminate\Support\Facades\DB::table('sessions')->count();
            $this->line("Sesiones activas en BD: {$sessionCount}");

            if ($sessionCount > 0) {
                $sessions = \Illuminate\Support\Facades\DB::table('sessions')->get();
                foreach ($sessions as $session) {
                    $this->line("- Sesión ID: {$session->id} - Usuario: {$session->user_id}");
                }
            }
        }

        $this->info('✅ Verificación completada');

    } catch (\Exception $e) {
        $this->error('Error: ' . $e->getMessage());
    }
})->purpose('Check authentication status and sessions.');

Artisan::command('user:list-all', function () {
    try {
        $this->info('Listando todos los usuarios y sus roles:');
        $this->info('=====================================');

        $users = User::with('roles')->get();

        foreach ($users as $user) {
            $roles = $user->roles->pluck('name')->join(', ') ?: 'Sin roles';
            $this->line("ID: {$user->id} - {$user->name} ({$user->email}) - Roles: {$roles}");
        }

        $this->info('✅ Listado completado');

    } catch (\Exception $e) {
        $this->error('Error: ' . $e->getMessage());
    }
})->purpose('List all users with their roles.');

Artisan::command('user:debug-session', function () {
    try {
        $this->info('Debugging sesión actual:');
        $this->info('=======================');

        // Verificar si hay un usuario autenticado
        if (Auth::check()) {
            $user = Auth::user();
            $this->info("Usuario autenticado: {$user->name} ({$user->email})");

            $roles = $user->roles->pluck('name')->join(', ') ?: 'Sin roles';
            $this->info("Roles del usuario: {$roles}");

            $isAdmin = $user->hasRole('Administrador');
            $this->info("¿Es administrador? " . ($isAdmin ? 'SÍ' : 'NO'));

        } else {
            $this->error('No hay usuario autenticado');
        }

        // Verificar sesiones activas
        $sessionDriver = config('session.driver');
        $this->info("Driver de sesión: {$sessionDriver}");

        if ($sessionDriver === 'database') {
            $sessions = \Illuminate\Support\Facades\DB::table('sessions')->get();
            $this->info("Sesiones activas: " . $sessions->count());

            foreach ($sessions as $session) {
                $this->line("- Sesión ID: {$session->id} - Usuario ID: {$session->user_id}");
            }
        }

    } catch (\Exception $e) {
        $this->error('Error: ' . $e->getMessage());
    }
})->purpose('Debug current session and authentication.');

Artisan::command('user:check-by-id {id}', function (int $id) {
    try {
        $user = User::with('roles')->find($id);

        if ($user) {
            $this->info("Usuario ID {$id}:");
            $this->info("Nombre: {$user->name}");
            $this->info("Email: {$user->email}");

            $roles = $user->roles->pluck('name')->join(', ') ?: 'Sin roles';
            $this->info("Roles: {$roles}");

            $isAdmin = $user->hasRole('Administrador');
            $this->info("¿Es administrador? " . ($isAdmin ? 'SÍ' : 'NO'));

        } else {
            $this->error("Usuario con ID {$id} no encontrado");
        }

    } catch (\Exception $e) {
        $this->error('Error: ' . $e->getMessage());
    }
})->purpose('Check specific user by ID.');

Artisan::command('user:manage-roles {email} {action} {role?}', function (string $email, string $action, ?string $role = null) {
    try {
        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("Usuario con email {$email} no encontrado");
            return;
        }

        $this->info("Usuario: {$user->name} ({$user->email})");
        $currentRoles = $user->roles->pluck('name')->join(', ') ?: 'Sin roles';
        $this->info("Roles actuales: {$currentRoles}");

        switch ($action) {
            case 'add':
                if (!$role) {
                    $this->error('Debes especificar un rol para agregar');
                    return;
                }
                $user->assignRole($role);
                $this->info("✅ Rol '{$role}' agregado");
                break;

            case 'remove':
                if (!$role) {
                    $this->error('Debes especificar un rol para quitar');
                    return;
                }
                $user->removeRole($role);
                $this->info("✅ Rol '{$role}' removido");
                break;

            case 'replace':
                if (!$role) {
                    $this->error('Debes especificar un rol para reemplazar');
                    return;
                }
                $user->syncRoles([$role]);
                $this->info("✅ Roles reemplazados por '{$role}'");
                break;

            case 'clear':
                $user->syncRoles([]);
                $this->info("✅ Todos los roles removidos");
                break;

            default:
                $this->error("Acción '{$action}' no válida. Usa: add, remove, replace, clear");
                return;
        }

        // Mostrar roles actualizados
        $updatedRoles = $user->fresh()->roles->pluck('name')->join(', ') ?: 'Sin roles';
        $this->info("Roles actualizados: {$updatedRoles}");

    } catch (\Exception $e) {
        $this->error('Error: ' . $e->getMessage());
    }
})->purpose('Manage user roles: add, remove, replace, clear.');
