<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class TurnController extends Controller
{
    public function index()
    {
        $path = storage_path('app/turnos/turnos_mes_julio.csv');

        if (!file_exists($path)) {
            return response()->json(['error' => 'Archivo no encontrado'], 404);
        }

        $rows = array_map('str_getcsv', file($path));
        if (empty($rows)) {
            return response()->json([]);
        }

        // Limpieza del BOM
        $headers = $rows[0];
        $headers[0] = preg_replace('/\x{FEFF}/u', '', $headers[0]);

        $data = [];
        foreach (array_slice($rows, 1) as $row) {
            if (count($row) !== count($headers)) {
                continue;
            }

            $item = array_combine($headers, $row);

            // Filtra turnos válidos
            if (!in_array($item['Turno'], ['N', 'M', 'T'])) {
                continue;
            }

            $data[] = $item;
        }

        return response()->json($data);
    }
}
