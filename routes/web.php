<?php

use App\Http\Controllers\ShiftImportController;
use App\Http\Controllers\ShiftsController;
use App\Models\EmployeeShifts;
use App\Models\Shifts;
use function Pest\Laravel\json;
use function PHPUnit\Framework\isEmpty;
use Illuminate\Http\Request;
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

    Route::get('shifts', function () {

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

                $dia = (int) date('d', strtotime($fecha)); // 1..31

                if (! isset($agrupados[$nombre])) {
                    $agrupados[$nombre] = [
                        'id'     => Str::slug($nombre, '_'),
                        'nombre' => $nombre,
                    ];
                }

                $agrupados[$nombre][strval($dia)] = in_array($turno, ['M', 'T', 'N', 'F', 'L', 'LM', 'PE', 'S', 'LC']) ? $turno : '';
            }

            $formateado = array_values($agrupados);

            return Inertia::render('shifts/create', [
                'turnos' => $formateado,
            ]);
        } else {

            $agrupados = $shiftsEloquent->toArray();

            foreach ($agrupados as $shift) {

                $nombre = $shift->employee->name ?? 'SinNombre';

                dd($shift[0]['employee']);

                $fecha  = $shift->date;
                $turno  = strtoupper($shift->shift);

                dd($nombre, $dia, $turno);


                $dia = (int) date('d', strtotime($fecha)); // 1..31


                if (! isset($agrupados[$nombre])) {
                    $agrupados[$nombre] = [
                        'id'     => Str::slug($nombre, '_'),
                        'nombre' => $nombre,
                    ];
                }

                $agrupados[$nombre][strval($dia)] = in_array($turno, ['M', 'T', 'N', 'F', 'L', 'LM', 'PE', 'S', 'LC']) ? $turno : '';
            }

            $formateado = array_values($agrupados);

            return Inertia::render('shifts/create', [
                'turnos' => $shiftsEloquent,
            ]);
        }
    })->name('create-shifts');

    // routes/web.php o routes/api.php
    Route::get('/upload-csv', [ShiftImportController::class, 'index']);
    Route::post('/upload-csv', [ShiftImportController::class, 'importFromStorageToDatabase']);

    Route::get('import-from-storage', [ShiftImportController::class, 'importFromStorage']);

    //importar turnos desde agGrid
    Route::post('turnos/actualizar', function (Request $request) {
        $data = $request->validate([
            'nombre' => 'required|string',
            'fecha'  => 'required|date',
            'turno'  => 'required|in:M,T,N',
        ]);

        Shifts::updateOrCreate([
            'nombre' => $data['nombre'],
            'fecha'  => $data['fecha'],
        ], [
            'turno' => $data['turno'],
        ]);

        return response()->json(['message' => 'Turno actualizado']);
    });

});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
