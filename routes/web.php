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
use Illuminate\Support\Facades\Log;

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
        $cambios    = $request->input('cambios');
        $actualUser = Auth::id();

        // Verificamos si vienen cambios
        if (! is_array($cambios) || empty($cambios)) {
            return response()->json(['message' => 'No hay cambios para guardar'], 400);
        }

        $changesSummary = [
            'updated' => 0,
            'deleted' => 0,
            'created' => 0,
            'errors'  => [],
        ];

        foreach ($cambios as $nombreCompleto => $fechas) {
            foreach ($fechas as $fecha => $turno) {
                try {
                    // Normaliza el nombre
                    $nombreCompleto = ucwords(str_replace('_', ' ', $nombreCompleto));

                    // Buscar empleado
                    $empleado = Employees::where('name', $nombreCompleto)->first();

                    if (! $empleado) {
                        $changesSummary['errors'][] = "Empleado no encontrado: {$nombreCompleto}";
                        continue;
                    }

                    // FIX: Remove the day subtraction that was causing the date offset
                    $fecha = \Carbon\Carbon::parse($fecha)->toDateString();

                    // Buscar si ya existe el turno
                    $turnoActual = EmployeeShifts::where('employee_id', $empleado->id)
                        ->whereDate('date', $fecha)
                        ->first();

                    // Handle deletion case
                    if ($turno === '__DELETE__' || empty(trim($turno))) {
                        if ($turnoActual) {


                            // Log the deletion in history
                            ShiftChangeLog::create([
                                'employee_shift_id' => $turnoActual->id,
                                'changed_by'        => $actualUser,
                                'old_shift'         => $turnoActual->shift,
                                'new_shift'         => null, // NULL indicates deletion
                                'comment'           => 'Turno eliminado',
                            ]);

                            dd('continua');

                            // Delete the shift record
                            $turnoActual->delete();
                            $changesSummary['deleted']++;

                            Log::info("Turno eliminado: {$nombreCompleto} - {$fecha}");
                        }
                        continue; // Skip to next iteration
                    }

                    // Normal update/create case
                    $nuevoTurno = strtoupper(trim($turno));
                    $comentario = '';

                    if ($turnoActual) {
                        // Check if there's an actual change
                        if ($turnoActual->shift !== $nuevoTurno) {
                            // Log the change in history
                            ShiftChangeLog::create([
                                'employee_shift_id' => $turnoActual->id,
                                'changed_by'        => $actualUser,
                                'old_shift'         => $turnoActual->shift,
                                'new_shift'         => $nuevoTurno,
                                'comment'           => $comentario,
                            ]);

                            // Update the existing shift
                            $turnoActual->update([
                                'shift'    => $nuevoTurno,
                                'comments' => $comentario,
                            ]);

                            $changesSummary['updated']++;
                            Log::info("Turno actualizado: {$nombreCompleto} - {$fecha} - {$nuevoTurno}");
                        }
                    } else {
                        // Create new shift
                        $nuevoTurnoCreado = EmployeeShifts::create([
                            'employee_id' => $empleado->id,
                            'date'        => $fecha,
                            'shift'       => $nuevoTurno,
                            'comments'    => $comentario,
                        ]);

                        // Log the creation in history
                        ShiftChangeLog::create([
                            'employee_shift_id' => $nuevoTurnoCreado->id,
                            'changed_by'        => $actualUser,
                            'old_shift'         => null, // NULL indicates new creation
                            'new_shift'         => $nuevoTurno,
                            'comment'           => 'Turno creado',
                        ]);

                        $changesSummary['created']++;
                        Log::info("Turno creado: {$nombreCompleto} - {$fecha} - {$nuevoTurno}");
                    }

                    // Optional: Send notification (commented out)
                    // $numeroAEnviar = $empleado->phone ?? "56951004035";
                    // $shiftComplete = match ($nuevoTurno) {
                    //     'A'  => 'Administrativo',
                    //     'LM' => 'Licencia Médica',
                    //     'S'  => 'Día Sindical',
                    //     'M'  => 'Mañana',
                    //     'T'  => 'Tarde',
                    //     'N'  => 'Noche',
                    //     'F'  => 'Franco',
                    //     'L'  => 'Libre',
                    //     '1'  => 'Primer Turno',
                    //     '2'  => 'Segundo Turno',
                    //     '3'  => 'Tercer Turno',
                    //     default => 'Desconocido',
                    // };

                    // if ($turno !== '__DELETE__') {
                    //     $response = Http::post('http://localhost:3001/send-message', [
                    //         'mensaje' => "Se ha actualizado el turno de *{$nombreCompleto}* del *{$fecha}* a *{$shiftComplete}*",
                    //         'numero'  => $numeroAEnviar,
                    //     ]);
                    // }

                } catch (\Exception $e) {
                    $changesSummary['errors'][] = "Error procesando {$nombreCompleto} - {$fecha}: " . $e->getMessage();
                    Log::error("Error en actualización de turno: " . $e->getMessage());
                }
            }
        }

        // Build response message
        $message = "Cambios guardados: ";
        $details = [];

        if ($changesSummary['created'] > 0) {
            $details[] = "{$changesSummary['created']} creados";
        }
        if ($changesSummary['updated'] > 0) {
            $details[] = "{$changesSummary['updated']} actualizados";
        }
        if ($changesSummary['deleted'] > 0) {
            $details[] = "{$changesSummary['deleted']} eliminados";
        }

        $message .= implode(', ', $details);

        if (! empty($changesSummary['errors'])) {
            Log::warning('Errores durante actualización de turnos', $changesSummary['errors']);
        }

        return back()->with([
            'success' => $message,
            'summary' => $changesSummary,
        ]);
    })->name('post-updateShifts');

});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
