<?php
namespace App\Http\Controllers;

use App\Models\EmployeeShifts;
use App\Models\Shifts;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use League\Csv\Reader;

class ShiftsController extends Controller
{

    public function index()
    {
        return Inertia::render('shifts-manager');
    }


    public function getShifts()
    {
        $data = $this->getShiftsfromDB();
        dd($data);

        $data = empty($data) ? $this->getShiftsfromCSV();

        $formateado = array_values($agrupados);

        return Inertia::render('shifts/create', [
            'turnos' => $formateado,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'fecha'   => 'required|date',
            'turno'   => 'required|string|max:10',
        ]);

        $turno = Shifts::updateOrCreate(
            ['user_id' => $request->user_id, 'fecha' => $request->fecha],
            [
                'turno'       => $request->turno,
                'observacion' => $request->observacion,
                'editado_por' => auth::id(),
            ]
        );

        return redirect()->back()->with('success', 'Turno guardado');
    }

    public function getShiftsfromDB(): array
    {
        $agrupados = [];

        $shiftsEloquent = EmployeeShifts::whereMonth('date', 7)
            ->whereYear('date', 2025)
            ->with('employee') // si tienes la relación definida
            ->get()
            ->groupBy('employee_id');

        foreach ($shiftsEloquent->toArray() as $shifts) {


            foreach ($shifts as $shift) {



                $nombre = $shift['employee']['name'];
                $fecha  = $shift['date'];
                $turno  = strtoupper($shift['shift']);

                $dia = (int) date('d', strtotime($fecha)); // 1..31

                if (! isset($agrupados[$nombre])) {

                    $agrupados[$nombre] = [
                        'id'     => Str::slug($nombre, '_'),
                        'nombre' => $nombre,
                    ];

                    dd($agrupados);
                }

                dd($agrupados);

                $agrupados[$nombre][strval($dia)] = in_array($turno, ['M', 'T', 'N', 'F', 'L', 'LM', 'PE', 'S', 'LC']) ? $turno : '';

            }
        }

        return $agrupados;
    }

    public function getShiftsfromCSV(): array
    {
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

        return $agrupados;
    }
}
