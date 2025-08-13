<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // TEMPORALMENTE: Permitir acceso sin verificación
        // TODO: Restaurar verificación cuando se resuelva el problema de acceso
        
        // Verificar si el usuario está autenticado
        // if (!Auth::check()) {
        //     return redirect()->route('login')->with('error', 'Debes iniciar sesión para acceder a esta página.');
        // }

        // Permitir acceso a cualquier usuario autenticado
        // (Comentado temporalmente para permitir acceso a todos los usuarios)
        // if (!Auth::user()->hasRole('Administrador')) {
        //     return redirect()->back()->with('error', 'No tienes permisos de administrador para acceder a esta función.');
        // }

        return $next($request);
    }
}
