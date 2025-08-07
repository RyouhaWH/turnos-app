<?php

use App\Http\Controllers\TurnController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/test', function () {
    return response()->json(['ok' => true]);
});

//ruta de turnos filtrados
Route::get('/turnos-alerta_movil', [TurnController::class, 'index']);

// ruta de todos los turnos sin filtrar
Route::get('montly-shifts', [TurnController::class, 'getFilteredShiftsFromCSV']);

//retorna turnos desde base de datos
Route::get('/turnos', [TurnController::class, 'getShiftsFromDB']);

//Retorna turnos modificados
Route::get('/shift-change-log/{employeeId}', [TurnController::class, 'getShiftsChangeLogByEmployee']);

//Retorna turnos según fecha
Route::get('/turnos/{year}/{month}/{rolId}', [TurnController::class, 'getMonthlyShifts']);

//Retorna todos los turnos modificados
Route::get('/shift-change-log', [TurnController::class, 'getShiftsChangeLog']);



// Rutas de debug para dashboard
Route::prefix('dashboard')->group(function () {

    // Tests básicos
    Route::get('/test', [TurnController::class, 'test']);
    Route::get('/test-models', [TurnController::class, 'testModels']);
    Route::get('/debug-info', [TurnController::class, 'getDebugInfo']);

    // Información específica
    Route::get('/employees-by-role', [TurnController::class, 'getEmployeesByRole']);
    Route::get('/today-shifts', [TurnController::class, 'getTodayShifts']);

    // Estadísticas principales
    Route::get('/stats', [TurnController::class, 'getDashboardStats']);
});






