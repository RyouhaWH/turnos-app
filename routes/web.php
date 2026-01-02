<?php

use App\Http\Controllers\PlatformDataController;
use App\Http\Controllers\RolController;
use App\Http\Controllers\ShiftImportController;
use App\Http\Controllers\ShiftsController;
use App\Http\Controllers\TurnController;
use App\Http\Controllers\TurnosSimplificadoController;
use App\Http\Controllers\UserManagementController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('turnos-patrulleros', function () {
    return Inertia::render('dashboard');
})->name('alerta-movil');

Route::get('calendario-turnos-patrulleros', function () {
    return Inertia::render('calendar');
})->name('calendar-alerta-movil');

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Dashboard & Staff Routes
    |--------------------------------------------------------------------------
    */

    Route::inertia('/dashboard', 'dashboard')->name('dashboard');
    Route::inertia('/personal', 'staff')->name('staff-personal');

    // Ruta para la vista simplificada de turnos
    Route::get('/turno-simple', [TurnosSimplificadoController::class, 'index'])->name('turnos.simplificado');
    // Route::inertia('/turnos-simple', [TurnosSimplificadoController::class, 'index'])->name('turnos.simplificado');

    /*
    |--------------------------------------------------------------------------
    | User Management Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('admin/users')->name('admin.users.')->group(function () {
        Route::post('/', [UserManagementController::class, 'store'])->name('store');
        Route::patch('/{user}/role', [UserManagementController::class, 'updateRole'])->name('update-role');
        Route::delete('/{user}', [UserManagementController::class, 'destroy'])->name('destroy');
    });

    /*
    |--------------------------------------------------------------------------
    | Shifts Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('turnos')->name('shifts.')->group(function () {
        Route::get('/', [ShiftsController::class, 'index'])->name('index');
        Route::get('hoy', [ShiftsController::class, 'getDailyShifts'])->name('today');
        Route::get('mes/{id}', [ShiftsController::class, 'getMonthlyShifts'])->name('monthly');
        Route::get('/{employee_shift_id}/historial', [ShiftsController::class, 'getHistory'])->name('history');
    });

    Route::get('/shifts/createv3/{id}', [ShiftsController::class, 'createv3'])->name('shifts.createv3');
    Route::get('/shifts/createv2/{id}', [ShiftsController::class, 'createv2'])->name('shifts.createv2');

    // Ruta para demo de v3
    Route::get('/shifts/demo-v3', function () {
        return Inertia::render('shifts/demo-v3');
    })->name('shifts.demo-v3');

    // Rutas con nombres originales para mantener compatibilidad con el frontend
    Route::get('turnos', [ShiftsController::class, 'index'])->name('shifts');
    Route::get('turnos-hoy', [ShiftsController::class, 'getDailyShifts']);
    Route::get('turnos-mes/{id}', [ShiftsController::class, 'getMonthlyShifts'])->name('create-shifts');
    Route::get('/turnos/{employee_shift_id}/historial', [ShiftsController::class, 'getHistory'])->name('shifts-history');

    Route::get('/test-getShiftLog/{employeeId}', [TurnController::class, 'getShiftsChangeLogByEmployee'])
        ->name('test-shifts-history');

    /*
    |--------------------------------------------------------------------------
    | CSV Import Routes (Admin Only)
    |--------------------------------------------------------------------------
    */

    Route::middleware(['auth', 'admin'])->prefix('upload-csv')->name('upload-shift.')->group(function () {
        Route::get('/', [ShiftImportController::class, 'index'])->name('index');
        Route::post('/', [ShiftImportController::class, 'importFromPostToDatabase'])->name('import');
    });

    // Ruta para obtener números de teléfono de destinatarios WhatsApp
    Route::middleware(['auth', 'admin'])->get('/api/whatsapp-recipients', function (Request $request) {
        $phoneNumbers = [];

        // Obtener números de teléfono de empleados por RUT (solo los 4 contactos permitidos)
        $ruts = [
            'julio-sarmiento' => '12282547-7',
            'priscila-escobar' => '18522287-K',
            'jorge-waltemath' => '18198426-0',
        ];

        foreach ($ruts as $id => $rut) {
            $employee = \App\Models\Employees::where('rut', $rut)->first();
            if ($employee && $employee->phone) {
                $phoneNumbers[$id] = $employee->phone;
            } else {
                $phoneNumbers[$id] = 'No disponible';
            }
        }

        // Números fijos
        $phoneNumbers['central'] = '964949887';
        // Jorge Waltemath tiene número fijo para pruebas
        $phoneNumbers['jorge-waltemath'] = '951004035';

        Log::info('📱 Números de teléfono cargados:', $phoneNumbers);

        return response()->json([
            'success' => true,
            'phoneNumbers' => $phoneNumbers
        ]);
    });

    // API de turnos por rango accesible con sesión web (para el frontend Inertia)
    Route::middleware(['auth'])->get('/api/turnos/rango', [TurnController::class, 'getShiftsByDateRange'])->name('api.turnos.rango');
    // API de turnos mensual (para asegurar endpoint usado por frontend)
    Route::middleware(['auth'])->get('/api/turnos/{year}/{month}/{rolId}', [TurnController::class, 'getMonthlyShifts'])->name('api.turnos.mensual');

    Route::get('import-from-storage', [ShiftImportController::class, 'importFromStorage'])
        ->name('import-from-storage');

    /*
    |--------------------------------------------------------------------------
    | Dashboard API Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('api/dashboard')->name('dashboard.')->group(function () {
        Route::get('employee-status', [TurnController::class, 'getEmployeeStatus'])->name('employee-status');
        Route::get('stats', [TurnController::class, 'getDashboardStats'])->name('stats');
        Route::get('employees-by-role', [TurnController::class, 'getEmployeesByRole'])->name('employees-by-role');
        Route::get('today-shifts', [TurnController::class, 'getTodayShifts'])->name('today-shifts');
    });

    /*
    |--------------------------------------------------------------------------
    | Roles Management Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('api/roles')->name('roles.')->group(function () {
        Route::get('/', [RolController::class, 'index'])->name('index');
        Route::patch('/{id}/operational-status', [RolController::class, 'updateOperationalStatus'])->name('update-operational-status');
        Route::patch('/update-multiple', [RolController::class, 'updateMultiple'])->name('update-multiple');
    });

    /*
    |--------------------------------------------------------------------------
    | Shifts API Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('api')->name('api.')->group(function () {
        // Rango de fechas (multi-mes) para turnos
        Route::get('turnos/rango', [TurnController::class, 'getShiftsByDateRange'])->name('turnos-rango');
        Route::get('turnos-alerta_movil', [TurnController::class, 'index'])->name('turnos-alerta-movil');
        Route::get('montly-shifts', [TurnController::class, 'getFilteredShiftsFromCSV'])->name('monthly-shifts');
        Route::get('turnos', [TurnController::class, 'getShiftsFromDB'])->name('turnos');
        Route::get('turnos/{year}/{month}/{rolId}', [TurnController::class, 'getMonthlyShifts'])->name('turnos-mes');
        Route::get('shift-change-log/{employeeId}', [TurnController::class, 'getShiftsChangeLogByEmployee'])->name('shift-change-log-employee');
        Route::get('shift-change-log', [TurnController::class, 'getShiftsChangeLog'])->name('shift-change-log');
    });

    Route::get('/turnos-alerta_movil', [TurnController::class, 'index']);

    /*
    |--------------------------------------------------------------------------
    | Shifts Update Route (Supervisor Only)
    |--------------------------------------------------------------------------
    */

    Route::middleware(['auth', 'supervisor'])->post('turnos-mes/actualizar', function (Request $request) {
        return app(\App\Http\Controllers\ShiftsUpdateController::class)->updateShifts($request);
    })->name('post-updateShifts');

    /*
    |--------------------------------------------------------------------------
    | Platform Data Routes (Admin Only)
    |--------------------------------------------------------------------------
    */

    Route::middleware(['auth', 'admin'])->prefix('platform-data')->name('platform-data.')->group(function () {

        Route::get('/', [PlatformDataController::class, 'index'])->name('index');

        /*
        |--------------------------------------------------------------------------
        | Employees Management Routes
        |--------------------------------------------------------------------------
        */

        Route::prefix('employees')->name('employees.')->group(function () {
            // Rutas específicas primero (antes de las rutas con parámetros)
            Route::get('/missing-data', [PlatformDataController::class, 'getMissingData'])->name('missing-data');
            Route::get('/unlinked', [PlatformDataController::class, 'getLinkingData'])->name('unlinked');
            
            // Ruta para crear empleado (debe ir antes de las rutas con parámetros)
            Route::post('/', [PlatformDataController::class, 'storeEmployee'])->name('store');

            // Rutas con parámetros al final
            Route::get('/{id}', [PlatformDataController::class, 'getEmployee'])->name('show');
            Route::put('/{id}', [PlatformDataController::class, 'updateEmployee'])->name('update');
            Route::post('/{employeeId}/link-user', [PlatformDataController::class, 'linkEmployeeToUser'])->name('link-user');
            Route::post('/{employeeId}/unlink-user', [PlatformDataController::class, 'unlinkEmployee'])->name('unlink-user');

            // Nuevas rutas para gestión de usuarios
            Route::post('/{employeeId}/create-user', [PlatformDataController::class, 'createUserForEmployee'])->name('create-user');
            Route::put('/{employeeId}/update-user', [PlatformDataController::class, 'updateUserForEmployee'])->name('update-user');
            Route::delete('/{employeeId}/delete-user', [PlatformDataController::class, 'deleteUserForEmployee'])->name('delete-user');
        });

        /*
        |--------------------------------------------------------------------------
        | Roles Management Routes
        |--------------------------------------------------------------------------
        */

        Route::prefix('roles')->name('roles.')->group(function () {
            Route::post('/', [RolController::class, 'store'])->name('store');
            Route::put('/{id}', [RolController::class, 'update'])->name('update');
            Route::delete('/{id}', [RolController::class, 'destroy'])->name('destroy');
        });

        // Ruta para obtener roles de Spatie
        Route::get('/spatie-roles', [PlatformDataController::class, 'getSpatieRoles'])->name('spatie-roles');
    });

    /*
    |--------------------------------------------------------------------------
    | Test Routes
    |--------------------------------------------------------------------------
    */

    Route::get('/test', function () {
        return view('test');
    })->name('test');

    // Ruta de test público sin middleware
    Route::get('/test-public', function () {
        return view('test');
    })->name('test-public');


});

/*
|--------------------------------------------------------------------------
| Include Additional Route Files
|--------------------------------------------------------------------------
*/

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
