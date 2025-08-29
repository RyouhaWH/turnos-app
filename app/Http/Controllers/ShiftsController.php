<?php
namespace App\Http\Controllers;

use App\Models\Employees;
use App\Models\EmployeeShifts;
use App\Models\ShiftChangeLog;
use App\Models\Shifts;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use League\Csv\Reader;

class ShiftsController extends Controller
{

    public function index(Request $request)
    {
        return Inertia::render('shifts/index');
    }

    /**
     * Traer los turnos de todas las facciones del día de hoy.
     * pedir en un selector, el día deseado y con el filtrar.
     */
    public function getDailyShifts()
    {
        return Inertia::render('shifts/daily');
    }

    public function getMonthlyShifts($id)
    {
        $data = $this->getShiftsfromDB($id);

        //$data = empty($data) ? $this->getShiftsfromCSV() : $data;

        $formateado = array_values($data);

        return Inertia::render('shifts/createv2', [
            'turnos'          => $formateado,
            'employee_rol_id' => $id,
        ]);
    }

    public function getHistory($id)
    {
        return ShiftChangeLog::where('employee_shift_id', $id)
            ->with('user')
            ->orderByDesc('changed_at')
            ->get();
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

    public function getShiftsfromDB($rolId): array
    {
        $actualDate = Carbon::now('America/Santiago');
        $year       = $actualDate->year;
        $month      = $actualDate->month;

        // Obtener todos los empleados del rol (incluso sin turnos)
        $employees = Employees::where('rol_id', $rolId)->get();

        // Obtener turnos existentes
        $shiftsEloquent = EmployeeShifts::whereMonth('date', $month)
            ->whereYear('date', $year)
            ->whereHas('employee', function ($query) use ($rolId) {
                $query->where('rol_id', $rolId);
            })
            ->with('employee')
            ->get()
            ->groupBy('employee_id');

        // Calcular días del mes
        $daysInMonth = Carbon::create($year, $month)->daysInMonth;

        $agrupados = [];

        // Inicializar todos los empleados con días vacíos
        foreach ($employees as $employee) {
            $agrupados[$employee->name] = [
                'id'     => $employee->id,
                'nombre' => $employee->name,
                'rut'    => $employee->rut,
                'first_name' => $employee->first_name,
                'paternal_lastname' => $employee->paternal_lastname,
                'maternal_lastname' => $employee->maternal_lastname,
                'employee_id' => $employee->id, // Agregar también employee_id para compatibilidad
                'amzoma' => $employee->amzoma, // Agregar campo amzoma
            ];

            // Inicializar todos los días del mes como vacíos
            for ($dia = 1; $dia <= $daysInMonth; $dia++) {
                $agrupados[$employee->name][strval($dia)] = '';
            }
        }

        // Llenar con los turnos existentes
        foreach ($shiftsEloquent->toArray() as $shifts) {
            foreach ($shifts as $shift) {
                $nombre = $shift['employee']['name'];
                $fecha  = $shift['date'];
                $turno  = strtoupper($shift['shift']);
                $dia    = (int) date('d', strtotime($fecha));

                // Solo actualizar si el empleado existe en nuestro array
                if (isset($agrupados[$nombre])) {
                    $agrupados[$nombre][strval($dia)] = $turno;
                }
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
