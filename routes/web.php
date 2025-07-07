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

    Route::get('/turnos', [ShiftsController::class, 'index']);

    /**
     * Por algún motivo al refactorizar manda error 500 de server.
     * por lo que ver más adelante.
     */
    // Route::get('shifts', [ShiftsController::class, 'getShifts'])
    //     ->name('create-shifts');

    Route::get('shifts', function () {

        $agrupados = [];

        $shiftsEloquent = EmployeeShifts::whereMonth('date', 7)
            ->whereYear('date', 2025)
            ->with('employee') // si tienes la relación definida
            ->get()
            ->groupBy('employee_id');

        if ($shiftsEloquent->isEmpty()) {

            $path = storage_path('app/turnos/julio_alertaMovil.csv');

            $csv = Reader::createFromPath($path, 'r');
            $csv->setHeaderOffset(0); // usa la primera fila como cabecera

            $registros = iterator_to_array($csv->getRecords());

            foreach ($registros as $fila) {
                $nombre = $fila['Nombre'] ?? $fila["\ufeffnombre"] ?? 'SinNombre';
                $fecha  = $fila['Fecha'];
                $turno  = strtoupper($fila['Turno']);

                // dd(mb_convert_case(mb_strtolower($nombre, 'UTF-8'), MB_CASE_TITLE, 'UTF-8'));

                $dia = (int) date('d', strtotime($fecha)); // 1..31

                if (! isset($agrupados[$nombre])) {
                    $agrupados[$nombre] = [
                        'id'     => Str::slug($nombre, '_'),
                        'nombre' => $nombre,
                    ];
                }

                $agrupados[$nombre][strval($dia)] = in_array($turno, ['M', 'T', 'N', 'F', 'L', 'LM', 'PE', 'S', 'LC', 'A', 'Z', '1', '2', '3']) ? $turno : '';
            }

            $formateado = array_values($agrupados);

            return Inertia::render('shifts/create', [
                'turnos' => $formateado,
            ]);
        } else {

            foreach ($shiftsEloquent->toArray() as $shifts) {
                foreach ($shifts as $shift) {

                    $nombre = $shift['employee']['name'];
                    $nombre = mb_strtoupper($nombre, 'UTF-8');
                    $fecha  = $shift['date'];
                    $turno  = strtoupper($shift['shift']);
                    $employee_id = $shift['employee_id'];

                    $dia = (int) date('d', strtotime($fecha)); // 1..31

                    if (! isset($agrupados[$nombre])) {
                        $agrupados[$nombre] = [
                            'id'     => Str::slug($nombre, '_'),
                            'nombre' => $nombre,
                        ];
                    }

                    $agrupados[$nombre][strval($dia)] = in_array($turno, ['M', 'T', 'N', 'F', 'L', 'LM', 'PE', 'S', 'LC', 'A', 'Z', '1', '2', '3']) ? $turno : '';
                }
            }

            $formateado = array_values($agrupados);

            return Inertia::render('shifts/create', [
                'turnos' => $formateado,
            ]);
        }
    })->name('create-shifts');

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
