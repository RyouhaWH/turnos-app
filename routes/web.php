<?php

use App\Http\Controllers\ShiftImportController;
use App\Http\Controllers\ShiftsController;
use App\Http\Controllers\TurnController;
use App\Http\Controllers\UserManagementController;
use App\Http\Controllers\RolController;
use App\Models\Employees;
use App\Models\EmployeeShifts;
use App\Models\ShiftChangeLog;
use App\Models\Rol;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
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

        // Main platform data view
        Route::get('/', function () {
            $roles = Rol::all()->map(function ($role) {
                return [
                    'id'             => $role->id,
                    'nombre'         => $role->nombre,
                    'is_operational' => $role->is_operational,
                    'color'          => $role->color,
                    'created_at'     => $role->created_at,
                    'updated_at'     => $role->updated_at,
                ];
            });

            $empleados = Employees::with('rol')->get()->map(function ($empleado) {
                return [
                    'id'         => $empleado->id,
                    'name'       => $empleado->name,
                    'rut'        => $empleado->rut,
                    'phone'      => $empleado->phone,
                    'rol_id'     => $empleado->rol_id,
                    'rol_nombre' => $empleado->rol->nombre ?? 'Sin rol',
                    'created_at' => $empleado->created_at,
                    'updated_at' => $empleado->updated_at,
                ];
            });

            return Inertia::render('settings/platform-data', [
                'roles'     => $roles,
                'empleados' => $empleados,
            ]);
        })->name('index');

        /*
        |--------------------------------------------------------------------------
        | Employees Management Routes
        |--------------------------------------------------------------------------
        */

        Route::prefix('employees')->name('employees.')->group(function () {
            Route::get('/{id}', function ($id) {
                $empleado = Employees::with('rol')->findOrFail($id);
                return response()->json(['success' => true, 'data' => $empleado]);
            })->name('show');

            Route::put('/{id}', function (Request $request, $id) {
                $empleado = Employees::findOrFail($id);

                $request->validate([
                    'name'              => 'nullable|string|max:255',
                    'first_name'        => 'nullable|string|max:255',
                    'paternal_lastname' => 'nullable|string|max:255',
                    'maternal_lastname' => 'nullable|string|max:255',
                    'rut'               => 'nullable|string|max:20',
                    'phone'             => 'nullable|string|max:20',
                    'email'             => 'nullable|email|max:255',
                    'address'           => 'nullable|string',
                    'position'          => 'nullable|string|max:255',
                    'department'        => 'nullable|string|max:255',
                    'start_date'        => 'nullable|date',
                    'status'            => 'nullable|in:activo,inactivo,vacaciones,licencia',
                    'rol_id'            => 'nullable|integer|exists:rols,id',
                ]);

                $empleado->update($request->only([
                    'name', 'first_name', 'paternal_lastname', 'maternal_lastname',
                    'rut', 'phone', 'email', 'address', 'position', 'department',
                    'start_date', 'status', 'rol_id',
                ]));

                return redirect()->back()->with('success', 'Empleado actualizado correctamente');
            })->name('update');

            Route::get('/unlinked', function () {
                $unlinkedEmployees = Employees::with('rol')
                    ->whereNull('user_id')
                    ->get()
                    ->map(function ($employee) {
                        return [
                            'id'                => $employee->id,
                            'name'              => $employee->name,
                            'first_name'        => $employee->first_name,
                            'paternal_lastname' => $employee->paternal_lastname,
                            'maternal_lastname' => $employee->maternal_lastname,
                            'rut'               => $employee->rut,
                            'phone'             => $employee->phone,
                            'email'             => $employee->email,
                            'rol_nombre'        => $employee->rol ? $employee->rol->nombre : 'Sin rol',
                            'amzoma'            => $employee->amzoma ?? false,
                        ];
                    });

                $availableUsers = User::whereDoesntHave('employee')
                    ->get()
                    ->map(function ($user) {
                        return [
                            'id'    => $user->id,
                            'name'  => $user->name,
                            'email' => $user->email,
                            'roles' => $user->roles->map(function ($role) {
                                return ['name' => $role->name];
                            })->toArray(),
                        ];
                    });

                return response()->json([
                    'success' => true,
                    'data'    => [
                        'unlinked_employees' => $unlinkedEmployees,
                        'available_users'    => $availableUsers,
                    ],
                ]);
            })->name('unlinked');

            Route::post('/{employeeId}/link-user', function (Request $request, $employeeId) {
                $request->validate(['user_id' => 'required|exists:users,id']);

                $employee = Employees::findOrFail($employeeId);
                $user     = User::findOrFail($request->user_id);

                if ($user->employee) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El usuario ya está vinculado a otro funcionario.',
                    ], 400);
                }

                if ($employee->user_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'El funcionario ya está vinculado a otro usuario.',
                    ], 400);
                }

                $employee->update(['user_id' => $user->id]);

                return response()->json([
                    'success' => true,
                    'message' => 'Funcionario vinculado correctamente.',
                ]);
            })->name('link-user');

            Route::post('/{employeeId}/unlink-user', function ($employeeId) {
                $employee = Employees::findOrFail($employeeId);
                $employee->update(['user_id' => null]);

                return response()->json([
                    'success' => true,
                    'message' => 'Funcionario desvinculado correctamente.',
                ]);
            })->name('unlink-user');

            Route::get('/{employeeId}/user-link', function ($employeeId) {
                $employee = Employees::with('user')->findOrFail($employeeId);

                return response()->json([
                    'success' => true,
                    'data'    => [
                        'employee' => [
                            'id'   => $employee->id,
                            'name' => $employee->name,
                        ],
                        'user'     => $employee->user ? [
                            'id'    => $employee->user->id,
                            'name'  => $employee->user->name,
                            'email' => $employee->user->email,
                            'roles' => $employee->user->roles->map(function ($role) {
                                return ['name' => $role->name];
                            })->toArray(),
                        ] : null,
                    ],
                ]);
            })->name('user-link');
        });

        /*
        |--------------------------------------------------------------------------
        | Roles Management Routes
        |--------------------------------------------------------------------------
        */

        Route::prefix('roles')->name('roles.')->group(function () {
            Route::post('/', function (Request $request) {
                $request->validate(['nombre' => 'required|string|max:255|unique:rols,nombre']);

                Rol::create([
                    'nombre'         => $request->nombre,
                    'is_operational' => $request->input('is_operational', true),
                    'color'          => $request->input('color', '#3B82F6'),
                ]);

                return redirect()->back()->with('success', 'Rol creado correctamente');
            })->name('store');

            Route::put('/{id}', function (Request $request, $id) {
                $role = Rol::findOrFail($id);

                $request->validate(['nombre' => 'required|string|max:255|unique:rols,nombre,' . $id]);

                $role->update([
                    'nombre'         => $request->nombre,
                    'is_operational' => $request->input('is_operational', $role->is_operational),
                    'color'          => $request->input('color', $role->color),
                ]);

                return redirect()->back()->with('success', 'Rol actualizado correctamente');
            })->name('update');

            Route::delete('/{id}', function ($id) {
                $role = Rol::findOrFail($id);

                $employeesCount = $role->employees()->count();
                if ($employeesCount > 0) {
                    return redirect()->back()->with('error', 
                        'No se puede eliminar el rol porque hay ' . $employeesCount . ' empleado(s) asignado(s) a él.'
                    );
                }

                $role->delete();
                return redirect()->back()->with('success', 'Rol eliminado correctamente');
            })->name('destroy');
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Test Routes
    |--------------------------------------------------------------------------
    */

    Route::get('/hola', function () {
        return response()->json(['success' => true]);
    })->name('missing-data');

    /*
    |--------------------------------------------------------------------------
    | Missing Data Analysis Route
    |--------------------------------------------------------------------------
    */

    Route::get('/platform-data/employees/missing-data', function () {
        return response()->json(['success' => true]);
        
        // TODO: Implementar lógica de análisis de datos faltantes
        // Este código está comentado temporalmente
    })->name('missing-data-analysis');
});

/*
|--------------------------------------------------------------------------
| Include Additional Route Files
|--------------------------------------------------------------------------
*/

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
