<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ValidateApiKey
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Obtener la API key del header o parámetro query
        $key = $request->header('X-API-Key') ?? $request->query('api_key');

        if (!$key) {
            return response()->json([
                'success' => false,
                'message' => 'API Key no proporcionada',
                'error' => 'Se requiere X-API-Key en headers o api_key en query parameters'
            ], 401);
        }

        // Buscar la API key en la base de datos
        $apiKey = ApiKey::where('key', $key)->first();

        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'API Key inválida'
            ], 401);
        }

        // Validar que la API key sea válida
        if (!$apiKey->isValid()) {
            return response()->json([
                'success' => false,
                'message' => 'API Key no activa o expirada'
            ], 401);
        }

        // Registrar el uso de la API key
        $apiKey->recordUsage();

        // Pasar la información de la API key al Request
        $request->attributes->set('api_key', $apiKey);

        return $next($request);
    }
}
