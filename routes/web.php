<?php

use App\Http\Controllers\ShiftImportController;
use App\Http\Controllers\ShiftsController;
use App\Http\Controllers\TurnController;
use App\Models\Employees;
use App\Models\EmployeeShifts;
use App\Models\ShiftChangeLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
    Route::get('/upload-csv', [ShiftImportController::class, 'index'])
        ->name('upload-shift-file');
    Route::post('/upload-csv', [ShiftImportController::class, 'importFromPostToDatabase']);

    Route::get('import-from-storage', [ShiftImportController::class, 'importFromStorage']);

    //importar turnos desde agGrid
    Route::post('turnos-mes/actualizar', function (Request $request) {

        $cambios = $request->input('cambios');
        $mes = $request->input('mes', now()->month);
        $año = $request->input('año', now()->year);
        $actualUser = Auth::id();

        // Verificamos si vienen cambios
        if (! is_array($cambios) || empty($cambios)) {
            return response()->json(['message' => 'No hay cambios para guardar'], 400);
        }

        foreach ($cambios as $nombreCompleto => $fechas) {
            foreach ($fechas as $dia => $turno) {

                // Normaliza el nombre
                $nombreCompleto = ucwords(str_replace('_', ' ', $nombreCompleto));

                // Buscar empleado
                $empleado = Employees::where('name', $nombreCompleto)->first();

                if ($empleado) {

                    // Construir la fecha correctamente usando el día, mes y año actual
                    $fecha = sprintf('%04d-%02d-%02d', $año, $mes, (int)$dia);

                    // Buscar si ya existe el turno
                    $turnoActual = EmployeeShifts::where('employee_id', $empleado->id)
                        ->whereDate('date', $fecha)
                        ->first();

                    $nuevoTurno = strtoupper($turno);
                    $comentario = '';

                    // Verificar si el turno está vacío (para eliminar)
                    if (empty($turno) || $turno === '') {

                        // Si existe un turno, eliminarlo
                        if ($turnoActual !== null) {

                            // Registrar en historial antes de eliminar
                            ShiftChangeLog::create([
                                'employee_id'       => $empleado->id,
                                'employee_shift_id' => $turnoActual->id,
                                'changed_by'        => $actualUser,
                                'old_shift'         => $turnoActual->shift,
                                'new_shift'         => '',
                                'comment'           => 'Turno eliminado desde plataforma',
                            ]);

                            // Eliminar el turno
                            $turnoActual->delete();
                        }

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
                                'comment'           => 'Turno creado desde plataforma',
                            ]);
                        }
                    }
                }

                //aquí es donde se envía el mensaje, para poder obtener de cada personal al que se le edita los datos su número y enviar el turno editado
                //aquí se toma el número que tiene el personal en la base de datos
                $numeroAEnviar = "56951004035";

                $shiftComplete = match ($turno) {
                    'A' => 'Administrativo',
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
                    default => 'Desconocido',
                };

                // $response = Http::post('http://localhost:3001/send-message', [
                //     'mensaje' => "Se ha actualizado el turno de *$nombreCompleto* del *$fecha* a *$shiftComplete*",

                //     'numero'  => $numeroAEnviar,
                // ]);
            }
            // $response = Http::post('http://localhost:3001/send-message', [
            //     'mensaje' => "-------------",

            //     'numero'  => $numeroAEnviar,
            // ]);
        }

        return back()->with('success', 'Cambios guardados correctamente.');
    })
        ->name('post-updateShifts');

});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
