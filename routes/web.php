<?php

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

    Route::get('shifts/create', function () {
        $ruta  = storage_path('app/turnos/julio-alerta_movil.csv');
        $datos = [];

        if (file_exists($ruta)) {
            $file    = fopen($ruta, 'r');
            $headers = fgetcsv($file); // Primera fila: encabezados

            while (($line = fgetcsv($file)) !== false) {
                $datos[] = array_combine($headers, $line);
            }

            fclose($file);
        }

        return Inertia::render('shifts/create', [
            'shifts' => $datos,
        ]);
    })->name('create-shifts');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
