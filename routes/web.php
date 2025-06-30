<?php

use App\Http\Controllers\ShiftImportController;
use App\Models\Shifts;
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

    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('personal', function () {

        return Inertia::render('staff');
    })->name('staff-personal');

    // Route::get('shifts/create', function () {
    //     $ruta  = storage_path('app/turnos/julio_alertaMovil.csv');
    //     $datos = [];

    //     if (file_exists($ruta)) {
    //         $file    = fopen($ruta, 'r');
    //         $headers = fgetcsv($file); // Primera fila: encabezados

    //         while (($line = fgetcsv($file)) !== false) {
    //             $datos[] = array_combine($headers, $line);
    //         }

    //         fclose($file);
    //     }

    //     return Inertia::render('shifts/create', [
    //         'shifts' => $datos,
    //     ]);
    // })->name('create-shifts');

    Route::get('shifts', function () {

        $path = storage_path('app/turnos/julio_alertaMovil.csv'); // o donde esté el archivo

        $csv = Reader::createFromPath($path, 'r');
        $csv->setHeaderOffset(0); // usa la primera fila como cabecera

        $registros = iterator_to_array($csv->getRecords());

        // Agrupar por nombre y días
        $agrupados = [];

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

    })->name('create-shifts');

    // routes/web.php o routes/api.php
    Route::get('/import-shifts', [ShiftImportController::class, 'index']);
    // Route::post('/import-shifts-csv', [ShiftImportController::class, 'importar']);
    Route::post('import-shifts-csv', function (Request $request) {

        dd('hola mundo');
    });

    //importar turnos desde agGrid
    Route::post('/api/turnos/actualizar', function (Request $request) {
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
