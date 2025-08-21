<?php

use App\Http\Controllers\ShiftImportController;
use App\Http\Controllers\ShiftsController;
use App\Http\Controllers\TurnController;
use App\Models\Employees;
use App\Models\EmployeeShifts;
use App\Models\ShiftChangeLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
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

    // Rutas para gestión de roles
    Route::prefix('api/roles')->group(function () {
        Route::get('/', [App\Http\Controllers\RolController::class, 'index'])->name('roles.index');
        Route::patch('/{id}/operational-status', [App\Http\Controllers\RolController::class, 'updateOperationalStatus'])->name('roles.update-operational-status');
        Route::patch('/update-multiple', [App\Http\Controllers\RolController::class, 'updateMultiple'])->name('roles.update-multiple');
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

        try {
            // Iniciar transacción para asegurar consistencia de datos
            DB::beginTransaction();

            $numerosAReportarCambios = [];

        //! Números base para notificaciones
        $numeroJulioSarmiento      = Employees::where('rut', '12282547-7')->first()->phone;
        $numeroMarianelaHuequelef  = Employees::where('rut', '10604235-7')->first()->phone;
        $numeroPriscilaEscobar     = Employees::where('rut', '18522287-K')->first()->phone;
        $numeroJavierAlvarado      = Employees::where('rut', '18984596-0')->first()->phone;
        $numeroEduardoEsparza      = Employees::where('rut', '16948150-4')->first()->phone;
        $numeroCristianMontecinos  = "";
        $numeroInformacionesAmzoma = "985639782";
        $numeroJorgeWaltemath      = Employees::where('rut', '18198426-0')->first()->phone;

        // Verificar si estamos en producción o local
        if (app()->environment('production')) {
            $numerosAReportarCambios = [
                $numeroInformacionesAmzoma,
                $numeroJorgeWaltemath,
                $numeroJulioSarmiento,
                // $numeroMarianelaHuequelef,
                // $numeroPriscilaEscobar,
                // $numeroJavierAlvarado,
                // $numeroEduardoEsparza,
                // $numeroCristianMontecinos,
            ];

        } else {
            // Agregar números a la lista para notificaciones
            $numerosAReportarCambios = [
            $numeroInformacionesAmzoma,
            $numeroJorgeWaltemath,

            ];
        }


        $cambios    = $request->input('cambios');
        $mes        = $request->input('mes', now()->month);
        $año        = $request->input('año', now()->year);
        $actualUser = Auth::id();

        // Debug: Verificar qué valores se están recibiendo
        Log::info('🔄 Valores recibidos en actualización:', [
            'mes' => $mes,
            'año' => $año,
            'cambios' => $cambios
        ]);

        // Array para agrupar cambios por funcionario
        $cambiosPorFuncionario = [];

        // Verificamos si vienen cambios
        if (! is_array($cambios) || empty($cambios)) {
            return response()->json(['message' => 'No hay cambios para guardar'], 400);
        }

        foreach ($cambios as $employeeId => $fechas) {

            foreach ($fechas['turnos'] as $dia => $turno) {

                // El frontend ahora envía el ID real del empleado
                $empleado = Employees::find($employeeId);

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
                                'shift_date'        => $fecha, // Guardar la fecha del turno eliminado
                            ]);

                            // Almacenar eliminación para mensaje consolidado
                            if (!isset($cambiosPorFuncionario[$empleado->id])) {
                                $cambiosPorFuncionario[$empleado->id] = [
                                    'nombre' => $empleado->name,
                                    'telefono' => $empleado->phone,
                                    'cambios' => []
                                ];
                            }

                            $turnoAnterior = match ($turnoActual->shift) {
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

                            $cambiosPorFuncionario[$empleado->id]['cambios'][] = [
                                'fecha' => $fecha,
                                'turno_anterior' => $turnoAnterior,
                                'turno_nuevo' => 'Sin Turno'
                            ];

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
                                    'shift_date'        => $fecha, // Guardar la fecha del turno
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
                                'shift_date'        => $fecha, // Guardar la fecha del turno
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
                            'TE'    => 'Test',
                            default => 'Desconocido',
                        };

                        // Almacenar cambio para mensaje consolidado
                        if (!isset($cambiosPorFuncionario[$empleado->id])) {
                            $cambiosPorFuncionario[$empleado->id] = [
                                'nombre' => $empleado->name,
                                'telefono' => $empleado->phone,
                                'cambios' => []
                            ];
                        }

                        $turnoAnterior = $turnoActual ? match ($turnoActual->shift) {
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
                            'TE'    => 'Test',
                            default => 'Desconocido',
                        } : 'Sin Turno';

                        $cambiosPorFuncionario[$empleado->id]['cambios'][] = [
                            'fecha' => $fecha,
                            'turno_anterior' => $turnoAnterior,
                            'turno_nuevo' => $shiftComplete
                        ];

                    }
                }
            }

            // Enviar mensajes consolidados por funcionario
            foreach ($cambiosPorFuncionario as $funcionarioId => $datosFuncionario) {
                if (empty($datosFuncionario['cambios'])) {
                    continue;
                }

                // Construir mensaje consolidado
                $mensaje = "Se ha modificado el turno de: *{$datosFuncionario['nombre']}* los días:\n";

                foreach ($datosFuncionario['cambios'] as $cambio) {
                    $fechaFormateada = date('d/m/Y', strtotime($cambio['fecha']));
                    $mensaje .= "• *{$fechaFormateada}* de \"*{$cambio['turno_anterior']}*\" a \"*{$cambio['turno_nuevo']}*\"\n";
                }

                // Enviar mensaje a los contactos de reporte
                foreach ($numerosAReportarCambios as $numero) {
                    $response = Http::post('http://localhost:3001/send-message', [
                        'mensaje' => $mensaje,
                        'numero'  => "56" . $numero,
                    ]);
                }

                // Enviar mensaje al funcionario si tiene teléfono
                // if ($datosFuncionario['telefono']) {
                //     $response = Http::post('http://localhost:3001/send-message', [
                //         'mensaje' => $mensaje,
                //         'numero'  => "56" . $numeroJorgeWaltemath,
                //     ]);
                // }

                // Enviar separador después de cada funcionario
                foreach ($numerosAReportarCambios as $numero) {
                    $response = Http::post('http://localhost:3001/send-message', [
                        'mensaje' => "-------------",
                        'numero'  => "56" . $numero,
                    ]);
                }
            }
        }

            // Commit de la transacción si todo salió bien
            DB::commit();

            return back()->with(
                'success',
                'Cambios guardados correctamente.'
            );

        } catch (\Exception $e) {
            // Rollback en caso de error
            DB::rollBack();

            Log::error('Error al actualizar turnos: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->with('success',
                'Error al guardar los cambios: ' . $e->getMessage(),
            );
        }
    })
        ->name('post-updateShifts');

    // Ruta para datos de plataforma (solo administradores)
    Route::middleware(['auth', 'admin'])->group(function () {

        // Vista principal
        Route::get('/platform-data', function () {
            $roles = \App\Models\Rol::all()->map(function($role) {
                return [
                    'id' => $role->id,
                    'nombre' => $role->nombre,
                    'is_operational' => $role->is_operational,
                    'color' => $role->color,
                    'created_at' => $role->created_at,
                    'updated_at' => $role->updated_at,
                ];
            });
            $empleados = \App\Models\Employees::with('rol')->get()->map(function($empleado) {
                return [
                    'id' => $empleado->id,
                    'name' => $empleado->name,
                    'rut' => $empleado->rut,
                    'phone' => $empleado->phone,
                    'rol_id' => $empleado->rol_id,
                    'rol_nombre' => $empleado->rol->nombre ?? 'Sin rol',
                    'created_at' => $empleado->created_at,
                    'updated_at' => $empleado->updated_at,
                ];
            });

            return Inertia::render('settings/platform-data', [
                'roles' => $roles,
                'empleados' => $empleados
            ]);
        })->name('platform-data');

        // Rutas para empleados
        Route::prefix('platform-data/employees')->group(function () {
            // Obtener datos de un empleado específico
            Route::get('/{id}', function ($id) {
                $empleado = \App\Models\Employees::with('rol')->findOrFail($id);

                return response()->json([
                    'success' => true,
                    'data' => $empleado
                ]);
            });

            // Actualizar empleado
            Route::put('/{id}', function (Request $request, $id) {
                $empleado = \App\Models\Employees::findOrFail($id);

                $request->validate([
                    'name' => 'nullable|string|max:255',
                    'first_name' => 'nullable|string|max:255',
                    'paternal_lastname' => 'nullable|string|max:255',
                    'maternal_lastname' => 'nullable|string|max:255',
                    'rut' => 'nullable|string|max:20',
                    'phone' => 'nullable|string|max:20',
                    'email' => 'nullable|email|max:255',
                    'address' => 'nullable|string',
                    'position' => 'nullable|string|max:255',
                    'department' => 'nullable|string|max:255',
                    'start_date' => 'nullable|date',
                    'status' => 'nullable|in:activo,inactivo,vacaciones,licencia',
                    'rol_id' => 'nullable|integer|exists:rols,id'
                ]);

                $empleado->update($request->only([
                    'name',
                    'first_name',
                    'paternal_lastname',
                    'maternal_lastname',
                    'rut',
                    'phone',
                    'email',
                    'address',
                    'position',
                    'department',
                    'start_date',
                    'status',
                    'rol_id'
                ]));

                return redirect()->back()->with('success', 'Empleado actualizado correctamente');
            });
        });

        // Rutas para roles
        Route::prefix('platform-data/roles')->group(function () {
            // Crear nuevo rol
            Route::post('/', function (Request $request) {
                $request->validate([
                    'nombre' => 'required|string|max:255|unique:rols,nombre'
                ]);

                \App\Models\Rol::create([
                    'nombre' => $request->nombre,
                    'is_operational' => $request->input('is_operational', true), // Por defecto operativo
                    'color' => $request->input('color', '#3B82F6') // Por defecto azul
                ]);

                return redirect()->back()->with('success', 'Rol creado correctamente');
            });

                                    // Actualizar rol
            Route::put('/{id}', function (Request $request, $id) {
                $role = \App\Models\Rol::findOrFail($id);

                $request->validate([
                    'nombre' => 'required|string|max:255|unique:rols,nombre,' . $id
                ]);

                $role->update([
                    'nombre' => $request->nombre,
                    'is_operational' => $request->input('is_operational', $role->is_operational),
                    'color' => $request->input('color', $role->color)
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
