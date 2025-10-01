<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TurnController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TestController;

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

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// ========================================
// RUTAS DE PRUEBA Y TESTING
// ========================================

// Ruta básica de prueba
Route::get('/test', [TestController::class, 'basic']);

// Información del servidor
Route::get('/test/server', [TestController::class, 'serverInfo']);

// Prueba de base de datos
Route::get('/test/database', [TestController::class, 'databaseTest']);

// Prueba de caché
Route::get('/test/cache', [TestController::class, 'cacheTest']);

// Prueba de headers HTTP
Route::get('/test/headers', [TestController::class, 'headersTest']);

// Prueba de CORS
Route::get('/test/cors', [TestController::class, 'corsTest']);

// Prueba completa del sistema
Route::get('/test/full', [TestController::class, 'fullSystemTest']);

// Prueba de autenticación (requiere token)
Route::get('/test/auth', [TestController::class, 'authTest'])->middleware('auth:sanctum');

// Rutas de autenticación (sin middleware de auth)
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/auth/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
Route::get('/auth/verify', [AuthController::class, 'verify'])->middleware('auth:sanctum');

// Turnos: rango de fechas (requiere auth:sanctum)
Route::middleware('auth:sanctum')->get('/turnos/rango', [TurnController::class, 'getShiftsByDateRange']);







