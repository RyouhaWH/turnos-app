<?php

use App\Http\Controllers\ShiftImportController;
use App\Http\Controllers\ShiftsController;
use App\Http\Controllers\TurnController;
use App\Models\Employees;
use App\Models\EmployeeShifts;
use App\Models\ShiftChangeLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::get('turnos-patrulleros', function () {
    return Inertia::render('dashboard');
})->name('alerta-movil');

Route::get('calendario-turnos-patrulleros', function () {
    return Inertia::render('calendar');
})->name('calendar-alerta-movil');

Route::middleware(['auth', 'verified'])->group(function () {

    Route::inertia('/dashboard', 'dashboard')->name('dashboard');
    Route::inertia('/personal', 'staff')->name('staff-personal');

    // Rutas para gestión de usuarios
    Route::post('/admin/users', [App\Http\Controllers\UserManagementController::class, 'store'])->name('admin.users.store');
    Route::patch('/admin/users/{user}/role', [App\Http\Controllers\UserManagementController::class, 'updateRole'])->name('admin.users.update-role');
    Route::delete('/admin/users/{user}', [App\Http\Controllers\UserManagementController::class, 'destroy'])->name('admin.users.destroy');

    //para tener turnos
    Route::get('turnos', [ShiftsController::class, 'index'])
        ->name('shifts');

    Route::get('turnos-hoy', [ShiftsController::class, 'getDailyShifts']);

    Route::get('turnos-mes/{id}', [ShiftsController::class, 'getMonthlyShifts'])
        ->name('create-shifts');

    Route::get('/turnos/{employee_shift_id}/historial', [ShiftsController::class, 'getHistory'])
        ->name('shifts-history');

    Route::get('/test-getShiftLog/{employeeId}', [TurnController::class, 'getShiftsChangeLogByEmployee'])
        ->name('test-shifts-history');

    // routes/web.php o routes/api.php
    Route::middleware(['auth', 'admin'])->group(function () {
        Route::get('/upload-csv', [ShiftImportController::class, 'index'])
            ->name('upload-shift-file');
        Route::post('/upload-csv', [ShiftImportController::class, 'importFromPostToDatabase']);
    });

    Route::get('import-from-storage', [ShiftImportController::class, 'importFromStorage']);

    Route::prefix('api/dashboard')->group(function () {
        //llamadas datos Dashboard principal y de turnos
        // Estado de empleados para dashboard
        Route::get('employee-status', [TurnController::class, 'getEmployeeStatus'])->name('employee-status');

        // Estadísticas principales
        Route::get('stats', [TurnController::class, 'getDashboardStats'])->name('stats');

        // Información específica
        Route::get('employees-by-role', [TurnController::class, 'getEmployeesByRole'])->name('employees-by-role');

        Route::get('today-shifts', [TurnController::class, 'getTodayShifts'])
            ->name('today-shifts');

    });

    //ruta de turnos filtrados
    Route::get('api/turnos-alerta_movil', [TurnController::class, 'index'])->name('turnos-alerta_movil');

    // ruta de todos los turnos sin filtrar
    Route::get('api/montly-shifts', [TurnController::class, 'getFilteredShiftsFromCSV'])->name('montly-shifts');

    //retorna turnos desde base de datos
    Route::get('api/turnos', [TurnController::class, 'getShiftsFromDB'])->name('turnos');

    //Retorna turnos según fecha
    Route::get('api/turnos/{year}/{month}/{rolId}', [TurnController::class, 'getMonthlyShifts'])->name('turnos-mes');

    //Retorna turnos modificados
    Route::get('api/shift-change-log/{employeeId}', [TurnController::class, 'getShiftsChangeLogByEmployee'])->name('shift-change-log-employee');

    //Retorna todos los turnos modificados
    Route::get('api/shift-change-log', [TurnController::class, 'getShiftsChangeLog'])->name('shift-change-log');

    //ruta de turnos filtrados
    Route::get('/turnos-alerta_movil', [TurnController::class, 'index']);

    //importar turnos desde agGrid
    Route::middleware(['auth', 'supervisor'])->post('turnos-mes/actualizar', function (Request $request) {

        $numerosAReportarCambios = [];

        //! Números base para notificaciones
        // $numeroJulioSarmiento      = Employees::where('rut', '12282547-7')->first()->phone;
        // $numeroMarianelaHuequelef  = Employees::where('rut', '10604235-7')->first()->phone;
        // $numeroPriscilaEscobar     = Employees::where('rut', '18522287-K')->first()->phone;
        // $numeroJavierAlvarado      = Employees::where('rut', '18984596-0')->first()->phone;
        // $numeroEduardoEsparza      = Employees::where('rut', '16948150-4')->first()->phone;
        // $numeroCristianMontecinos  = "";
        $numeroInformacionesAmzoma = "985639782";
        $numeroJorgeWaltemath      = Employees::where('rut', '18198426-0')->first()->phone;
        //$numeroCentralDespacho    = "964949887";

        // Agregar números a la lista para notificaciones
        $numerosAReportarCambios = [
            $numeroInformacionesAmzoma,
            $numeroJorgeWaltemath,
            //$numeroCentralDespacho,
        ];

        $cambios    = $request->input('cambios');
        $mes        = $request->input('mes', now()->month);
        $año       = $request->input('año', now()->year);
        $actualUser = Auth::id();

        // Verificamos si vienen cambios
        if (! is_array($cambios) || empty($cambios)) {
            return response()->json(['message' => 'No hay cambios para guardar'], 400);
        }

        foreach ($cambios as $employeeId => $fechas) {
            foreach ($fechas as $dia => $turno) {

                // El frontend envía el nombre normalizado como clave, no el ID
                // Necesitamos buscar el empleado por nombre normalizado
                $nombreNormalizado = $employeeId;

                // Buscar empleado con múltiples estrategias
                $empleado = null;

                // 1. Búsqueda exacta simple
                $nombreBusqueda = strtolower(str_replace('_', ' ', $nombreNormalizado));
                $empleado = Employees::whereRaw('LOWER(name) = ?', [$nombreBusqueda])->first();

                // 2. Si no se encuentra, búsqueda por similitud
                if (!$empleado) {
                    $empleado = Employees::where('name', 'LIKE', '%' . str_replace('_', '%', $nombreNormalizado) . '%')->first();
                }

                // 3. Si aún no se encuentra, búsqueda por palabras individuales
                if (!$empleado) {
                    $palabras = explode('_', $nombreNormalizado);
                    $empleado = Employees::where(function($query) use ($palabras) {
                        foreach ($palabras as $palabra) {
                            $query->where('name', 'LIKE', '%' . $palabra . '%');
                        }
                    })->first();
                }

                // 4. Si aún no se encuentra, búsqueda más flexible (cualquier palabra)
                if (!$empleado) {
                    $palabras = explode('_', $nombreNormalizado);
                    $empleado = Employees::where(function($query) use ($palabras) {
                        foreach ($palabras as $palabra) {
                            $query->orWhere('name', 'LIKE', '%' . $palabra . '%');
                        }
                    })->first();
                }

                if (!$empleado) {
                    continue; // Saltar este empleado si no se encuentra
                }

                if ($empleado) {

                    // Construir la fecha correctamente usando el día, mes y año actual
                    $fecha = sprintf('%04d-%02d-%02d', $año, $mes, (int) $dia);

                    // Buscar si ya existe el turno
                    $turnoActual = EmployeeShifts::where('employee_id', $empleado->id)
                        ->whereDate('date', $fecha)
                        ->first();

                    $nuevoTurno = strtoupper($turno);
                    $comentario = '';

                    // Verificar si el turno está vacío (para eliminar)
                    if (empty($turno) || $turno === '') {

                        // Solo eliminar si realmente existe un turno
                        if ($turnoActual !== null) {

                            // Registrar en historial antes de eliminar
                            ShiftChangeLog::create([
                                'employee_id'       => $empleado->id,
                                'employee_shift_id' => null, // null porque el registro se eliminará
                                'changed_by'        => $actualUser,
                                'old_shift'         => $turnoActual->shift,
                                'new_shift'         => '',
                                'comment'           => 'Turno eliminado desde plataforma',
                            ]);

                            // Eliminar el turno
                            $turnoActual->delete();
                        }
                        // Si no existe un turno, no hacer nada (no registrar en historial)

                    } else {
                        // Procesar turno normal (no vacío)
                        if ($turnoActual !== null) {

                            // es o no un nuevo turno? si es así agrega
                            if ($turnoActual->shift !== $nuevoTurno) {

                                // Guardar o actualizar el turno
                                $turnoCreado = EmployeeShifts::updateOrCreate(
                                    [
                                        'employee_id' => $empleado->id,
                                        'date'        => $fecha,
                                    ],
                                    [
                                        'shift'    => $nuevoTurno,
                                        'comments' => $comentario,
                                    ]
                                );

                                // Registrar en historial
                                ShiftChangeLog::create([
                                    'employee_id'       => $empleado->id,
                                    'employee_shift_id' => optional($turnoActual)->id,
                                    'changed_by'        => $actualUser,
                                    'old_shift'         => optional($turnoActual)->shift,
                                    'new_shift'         => $nuevoTurno,
                                    'comment'           => $turnoActual
                                    ? "modificado el turno desde plataforma"
                                    : "Turno creado desde plataforma",
                                ]);

                            }

                        } else {

                            // Guardar o actualizar el turno
                            $shiftToMake = EmployeeShifts::updateOrCreate(
                                [
                                    'employee_id' => $empleado->id,
                                    'date'        => $fecha,
                                ],
                                [
                                    'shift'    => $nuevoTurno,
                                    'comments' => $comentario,
                                ]
                            );

                            // Registrar en historial
                            ShiftChangeLog::create([
                                'employee_id'       => $empleado->id,
                                'employee_shift_id' => $shiftToMake->id,
                                'changed_by'        => $actualUser,
                                'old_shift'         => '',
                                'new_shift'         => $nuevoTurno,
                                'comment'           => "Turno creado desde plataforma",
                            ]);
                        }

                        $shiftComplete = match ($turno) {
                            'PE'    => 'Patrulla Escolar',
                            'A'     => 'Administrativo',
                            'LM'    => 'Licencia Médica',
                            'S'     => 'Día Sindical',
                            'M'     => 'Mañana',
                            'T'     => 'Tarde',
                            'N'     => 'Noche',
                            'F'     => 'Franco',
                            'L'     => 'Libre',
                            '1'     => 'Primer Turno',
                            '2'     => 'Segundo Turno',
                            '3'     => 'Tercer Turno',
                            null    => 'Sin Turno',
                            ''      => 'Sin Turno',
                            ' '     => 'Sin Turno',
                            default => 'Desconocido',
                        };

                        foreach ($numerosAReportarCambios as $numero) {

                            $response = Http::post('http://localhost:3001/send-message', [
                                'mensaje' => "Se ha actualizado el turno de *{$empleado->name}* del *$fecha* a *$shiftComplete*",

                                'numero'  => "56" . $numero,
                            ]);
                        }

                    }
                }
            }

            // Enviar mensaje de separador
            foreach ($numerosAReportarCambios as $numero) {
                $response = Http::post('http://localhost:3001/send-message', [
                    'mensaje' => "-------------",
                    'numero'  => "56" . $numero,
                ]);
            }
        }

        return back()->with('success', 'Cambios guardados correctamente.');
    })
        ->name('post-updateShifts');

    // Ruta para datos de plataforma (solo administradores)
    Route::middleware(['auth', 'admin'])->group(function () {
        
        // Vista principal
        Route::get('/platform-data', function () {
            $roles = \App\Models\Rol::all();
            return Inertia::render('settings/platform-data', [
                'roles' => $roles
            ]);
        })->name('platform-data');

        // Rutas para roles
        Route::prefix('platform-data/roles')->group(function () {
            // Crear nuevo rol
            Route::post('/', function (Request $request) {
                $request->validate([
                    'name' => 'required|string|max:255|unique:rols,name',
                    'description' => 'nullable|string|max:500'
                ]);

                \App\Models\Rol::create([
                    'name' => $request->name,
                    'description' => $request->description
                ]);

                return redirect()->back()->with('success', 'Rol creado correctamente');
            });

            // Actualizar rol
            Route::put('/{id}', function (Request $request, $id) {
                $role = \App\Models\Rol::findOrFail($id);
                
                $request->validate([
                    'name' => 'required|string|max:255|unique:rols,name,' . $id,
                    'description' => 'nullable|string|max:500'
                ]);

                $role->update([
                    'name' => $request->name,
                    'description' => $request->description
                ]);

                return redirect()->back()->with('success', 'Rol actualizado correctamente');
            });

            // Eliminar rol
            Route::delete('/{id}', function ($id) {
                $role = \App\Models\Rol::findOrFail($id);
                
                // Verificar si hay empleados usando este rol
                $employeesCount = $role->employees()->count();
                if ($employeesCount > 0) {
                    return redirect()->back()->with('error', 'No se puede eliminar el rol porque hay ' . $employeesCount . ' empleado(s) asignado(s) a él.');
                }

                $role->delete();
                return redirect()->back()->with('success', 'Rol eliminado correctamente');
            });
        });
    });

    /**
     * Extrae RUT de un nombre que puede contener RUT
     */
    function extractRutFromName(string $nombre): ?string
    {
        // Patrón para encontrar RUT chileno (formato: 12345678-9 o 12345678-K)
        if (preg_match('/(\d{7,8}-[\dkK])/', $nombre, $matches)) {
            return $matches[1];
        }

        // Si el nombre es solo un RUT
        if (preg_match('/^\d{7,8}-[\dkK]$/', trim($nombre))) {
            return trim($nombre);
        }

        return null;
    }

    /**
     * Normaliza una cadena para comparación (remueve acentos, convierte a minúsculas, etc.)
     */
    function normalizeString(string $str): string
    {
        // Convertir a minúsculas
        $str = mb_strtolower($str, 'UTF-8');

        // Remover acentos y caracteres especiales
        $str = removeAccents($str);

        // Remover caracteres especiales y espacios extra
        $str = preg_replace('/[^a-z0-9\s]/', '', $str);
        $str = preg_replace('/\s+/', ' ', $str);

        return trim($str);
    }

    /**
     * Remueve acentos de una cadena
     */
    function removeAccents(string $str): string
    {
        $unwanted_array = [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ñ' => 'n',
            'Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U', 'Ñ' => 'N',
            'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u',
            'À' => 'A', 'È' => 'E', 'Ì' => 'I', 'Ò' => 'O', 'Ù' => 'U',
            'ä' => 'a', 'ë' => 'e', 'ï' => 'i', 'ö' => 'o', 'ü' => 'u',
            'Ä' => 'A', 'Ë' => 'E', 'Ï' => 'I', 'Ö' => 'O', 'Ü' => 'U',
            'â' => 'a', 'ê' => 'e', 'î' => 'i', 'ô' => 'o', 'û' => 'u',
            'Â' => 'A', 'Ê' => 'E', 'Î' => 'I', 'Ô' => 'O', 'Û' => 'U',
            'ã' => 'a', 'õ' => 'o', 'Ã' => 'A', 'Õ' => 'O',
            'ç' => 'c', 'Ç' => 'C',
        ];

        return strtr($str, $unwanted_array);
    }

});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
