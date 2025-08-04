<?php

use App\Http\Controllers\Api\DashboardStatsController;
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

// Rutas para estadísticas del dashboard
Route::prefix('dashboard')->group(function () {
    // Estadísticas generales del dashboard
    Route::get('/stats', [DashboardStatsController::class, 'getDashboardStats']);

    // Estadísticas por rol específico
    Route::get('/stats/role/{roleId}', function($roleId) {
        $controller = new DashboardStatsController();
        $stats = $controller->getStatsForRole($roleId);
        return response()->json(['success' => true, 'data' => $stats]);
    });

    // Detalles de personal por rol y fecha
    Route::get('/personal/{roleId}', [DashboardStatsController::class, 'getPersonalDetails']);
    Route::get('/personal/{roleId}/{date}', [DashboardStatsController::class, 'getPersonalDetails']);

    // Estadísticas por período (para gráficos)
    Route::get('/stats/period', [DashboardStatsController::class, 'getStatsForPeriod']);
});





