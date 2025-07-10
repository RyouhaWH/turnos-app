<?php

use App\Http\Controllers\ShiftImportController;
use App\Http\Controllers\ShiftsController;
use App\Models\Employees;
use App\Models\EmployeeShifts;
use App\Models\Shifts;
use function Pest\Laravel\json;
use function PHPUnit\Framework\isEmpty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use League\Csv\Reader;

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
    Route::get('turnos-mes', [ShiftsController::class, 'getMonthlyShifts'])
        ->name('create-shifts');


    // routes/web.php o routes/api.php
    Route::get('/upload-csv', [ShiftImportController::class, 'index']);
    Route::post('/upload-csv', [ShiftImportController::class, 'importFromStorageToDatabase']);

    Route::get('import-from-storage', [ShiftImportController::class, 'importFromStorage']);

    //importar turnos desde agGrid
    Route::post('turnos/actualizar', function (Request $request) {

        $user = auth()->user()->name;


        $cambios = $request->input('cambios');

        // Verificamos si vienen cambios
        if (! is_array($cambios) || empty($cambios)) {
            return response()->json(['message' => 'No hay cambios para guardar'], 400);
        }

        foreach ($cambios as $nombreCompleto => $fechas) {
            foreach ($fechas as $fecha => $turno) {


                // Validar turno si quieres
                if (! in_array(strtoupper($turno), ['M', 'T', 'N', 'F', 'L', 'LM', 'S', 'V', 'LC', 'C', 'A'])) {
                    continue;
                }

                $nombreCompleto = ucwords(str_replace('_', ' ', $nombreCompleto));

                // Buscar empleado
                $empleado = Employees::where('name', $nombreCompleto)
                    ->first();


                //Guardar o actualizar
                EmployeeShifts::updateOrCreate(
                    [
                        'employee_id' => $empleado->id,
                        'date'       => $fecha,
                    ],
                    [
                        'shift' => strtoupper($turno),
                        'comments' => 'hola mundo',
                    ]
                );
            }
        }

        return back()->with('success', 'Cambios guardados correctamente.');
    });

});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
