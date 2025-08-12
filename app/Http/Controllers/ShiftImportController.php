<?php
namespace App\Http\Controllers;

use App\Models\Employees;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ShiftImportController extends Controller
{

    public function index()
    {
        return Inertia::render('shifts/upload-csv-v2');
    }

    public function importFromPostToDatabase(Request $request)
    {


          $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $rows = array_map('str_getcsv', file($request->file));
        if (empty($rows)) {
            return response()->json([]);
        }

        $headers = $rows[0];
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
        $this->uploadToDatabase($formatedData['data'], $formatedData['month'], $formatedData['year']);

        return back()->with('success', 'Archivo importado correctamente');
    }

    public function importFromStorageToDatabase(Request $request)
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
        $this->uploadToDatabase($formatedData['data'], $formatedData['month'], $formatedData['year']);

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

        return [
            'data' => $resultadoFinal,
            'month' => $mes,
            'year' => $anio
        ];
    }

    public function formatName(string $nombre): string
    {
        return mb_convert_case(mb_strtolower($nombre, 'UTF-8'), MB_CASE_TITLE, 'UTF-8');
    }

    public function uploadToDatabase(array $turnosData, int $month, int $year)
    {
        //traer nombres e id de funcionario
        $empleados = Employees::all();

        // Crear un mapa: nombre formateado => ID
        $mapaNombres = [];
        $mapaRuts = [];

        foreach ($empleados as $emp) {
            $nombreFormateado = $this->formatName($emp->name);
            $mapaNombres[$nombreFormateado] = $emp->id;

            // También crear mapa por RUT si existe
            if ($emp->rut) {
                $mapaRuts[$emp->rut] = $emp->id;
            }
        }

        logger("Mapeo creado: " . count($mapaNombres) . " nombres, " . count($mapaRuts) . " RUTs");

        foreach ($turnosData as $registro) {
            $nombre = $this->formatName($registro['Nombre']);
            $employeeId = null;

            // Primero intentar por nombre exacto
            if (isset($mapaNombres[$nombre])) {
                $employeeId = $mapaNombres[$nombre];
                logger("Empleado encontrado por nombre: {$nombre} -> ID: {$employeeId}");
            } else {
                // Si no se encuentra por nombre, intentar por RUT
                // Asumiendo que el CSV puede tener una columna RUT o que el nombre incluye RUT
                $rutFromName = $this->extractRutFromName($nombre);

                if ($rutFromName && isset($mapaRuts[$rutFromName])) {
                    $employeeId = $mapaRuts[$rutFromName];
                    logger("Empleado encontrado por RUT: {$rutFromName} -> ID: {$employeeId}");
                } else {
                    // Último intento: búsqueda por similitud de nombre
                    $employeeId = $this->findEmployeeBySimilarName($nombre, $empleados);
                    if ($employeeId) {
                        logger("Empleado encontrado por similitud: {$nombre} -> ID: {$employeeId}");
                    } else {
                        logger("Nombre no encontrado: {$nombre}");
                        continue;
                    }
                }
            }

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

                if (!empty($turnosProcesados)) {
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

    /**
     * Extrae RUT de un nombre que puede contener RUT
     */
    private function extractRutFromName(string $nombre): ?string
    {
        // Patrón para encontrar RUT chileno (formato: 12345678-9 o 12345678-K)
        if (preg_match('/(\d{7,8}-[\dkK])/', $nombre, $matches)) {
            return $matches[1];
        }

        // Si el nombre es solo un RUT
        if (preg_match('/^\d{7,8}-[\dkK]$/', trim($nombre))) {
            return trim($nombre);
        }

        return null;
    }

    /**
     * Busca empleado por similitud de nombre con mejor manejo de caracteres especiales
     */
    private function findEmployeeBySimilarName(string $nombre, $empleados): ?int
    {
        $nombreNormalized = $this->normalizeString($nombre);

        foreach ($empleados as $emp) {
            $empNameNormalized = $this->normalizeString($emp->name);

            // 1. Verificar si el nombre del empleado contiene el nombre del CSV
            if (strpos($empNameNormalized, $nombreNormalized) !== false) {
                return $emp->id;
            }

            // 2. Verificar si el nombre del CSV contiene el nombre del empleado
            if (strpos($nombreNormalized, $empNameNormalized) !== false) {
                return $emp->id;
            }

            // 3. Verificar similitud por palabras individuales
            $nombreWords = explode(' ', $nombreNormalized);
            $empWords = explode(' ', $empNameNormalized);

            $commonWords = array_intersect($nombreWords, $empWords);
            if (count($commonWords) >= 2) { // Al menos 2 palabras en común
                return $emp->id;
            }

            // 4. Verificar similitud por apellidos (últimas 2 palabras)
            if (count($nombreWords) >= 2 && count($empWords) >= 2) {
                $nombreApellidos = array_slice($nombreWords, -2);
                $empApellidos = array_slice($empWords, -2);

                if (array_intersect($nombreApellidos, $empApellidos)) {
                    return $emp->id;
                }
            }

            // 5. Verificar similitud por primer nombre y primer apellido
            if (count($nombreWords) >= 2 && count($empWords) >= 2) {
                if ($nombreWords[0] === $empWords[0] && end($nombreWords) === end($empWords)) {
                    return $emp->id;
                }
            }

            // 6. Verificar similitud por distancia de Levenshtein para typos
            if ($this->isSimilarByLevenshtein($nombreNormalized, $empNameNormalized)) {
                return $emp->id;
            }

            // 7. Verificar similitud por palabras individuales con typos
            if ($this->hasSimilarWords($nombreWords, $empWords)) {
                return $emp->id;
            }
        }

        return null;
    }

    /**
     * Verifica similitud usando distancia de Levenshtein
     */
    private function isSimilarByLevenshtein(string $str1, string $str2): bool
    {
        $distance = levenshtein($str1, $str2);
        $maxLength = max(strlen($str1), strlen($str2));

        // Si la distancia es menor al 30% de la longitud máxima, consideramos similar
        return $maxLength > 0 && ($distance / $maxLength) < 0.3;
    }

    /**
     * Verifica si hay palabras similares entre dos arrays de palabras
     */
    private function hasSimilarWords(array $words1, array $words2): bool
    {
        foreach ($words1 as $word1) {
            foreach ($words2 as $word2) {
                if (strlen($word1) > 3 && strlen($word2) > 3) { // Solo palabras de más de 3 caracteres
                    $distance = levenshtein($word1, $word2);
                    $maxLength = max(strlen($word1), strlen($word2));

                    if ($maxLength > 0 && ($distance / $maxLength) < 0.25) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Normaliza una cadena para comparación (remueve acentos, convierte a minúsculas, etc.)
     */
    private function normalizeString(string $str): string
    {
        // Convertir a minúsculas
        $str = mb_strtolower($str, 'UTF-8');

        // Remover acentos y caracteres especiales
        $str = $this->removeAccents($str);

        // Remover caracteres especiales y espacios extra
        $str = preg_replace('/[^a-z0-9\s]/', '', $str);
        $str = preg_replace('/\s+/', ' ', $str);

        return trim($str);
    }

    /**
     * Remueve acentos de una cadena
     */
    private function removeAccents(string $str): string
    {
        $unwanted_array = [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ñ' => 'n',
            'Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U', 'Ñ' => 'N',
            'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u',
            'À' => 'A', 'È' => 'E', 'Ì' => 'I', 'Ò' => 'O', 'Ù' => 'U',
            'ä' => 'a', 'ë' => 'e', 'ï' => 'i', 'ö' => 'o', 'ü' => 'u',
            'Ä' => 'A', 'Ë' => 'E', 'Ï' => 'I', 'Ö' => 'O', 'Ü' => 'U',
            'â' => 'a', 'ê' => 'e', 'î' => 'i', 'ô' => 'o', 'û' => 'u',
            'Â' => 'A', 'Ê' => 'E', 'Î' => 'I', 'Ô' => 'O', 'Û' => 'U',
            'ã' => 'a', 'õ' => 'o', 'Ã' => 'A', 'Õ' => 'O',
            'ç' => 'c', 'Ç' => 'C'
        ];

        return strtr($str, $unwanted_array);
    }
}
