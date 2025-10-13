<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\ItemParentController;
use App\Http\Controllers\Api\MovementController;
use App\Http\Controllers\Api\ProviderController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\TurnController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// ========================================
// Rutas de Autenticación (Públicas)
// ========================================
Route::prefix('auth')->group(function () {
    // Registro de usuario
    Route::post('/register', [AuthController::class, 'register']);

    // Inicio de sesión
    Route::post('/login', [AuthController::class, 'login']);

    // Rutas protegidas (requieren autenticación)
    Route::middleware('auth:sanctum')->group(function () {
        // Cerrar sesión (token actual)
        Route::post('/logout', [AuthController::class, 'logout']);

        // Cerrar todas las sesiones
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);

        // Obtener información del usuario autenticado
        Route::get('/me', [AuthController::class, 'me']);

        // Renovar token
        Route::post('/refresh', [AuthController::class, 'refresh']);

        // Cambiar contraseña
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });
});

// Ruta alternativa para obtener usuario (compatibilidad)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::middleware('auth:sanctum')->group(function () {

    Route::prefix('v1')->group(function () {

        // ========================================
        // Rutas de Prueba (Test/Debug)
        // ========================================

        // Ruta de prueba simple
        Route::get('test', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    'message' => 'API v1 funcionando correctamente',
                    'timestamp' => now(),
                    'authenticated' => true,
                    'user' => auth()->user() ? [
                        'id' => auth()->user()->id,
                        'name' => auth()->user()->name,
                        'email' => auth()->user()->email,
                    ] : null,
                ],
            ]);
        });

        // Ruta de prueba para verificar respuesta sin wrapper
        Route::get('test/simple', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    'mensaje' => 'Respuesta directa con data wrapper',
                ],
            ]);
        });

        // Ruta de prueba para verificar respuesta con wrapper doble
        Route::get('test/wrapped', function () {
            return response()->json([
                'success' => true,
                'data' => [
                    'mensaje' => 'Respuesta con wrapper',
                    'timestamp' => now(),
                ],
            ]);
        });

        // Ruta de prueba POST
        Route::post('test', function (Request $request) {
            return response()->json([
                'success' => true,
                'data' => [
                    'message' => 'POST recibido correctamente',
                    'received_data' => $request->all(),
                    'timestamp' => now(),
                ],
            ]);
        });

        // Movements (con lógica de negocio integrada)
        Route::apiResource('movements', MovementController::class);

        // Items
        Route::get('items/sku/{sku}', [ItemController::class, 'getBySku']);
        Route::get('items/disponibles', [ItemController::class, 'disponibles']);
        Route::apiResource('items', ItemController::class);

        // Items Parents (Lotes)
        Route::apiResource('items-parents', ItemParentController::class);

        // Employees - Rutas específicas ANTES del apiResource
        Route::get('employees/lista-simple', [EmployeeController::class, 'listaSimple']);
        Route::get('employees/activos', [EmployeeController::class, 'activos']);
        Route::get('employees/amzoma', [EmployeeController::class, 'amzoma']);
        Route::get('employees/buscar', [EmployeeController::class, 'buscar']);
        Route::get('employees/departamento/{department}', [EmployeeController::class, 'porDepartamento']);
        Route::apiResource('employees', EmployeeController::class);

        // Users - Rutas específicas ANTES del apiResource
        Route::get('users/activos', [UserController::class, 'activos']);
        Route::apiResource('users', UserController::class);

        // Providers
        Route::apiResource('providers', ProviderController::class);

        // Purchases
        Route::post('purchases/{id}/generate-items', [PurchaseController::class, 'generateItems']);
        Route::apiResource('purchases', PurchaseController::class);
    });

});

// Ruta de prueba para verificar que las rutas API funcionan
Route::get('/test', function () {
    return response()->json([
        'success'   => true,
        'message'   => 'API funcionando correctamente',
        'timestamp' => now(),
    ]);
});

// Turnos: rango de fechas (requiere auth:sanctum)
Route::middleware('auth:sanctum')->get('/turnos/rango', [TurnController::class, 'getShiftsByDateRange']);
