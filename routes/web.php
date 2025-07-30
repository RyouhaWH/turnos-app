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
    // Route::post('/upload-csv', [ShiftImportController::class, 'importFromStorageToDatabase']);

    Route::get('import-from-storage', [ShiftImportController::class, 'importFromStorage']);

    //importar turnos desde agGrid
    Route::post('turnos-mes/actualizar', function (Request $request) {

        $cambios    = $request->input('cambios');
        $actualUser = Auth::id();

        dd($request->post());

        // Verificamos si vienen cambios
        if (! is_array($cambios) || empty($cambios)) {
            return response()->json(['message' => 'No hay cambios para guardar'], 400);
        }

        foreach ($cambios as $nombreCompleto => $fechas) {
            foreach ($fechas as $fecha => $turno) {

                // Normaliza el nombre
                $nombreCompleto = ucwords(str_replace('_', ' ', $nombreCompleto));

                // Buscar empleado
                $empleado = Employees::where('name', $nombreCompleto)->first();

                if ($empleado) {

                    $fecha = \Carbon\Carbon::parse($fecha)->toDateString(); // Asegura el formato

                    // Buscar si ya existe el turno
                    $turnoActual = EmployeeShifts::where('employee_id', $empleado->id)
                        ->whereDate('date', $fecha)
                        ->first();

                    $nuevoTurno = strtoupper($turno);
                    $comentario = 'hola mundo';

                    // Verifica si hay un cambio real
                    if ($turnoActual && $turnoActual->shift !== $nuevoTurno) {

                        // dd("employee_shift_id:  $turnoActual->id, changed_by: $actualUser, old_shift: $turnoActual->shift, new_shift: $nuevoTurno, comment: $comentario, changed_at: $changeAt");

                        // Registrar en historial
                        ShiftChangeLog::create([
                            'employee_shift_id' => $turnoActual->id,
                            'changed_by'        => $actualUser,
                            'old_shift'         => $turnoActual->shift,
                            'new_shift'         => $nuevoTurno,
                            'comment'           => $comentario,
                        ]);

                        // Guardar o actualizar el turno
                        EmployeeShifts::updateOrCreate(
                            [
                                'employee_id' => $empleado->id,
                                'date'        => $fecha,
                            ],
                            [
                                'shift'    => $nuevoTurno,
                                'comments' => $comentario,
                            ]
                        );
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

                $response = Http::post('http://localhost:3001/send-message', [
                    'mensaje' => "Se ha actualizado el turno de *$nombreCompleto* del *$fecha* a *$shiftComplete*",

                    'numero'  => $numeroAEnviar,
                ]);
            }
            $response = Http::post('http://localhost:3001/send-message', [
                'mensaje' => "-------------",

                'numero'  => $numeroAEnviar,
            ]);
        }

        return back()->with('success', 'Cambios guardados correctamente.');
    })
        ->name('post-updateShifts');

});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
