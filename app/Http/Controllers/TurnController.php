<?php
namespace App\Http\Controllers;

use App\Models\EmployeeShifts;
use App\Models\ShiftChangeLog;
use Illuminate\Support\Facades\Log;
use League\Csv\Reader;
use Illuminate\Support\Str;


/**
 * Controlador dedicado al manejo de datos mediante api
 * Revisar a futuro el tema de tokens de autenticación para
 * hacer llamados desde fuera de la app
 */
class TurnController extends Controller
{
    //
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

    public function getShiftsChangeLogByEmployee($employeeId)
    {

        $logs = ShiftChangeLog::with(['changedBy', 'employeeShift.employee'])
            ->whereHas('employeeShift', function ($query) use ($employeeId) {
                $query->where('employee_id', $employeeId);
            })
            ->orderBy('changed_at', 'desc')
            ->get()
            ->map(function ($log) {
                return [
                    'employee'   => $log->employee->name,
                    'old_shift'  => $log->old_shift,
                    'new_shift'  => $log->new_shift,
                    'comment'    => $log->comment,
                    'changed_at' => $log->changed_at->format('Y-m-d H:i:s'),
                    'changed_by' => optional($log->changedBy)->name ?? 'Desconocido',
                ];
            });

        Log::info('🪵 Logs del empleado ' . $logs);

        return response()->json($logs);

    }

    public function getShiftsChangeLog()
    {

        $logs = ShiftChangeLog::with(['changedBy', 'employeeShift.employee'])
            ->orderBy('changed_at', 'desc')
            ->take(50)
            ->get()
            ->map(function ($log) {
                return [
                    'old_shift'   => $log->old_shift,
                    'new_shift'   => $log->new_shift,
                    'comment'     => $log->comment,
                    'changed_at'  => $log->changed_at ? \Carbon\Carbon::parse($log->changed_at)->format('Y-m-d H:i:s') : null,
                    'changed_by'  => optional($log->changedBy)->name ?? 'Desconocido',
                    'empleado'    => optional(optional($log->employeeShift)->employee)->name ?? 'Desconocido',
                    // Si quieres devolver el objeto completo:
                    // 'empleado' => $log->employeeShift?->employee,
                ];
            });


        return response()->json($logs);

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

    public function getMonthlyShifts($year, $month, $rolId)
    {
        $data = $this->getShiftsfromDBByDate($year, $month, $rolId);

        return response($data);
    }

    public function getShiftsfromDBByDate($year, $month, $rolId): array
    {
        $agrupados = [];

        $shiftsEloquent = EmployeeShifts::whereMonth('date', $month)
            ->whereYear('date', $year)
            ->whereHas('employee', function ($query) use ($rolId) {
                $query->where('rol_id', $rolId);
            })
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

                }

                $agrupados[$nombre][strval($dia)] = $turno;
            }
        }
        return $agrupados;
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
