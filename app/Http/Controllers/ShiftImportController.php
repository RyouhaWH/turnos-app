<?php
namespace App\Http\Controllers;

use App\Models\Employees;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ShiftImportController extends Controller
{

    public function index()
    {
        return Inertia::render('shifts/upload-csv-v2');
    }

    public function importFromStorage()
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

            $data[] = $item;
        }

        $formatedData = $this->formatData($data);
        $this->uploadToDatabase($formatedData);

        return response()->json($formatedData);

    }

    public function formatData(array $data): array
    {

        if (! $data) {
            die("Error al decodificar JSON");
        }

        // Obtener mes y año desde el primer registro
        $fechaInicio = $data[0]['Fecha'];
        $anio        = (int) date('Y', strtotime($fechaInicio));
        $mes         = (int) date('m', strtotime($fechaInicio));
        $ultimoDia   = (int) date('t', strtotime($fechaInicio));

        // Agrupar datos por nombre
        $personas = [];

        foreach ($data as $registro) {
            $nombre = $this->formatName($registro['Nombre']);

            // Si no existe el arreglo para la persona, inicializarlo con días vacíos
            if (! isset($personas[$nombre])) {
                $personas[$nombre] = [];
                for ($d = 1; $d <= $ultimoDia; $d++) {
                    $personas[$nombre][$d] = ''; // turno vacío por defecto
                }
            }

            $dia                     = (int) date('d', strtotime($registro['Fecha']));
            $personas[$nombre][$dia] = $registro['Turno'];
        }

        $resultadoFinal = [];

        foreach ($personas as $nombre => $turnos) {
            $resultadoFinal[] = [
                'Nombre' => $nombre,
                'Turnos' => $turnos,
            ];
        }
        return $resultadoFinal;
    }

    public function formatName(string $nombre): string
    {
        return mb_convert_case(mb_strtolower($nombre, 'UTF-8'), MB_CASE_TITLE, 'UTF-8');
    }

    public function uploadToDatabase(array $turnosData)
    {
        $month = 7;
        $year  = 2025;

        //traer nombres e id de funcionario
        $empleados = Employees::all();

        // Crear un mapa: nombre formateado => ID
        $mapaNombres = [];

        foreach ($empleados as $emp) {
            $nombreFormateado               = $this->formatName($emp->name);
            $mapaNombres[$nombreFormateado] = $emp->id;
        }

        foreach ($turnosData as $registro) {

            $nombre = $this->formatName($registro['Nombre']);

            if (! isset($mapaNombres[$nombre])) {
                logger("Nombre no encontrado: $nombre");
                continue;
            }

            $employeeId = $mapaNombres[$nombre];

            $turnosProcesados = [];

            foreach ($registro['Turnos'] as $dia => $turno) {

                if (empty($turno)) {
                    continue;
                }

                $fecha = sprintf('%04d-%02d-%02d', $year, $month, $dia);

                $turnosProcesados[] = [
                    'employee_id' => $employeeId,
                    'date'        => $fecha,
                    'shift'       => $turno,
                    'comments'    => 'Importado desde post',
                ];

                if (! empty($turnosProcesados)) {

                    foreach ($turnosProcesados as $turno) {

                        DB::table('employee_shifts')->updateOrInsert([
                            'employee_id' => $turno['employee_id'],
                            'date'        => $turno['date']], [
                            'shift'    => $turno['shift'],
                            'comments' => 'Importado desde post v2',
                        ]);

                    }

                }

            }

        }

    }

}
