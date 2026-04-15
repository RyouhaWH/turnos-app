<?php

use App\Http\Controllers\PlatformDataController;
use App\Http\Controllers\RolController;
use App\Http\Controllers\ShiftImportController;
use App\Http\Controllers\ShiftsController;
use App\Http\Controllers\TurnController;
use App\Http\Controllers\ShiftTalanaMappingController;
use App\Http\Controllers\WhatsAppRecipientController;
use App\Http\Controllers\TurnosSimplificadoController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\SectorController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\EmployeeAssignmentController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/* |-------------------------------------------------------------------------- | Public Routes |-------------------------------------------------------------------------- */

Route::get('/', function () {
    if (Auth::check()) {
        /** @var \App\Models\User $user */
        $user = Auth::user();
        if ($user && $user->hasAnyRole(['patrullero', 'fisca', 'ciclo', 'dron'])) {
            return redirect('/turno-mensual');
        }
        return redirect()->route('dashboard');
    }
    return Inertia::render('welcome');
})->name('home');

Route::get('turnos-patrulleros', function () {
    return Inertia::render('dashboard');
})->name('alerta-movil');

Route::get('calendario-turnos-patrulleros', function () {
    return Inertia::render('calendar');
})->name('calendar-alerta-movil');

/* |-------------------------------------------------------------------------- | Protected Routes |-------------------------------------------------------------------------- */

Route::middleware(['auth', 'verified'])->group(function () {

    /*
     |--------------------------------------------------------------------------
     | Dashboard & Staff Routes
     |--------------------------------------------------------------------------
     */

    Route::inertia('/dashboard', 'dashboard')->name('dashboard');
    Route::inertia('/personal', 'staff')->name('staff-personal');

    // Ruta para la vista simplificada de turnos
    Route::get('/turno-simple', [TurnosSimplificadoController::class , 'index'])->name('turnos.simplificado');
    // Route::inertia('/turnos-simple', [TurnosSimplificadoController::class, 'index'])->name('turnos.simplificado');


    /*
     |--------------------------------------------------------------------------
     | User specific turn Routes
     |--------------------------------------------------------------------------
     */

    Route::get('/turno-mensual', function (Request $request) {
            try {
                $user = $request->user();

                $year = $request->query('year', now('America/Santiago')->year);
                $month = $request->query('month', now('America/Santiago')->month);

                $startOfMonth = \Carbon\Carbon::create($year, $month, 1, 0, 0, 0, 'America/Santiago')->startOfMonth()->toDateString();
                $endOfMonth = \Carbon\Carbon::create($year, $month, 1, 0, 0, 0, 'America/Santiago')->endOfMonth()->toDateString();

                $shifts = [];
                if ($user->employee) {
                    $shifts = $user->shifts()
                        ->where('date', '>=', $startOfMonth)
                        ->where('date', '<=', $endOfMonth)
                        ->pluck('shift', 'date')
                        ->toArray();
                }

                return Inertia::render('Turnos/MonthlyCalendar', [
                'shifts' => (object)$shifts,
                'year' => (int)$year,
                'month' => (int)$month,
                'userName' => $user->name,
                ]);
            }
            catch (\Exception $e) {
                return Inertia::render('Turnos/MonthlyCalendar', [
                'shifts' => (object)[],
                'year' => (int)now('America/Santiago')->year,
                'month' => (int)now('America/Santiago')->month,
                'userName' => $request->user()->name ?? 'Usuario',
                'error' => $e->getMessage(),
                ]);
            }
        }
        )->name('turnos.mensual');

        /*
     |--------------------------------------------------------------------------
     | User Management Routes
     |--------------------------------------------------------------------------
     */

        Route::prefix('admin/users')->name('admin.users.')->group(function () {
            Route::post('/', [UserManagementController::class , 'store'])->name('store');
            Route::patch('/{user}/role', [UserManagementController::class , 'updateRole'])->name('update-role');
            Route::delete('/{user}', [UserManagementController::class , 'destroy'])->name('destroy');
        }
        );

        /*
     |--------------------------------------------------------------------------
     | Shifts Routes
     |--------------------------------------------------------------------------
     */

        Route::prefix('turnos')->name('shifts.')->group(function () {
            Route::get('/', [ShiftsController::class , 'index'])->name('index');
            Route::get('hoy', [ShiftsController::class , 'getDailyShifts'])->name('today');
            Route::get('mes/{id}', [ShiftsController::class , 'getMonthlyShifts'])->name('monthly');
            Route::get('/{employee_shift_id}/historial', [ShiftsController::class , 'getHistory'])->name('history');
        }
        );

        Route::get('/shifts/createv3/{id}', [ShiftsController::class , 'createv3'])->name('shifts.createv3');
        Route::get('/shifts/createv2/{id}', [ShiftsController::class , 'createv2'])->name('shifts.createv2');

        // Ruta para demo de v3
        Route::get('/shifts/demo-v3', function () {
            return Inertia::render('shifts/demo-v3');
        }
        )->name('shifts.demo-v3');

        // Rutas con nombres originales para mantener compatibilidad con el frontend
        Route::get('turnos', [ShiftsController::class , 'index'])->name('shifts');
        Route::get('turnos-hoy', [ShiftsController::class , 'getDailyShifts']);
        Route::get('turnos-mes/{id}', [ShiftsController::class , 'getMonthlyShifts'])->name('create-shifts');
        Route::get('/turnos/{employee_shift_id}/historial', [ShiftsController::class , 'getHistory'])->name('shifts-history');

        Route::get('/test-getShiftLog/{employeeId}', [TurnController::class , 'getShiftsChangeLogByEmployee'])
            ->name('test-shifts-history');

        Route::get('/turnos-exportar', [TurnController::class, 'exportShiftsToExcel'])->name('shifts.export');

        /*
     |--------------------------------------------------------------------------
     | CSV Import Routes (Admin Only)
     |--------------------------------------------------------------------------
     */

        Route::middleware(['auth', 'admin'])->prefix('upload-csv')->name('upload-shift.')->group(function () {
            Route::get('/', [ShiftImportController::class , 'index'])->name('index');
            Route::post('/', [ShiftImportController::class , 'importFromPostToDatabase'])->name('import');
        }
        );

        // Ruta para obtener números de teléfono de destinatarios WhatsApp
        Route::middleware(['auth', 'admin'])->get('/api/whatsapp-recipients', function (Request $request) {
            $phoneNumbers = \App\Models\WhatsAppRecipient::where('is_active', true)
                ->pluck('phone', 'identifier_id')
                ->toArray();

            Log::info('📱 Números de teléfono cargados desde DB:', $phoneNumbers);

            // Obtener todos los destinatarios completos para la vista
            $recipients = \App\Models\WhatsAppRecipient::where('is_active', true)->get();

            return response()->json([
                'success' => true,
                'phoneNumbers' => $phoneNumbers,
                'recipients' => $recipients
            ]);
        });

        // API de turnos por rango accesible con sesión web (para el frontend Inertia)
        Route::middleware(['auth'])->get('/api/turnos/rango', [TurnController::class , 'getShiftsByDateRange'])->name('api.turnos.rango');
        // API de turnos mensual (para asegurar endpoint usado por frontend)
        Route::middleware(['auth'])->get('/api/turnos/{year}/{month}/{rolId}', [TurnController::class , 'getMonthlyShifts'])->name('api.turnos.mensual');

        Route::get('import-from-storage', [ShiftImportController::class , 'importFromStorage'])
            ->name('import-from-storage');

        /*
     |--------------------------------------------------------------------------
     | Dashboard API Routes
     |--------------------------------------------------------------------------
     */

        Route::prefix('api/dashboard')->name('dashboard.')->group(function () {
            Route::get('employee-status', [TurnController::class , 'getEmployeeStatus'])->name('employee-status');
            Route::get('stats', [TurnController::class , 'getDashboardStats'])->name('stats');
            Route::get('employees-by-role', [TurnController::class , 'getEmployeesByRole'])->name('employees-by-role');
            Route::get('today-shifts', [TurnController::class , 'getTodayShifts'])->name('today-shifts');
        }
        );

        /*
     |--------------------------------------------------------------------------
     | Roles Management Routes
     |--------------------------------------------------------------------------
     */

        Route::prefix('api/roles')->name('roles.')->group(function () {
            Route::get('/', [RolController::class , 'index'])->name('index');
            Route::patch('/{id}/operational-status', [RolController::class , 'updateOperationalStatus'])->name('update-operational-status');
            Route::patch('/update-multiple', [RolController::class , 'updateMultiple'])->name('update-multiple');
        }
        );

        /*
     |--------------------------------------------------------------------------
     | Shifts API Routes
     |--------------------------------------------------------------------------
     */

        Route::prefix('api')->name('api.')->group(function () {
            // Rango de fechas (multi-mes) para turnos
            Route::get('turnos/rango', [TurnController::class , 'getShiftsByDateRange'])->name('turnos-rango');
            Route::get('turnos-alerta_movil', [TurnController::class , 'index'])->name('turnos-alerta-movil');
            Route::get('montly-shifts', [TurnController::class , 'getFilteredShiftsFromCSV'])->name('monthly-shifts');
            Route::get('turnos', [TurnController::class , 'getShiftsFromDB'])->name('turnos');
            Route::get('turnos/{year}/{month}/{rolId}', [TurnController::class , 'getMonthlyShifts'])->name('turnos-mes');
            Route::get('shift-change-log/{employeeId}', [TurnController::class , 'getShiftsChangeLogByEmployee'])->name('shift-change-log-employee');
            Route::get('shift-change-log', [TurnController::class , 'getShiftsChangeLog'])->name('shift-change-log');
        }
        );

        Route::get('/turnos-alerta_movil', [TurnController::class , 'index']);

        /*
     |--------------------------------------------------------------------------
     | Shifts Update Route (Supervisor Only)
     |--------------------------------------------------------------------------
     */

        Route::middleware(['auth', 'supervisor'])->post('turnos-mes/actualizar', function (Request $request) {
            return app(\App\Http\Controllers\ShiftsUpdateController::class)->updateShifts($request);
        }
        )->name('post-updateShifts');

        /*
     |--------------------------------------------------------------------------
     | Sectors & Vehicles (Admin Only)
     |--------------------------------------------------------------------------
     */

        Route::middleware(['auth', 'admin'])->group(function () {
            // Sectors CRUD
            Route::prefix('platform-data/sectors')->name('sectors.')->group(function () {
                Route::get('/',       [SectorController::class, 'index'])->name('index');
                Route::post('/',      [SectorController::class, 'store'])->name('store');
                Route::put('/{id}',   [SectorController::class, 'update'])->name('update');
                Route::delete('/{id}',[SectorController::class, 'destroy'])->name('destroy');
            });

            // Vehicles CRUD
            Route::prefix('platform-data/vehicles')->name('vehicles.')->group(function () {
                Route::get('/',       [VehicleController::class, 'index'])->name('index');
                Route::post('/',      [VehicleController::class, 'store'])->name('store');
                Route::put('/{id}',   [VehicleController::class, 'update'])->name('update');
                Route::delete('/{id}',[VehicleController::class, 'destroy'])->name('destroy');
            });
        });

        /*
     |--------------------------------------------------------------------------
     | Assignments (Supervisor + Admin)
     |--------------------------------------------------------------------------
     */

        Route::middleware(['auth', 'supervisor'])->prefix('assignments')->name('assignments.')->group(function () {
            Route::get('/',              [EmployeeAssignmentController::class, 'index'])->name('index');
            Route::post('/upsert',       [EmployeeAssignmentController::class, 'upsert'])->name('upsert');
            Route::post('/bulk',         [EmployeeAssignmentController::class, 'bulkUpsert'])->name('bulk');
        });

        // Grouped view for dashboard (any authenticated user)
        Route::middleware(['auth'])->get('/api/assignments/grouped', [EmployeeAssignmentController::class, 'grouped'])->name('assignments.grouped');

        /*
     |--------------------------------------------------------------------------
     | Platform Data Routes (Admin Only)
     |--------------------------------------------------------------------------
     */

        Route::middleware(['auth', 'admin'])->prefix('platform-data')->name('platform-data.')->group(function () {

            Route::get('/', [PlatformDataController::class , 'index'])->name('index');

            /*
     |--------------------------------------------------------------------------
     | Employees Management Routes
     |--------------------------------------------------------------------------
     */

            Route::prefix('employees')->name('employees.')->group(function () {
                    // Rutas específicas primero (antes de las rutas con parámetros)
                    Route::get('/missing-data', [PlatformDataController::class , 'getMissingData'])->name('missing-data');
                    Route::get('/unlinked', [PlatformDataController::class , 'getLinkingData'])->name('unlinked');

                    // Ruta para crear empleado (debe ir antes de las rutas con parámetros)
                    Route::post('/', [PlatformDataController::class , 'storeEmployee'])->name('store');

                    // Rutas con parámetros al final
                    Route::get('/{id}', [PlatformDataController::class , 'getEmployee'])->name('show');
                    Route::put('/{id}', [PlatformDataController::class , 'updateEmployee'])->name('update');
                    Route::post('/{employeeId}/link-user', [PlatformDataController::class , 'linkEmployeeToUser'])->name('link-user');
                    Route::post('/{employeeId}/unlink-user', [PlatformDataController::class , 'unlinkEmployee'])->name('unlink-user');

                    // Nuevas rutas para gestión de usuarios
                    Route::post('/{employeeId}/create-user', [PlatformDataController::class , 'createUserForEmployee'])->name('create-user');
                    Route::put('/{employeeId}/update-user', [PlatformDataController::class , 'updateUserForEmployee'])->name('update-user');
                    Route::delete('/{employeeId}/delete-user', [PlatformDataController::class , 'deleteUserForEmployee'])->name('delete-user');
                }
                );

                /*
         |--------------------------------------------------------------------------
         | Roles Management Routes
         |--------------------------------------------------------------------------
         */

                Route::prefix('roles')->name('roles.')->group(function () {
                    Route::post('/', [RolController::class , 'store'])->name('store');
                    Route::put('/{id}', [RolController::class , 'update'])->name('update');
                    Route::delete('/{id}', [RolController::class , 'destroy'])->name('destroy');
                }
                );

                // Ruta para obtener roles de Spatie
                Route::get('/spatie-roles', [PlatformDataController::class , 'getSpatieRoles'])->name('spatie-roles');
            });

            /*
         |--------------------------------------------------------------------------
         | Talana Mappings Routes
         |--------------------------------------------------------------------------
         */
            Route::prefix('admin/talana-mappings')->name('talana-mappings.')->group(function () {
                Route::get('/', [ShiftTalanaMappingController::class, 'index'])->name('index');
                Route::post('/', [ShiftTalanaMappingController::class, 'store'])->name('store');
                Route::put('/{id}', [ShiftTalanaMappingController::class, 'update'])->name('update');
                Route::delete('/{id}', [ShiftTalanaMappingController::class, 'destroy'])->name('destroy');
            });

            /*
         |--------------------------------------------------------------------------
         | WhatsApp Recipients Routes
         |--------------------------------------------------------------------------
         */
            Route::prefix('admin/whatsapp-recipients')->name('whatsapp-recipients.')->group(function () {
                Route::get('/', [WhatsAppRecipientController::class, 'index'])->name('index');
                Route::post('/', [WhatsAppRecipientController::class, 'store'])->name('store');
                Route::put('/{id}', [WhatsAppRecipientController::class, 'update'])->name('update');
                Route::delete('/{id}', [WhatsAppRecipientController::class, 'destroy'])->name('destroy');
            });

            /*
         |--------------------------------------------------------------------------
         | Test Routes
         |--------------------------------------------------------------------------
         */

            Route::get('/test', function () {
            return view('test');
        }
        )->name('test');

        // Ruta de test público sin middleware
        Route::get('/test-public', function () {
            return view('test');
        }
        )->name('test-public');

    });

/* |-------------------------------------------------------------------------- | Include Additional Route Files |-------------------------------------------------------------------------- */

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
