<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use App\Models\User;

class TestController extends Controller
{
    /**
     * Ruta básica de prueba - verifica que la API funciona
     */
    public function basic(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'API funcionando correctamente',
            'timestamp' => now()->toISOString(),
            'server_time' => now()->format('Y-m-d H:i:s'),
            'timezone' => config('app.timezone'),
            'environment' => app()->environment(),
        ], 200);
    }

    /**
     * Ruta de prueba con información del servidor
     */
    public function serverInfo(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Información del servidor',
            'data' => [
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version(),
                'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
                'server_name' => $_SERVER['SERVER_NAME'] ?? 'Unknown',
                'request_method' => $_SERVER['REQUEST_METHOD'] ?? 'Unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown',
                'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'Unknown',
                'timestamp' => now()->toISOString(),
                'memory_usage' => memory_get_usage(true),
                'memory_peak' => memory_get_peak_usage(true),
            ],
        ], 200);
    }

    /**
     * Ruta de prueba de base de datos
     */
    public function databaseTest(): JsonResponse
    {
        try {
            // Probar conexión a la base de datos
            DB::connection()->getPdo();

            // Contar usuarios
            $userCount = User::count();

            // Obtener información de la base de datos
            $dbName = DB::connection()->getDatabaseName();
            $dbDriver = DB::connection()->getDriverName();

            return response()->json([
                'success' => true,
                'message' => 'Conexión a base de datos exitosa',
                'data' => [
                    'database_name' => $dbName,
                    'database_driver' => $dbDriver,
                    'user_count' => $userCount,
                    'connection_status' => 'Connected',
                    'timestamp' => now()->toISOString(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de conexión a base de datos',
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString(),
            ], 500);
        }
    }

    /**
     * Ruta de prueba de autenticación (requiere token)
     */
    public function authTest(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $roles = $user->roles->pluck('name')->toArray();

            return response()->json([
                'success' => true,
                'message' => 'Autenticación funcionando correctamente',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'roles' => $roles,
                    ],
                    'token_valid' => true,
                    'timestamp' => now()->toISOString(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en autenticación',
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString(),
            ], 500);
        }
    }

    /**
     * Ruta de prueba de caché
     */
    public function cacheTest(): JsonResponse
    {
        try {
            $testKey = 'api_test_' . time();
            $testValue = 'test_value_' . rand(1000, 9999);

            // Guardar en caché
            Cache::put($testKey, $testValue, 60); // 60 segundos

            // Recuperar de caché
            $retrievedValue = Cache::get($testKey);

            // Limpiar caché de prueba
            Cache::forget($testKey);

            return response()->json([
                'success' => true,
                'message' => 'Sistema de caché funcionando correctamente',
                'data' => [
                    'test_key' => $testKey,
                    'stored_value' => $testValue,
                    'retrieved_value' => $retrievedValue,
                    'cache_working' => $retrievedValue === $testValue,
                    'timestamp' => now()->toISOString(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en sistema de caché',
                'error' => $e->getMessage(),
                'timestamp' => now()->toISOString(),
            ], 500);
        }
    }

    /**
     * Ruta de prueba de headers HTTP
     */
    public function headersTest(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Headers HTTP recibidos',
            'data' => [
                'request_headers' => $request->headers->all(),
                'content_type' => $request->header('Content-Type'),
                'accept' => $request->header('Accept'),
                'authorization' => $request->header('Authorization') ? 'Present' : 'Not present',
                'user_agent' => $request->header('User-Agent'),
                'origin' => $request->header('Origin'),
                'referer' => $request->header('Referer'),
                'timestamp' => now()->toISOString(),
            ],
        ], 200);
    }

    /**
     * Ruta de prueba de CORS
     */
    public function corsTest(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'CORS configurado correctamente',
            'data' => [
                'cors_enabled' => true,
                'allowed_origins' => config('cors.allowed_origins', []),
                'allowed_methods' => config('cors.allowed_methods', []),
                'allowed_headers' => config('cors.allowed_headers', []),
                'timestamp' => now()->toISOString(),
            ],
        ], 200);
    }

    /**
     * Ruta de prueba completa del sistema
     */
    public function fullSystemTest(): JsonResponse
    {
        $results = [];

        // Test 1: Conexión a base de datos
        try {
            DB::connection()->getPdo();
            $results['database'] = ['status' => 'OK', 'message' => 'Conexión exitosa'];
        } catch (\Exception $e) {
            $results['database'] = ['status' => 'ERROR', 'message' => $e->getMessage()];
        }

        // Test 2: Sistema de caché
        try {
            $testKey = 'system_test_' . time();
            Cache::put($testKey, 'test', 10);
            $retrieved = Cache::get($testKey);
            Cache::forget($testKey);
            $results['cache'] = ['status' => 'OK', 'message' => 'Sistema de caché funcionando'];
        } catch (\Exception $e) {
            $results['cache'] = ['status' => 'ERROR', 'message' => $e->getMessage()];
        }

        // Test 3: Modelos
        try {
            $userCount = User::count();
            $results['models'] = ['status' => 'OK', 'message' => "Usuarios en BD: {$userCount}"];
        } catch (\Exception $e) {
            $results['models'] = ['status' => 'ERROR', 'message' => $e->getMessage()];
        }

        // Test 4: Configuración
        try {
            $results['config'] = [
                'status' => 'OK',
                'message' => 'Configuración cargada',
                'app_name' => config('app.name'),
                'app_env' => config('app.env'),
                'app_debug' => config('app.debug'),
            ];
        } catch (\Exception $e) {
            $results['config'] = ['status' => 'ERROR', 'message' => $e->getMessage()];
        }

        $allOk = collect($results)->every(fn($result) => $result['status'] === 'OK');

        return response()->json([
            'success' => $allOk,
            'message' => $allOk ? 'Todos los sistemas funcionando correctamente' : 'Algunos sistemas tienen problemas',
            'data' => [
                'tests' => $results,
                'overall_status' => $allOk ? 'HEALTHY' : 'ISSUES_DETECTED',
                'timestamp' => now()->toISOString(),
            ],
        ], $allOk ? 200 : 500);
    }
}

