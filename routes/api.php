<?php

use App\Http\Controllers\TurnController;
use App\Models\EmployeeShifts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use League\Csv\Reader;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/test', function () {
    return response()->json(['ok' => true]);
});

Route::get('/turnos-alerta_movil', [TurnController::class, 'index']);

Route::get('montly-shifts', function () {

    $csvPath = storage_path('app/turnos/julio_alertaMovil.csv'); // asegúrate de tenerlo aquí
    $csv = Reader::createFromPath($csvPath, 'r');
    $csv->setHeaderOffset(0); // usa la primera fila como encabezado

    $records = iterator_to_array($csv->getRecords());

    return response()->json($records);
});

Route::get('/turnos', function () {

    $turnos = EmployeeShifts::all()->groupBy('employee_id');
    $result = [];

    foreach ($turnos as $nombre => $grupito) {
        $fila = ['nombre' => $nombre];
        foreach ($grupito as $turno) {
            $dia = \Carbon\Carbon::parse($turno->fecha)->day;
            $fila[(string)$dia] = $turno->turno;
        }
        $result[] = $fila;
    }

    return response()->json($result);
});




