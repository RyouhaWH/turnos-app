<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SupervisorMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Verificar si el usuario está autenticado
        if (!Auth::check()) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Debes iniciar sesión para acceder a esta función.'], 401);
            }
            return redirect()->route('login')->with('error', 'Debes iniciar sesión para acceder a esta función.');
        }

        // Verificar si el usuario tiene rol de Supervisor o Administrador
        $user = Auth::user();
        if (!$user->hasRole('Supervisor') && !$user->hasRole('Administrador')) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Faltan permisos para realizar esta acción. Se requieren permisos de supervisor o superior.'], 403);
            }
            return redirect()->back()->with('error', 'No tienes permisos de supervisor para acceder a esta función.');
        }

        return $next($request);
    }
}
