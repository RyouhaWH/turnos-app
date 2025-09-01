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
        // Verificar si el usuario está autenticado
        if (!Auth::check()) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Debes iniciar sesión para acceder a esta función.',
                    'error' => 'unauthenticated'
                ], 401);
            }
            return redirect()->route('login')->with('error', 'Debes iniciar sesión para acceder a esta página.');
        }

        // Verificar si el usuario tiene el rol de administrador
        if (!Auth::user()->hasRole('Administrador')) {
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes permisos de administrador para acceder a esta función.',
                    'error' => 'forbidden'
                ], 403);
            }
            return redirect()->back()->with('error', 'No tienes permisos de administrador para acceder a esta función.');
        }

        return $next($request);
    }
}
