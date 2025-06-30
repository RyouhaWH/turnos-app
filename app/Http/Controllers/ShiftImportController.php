<?php

namespace App\Http\Controllers;

use App\Models\Shifts;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftImportController extends Controller
{

    public function index(){

        return Inertia::render('shifts/upload-csv');
    }


    public function importar(Request $request)
    {

        dd($request->all());

        $request->validate([
            'archivo' => 'required|file|mimes:csv,txt',
        ]);


        $path = $request->file('archivo')->getPathname();
        $reader = ReaderEntityFactory::createCSVReader();
        $reader->open($path);

        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $i => $row) {
                $cells = $row->toArray();

                if ($i === 1) continue; // Saltar encabezado

                $nombre = trim($cells[0] ?? '');
                if (empty($nombre)) continue;

                for ($d = 1; $d < count($cells); $d++) {
                    $valor = strtoupper(trim($cells[$d] ?? ''));
                    if (!in_array($valor, ['M', 'T', 'N'])) continue;

                    $fecha = Carbon::create(now()->year, now()->month, $d)->toDateString();

                    Shifts::updateOrCreate([
                        'nombre' => $nombre,
                        'fecha' => $fecha,
                    ], [
                        'turno' => $valor,
                    ]);
                }
            }
        }

        $reader->close();

        return response()->json(['message' => 'Turnos importados con éxito']);
    }
}
