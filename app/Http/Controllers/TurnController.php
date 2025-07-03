<?php
namespace App\Http\Controllers;

use App\Models\EmployeeShifts;
use League\Csv\Reader;

class TurnController extends Controller
{
    //api
    public function index()
    {
        $path = storage_path('app/turnos/julio_alertaMovil.csv');

        if (! file_exists($path)) {
            return response()->json(['error' => 'Archivo no encontrado'], 404);
        }

        $rows = array_map('str_getcsv', file($path));
        if (empty($rows)) {
            return response()->json([]);
        }

        // Limpieza del BOM
        $headers    = $rows[0];
        $headers[0] = preg_replace('/\x{FEFF}/u', '', $headers[0]);

        $data = [];

        foreach (array_slice($rows, 1) as $row) {
            if (count($row) !== count($headers)) {
                continue;
            }

            $item = array_combine($headers, $row);

            // Filtra para mostrar solo turnos omitiendo libres
            if (! in_array($item['Turno'], ['N', 'M', 'T'])) {
                continue;
            }

            $data[] = $item;
        }

        return response()->json($data);
    }

    public function getFilteredShiftsFromCSV()
    {
        $csvPath = storage_path('app/turnos/julio_alertaMovil.csv');
        $csv     = Reader::createFromPath($csvPath, 'r');
        // usa la primera fila como encabezado
        $csv->setHeaderOffset(0);

        $records = iterator_to_array($csv->getRecords());

        return response()->json($records);
    }

    public function getShiftsFromDB()
    {
        $turnos = EmployeeShifts::all()->groupBy('employee_id');
        $result = [];

        foreach ($turnos as $nombre => $grupito) {
            $fila = ['nombre' => $nombre];
            foreach ($grupito as $turno) {
                $dia                 = \Carbon\Carbon::parse($turno->fecha)->day;
                $fila[(string) $dia] = $turno->turno;
            }
            $result[] = $fila;
        }

        if (! empty($result)) {
            return response()->json($result);
        } else {
            return response('no hay turnos en base de datos');
        }
    }
}
