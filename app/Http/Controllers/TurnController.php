<?php
namespace App\Http\Controllers;

use App\Models\Employees;
use App\Models\EmployeeShifts;
use App\Models\Rol;
use App\Models\ShiftChangeLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use League\Csv\Reader;

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
                    'old_shift'  => $log->old_shift,
                    'new_shift'  => $log->new_shift,
                    'comment'    => $log->comment,
                    'changed_at' => $log->updated_at->format('Y-m-d H:i:s'),
                    'changed_by' => optional($log->changedBy)->name ?? 'Desconocido',
                    'empleado'   => optional(optional($log->employeeShift)->employee)->name ?? 'Desconocido',
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

        return response()->json($data);
    }

    public function getShiftsfromDBByDate($year, $month, $rolId): array
    {
        $agrupados = [];

        $shiftsEloquent = EmployeeShifts::whereMonth('date', $month)
            ->whereYear('date', $year)
            ->whereHas('employee', function ($query) use ($rolId) {
                $query->where('rol_id', $rolId);
            })
            ->with('employee')
            ->get()
            ->groupBy('employee_id');

        if ($shiftsEloquent) {

            $employees = Employees::where('rol_id', $rolId)
                ->get();
            $days = $this->obtenerDiasDelMes($year, $month);

            foreach ($employees as $employee) {
                $nombre = $employee['name'];

                if (! isset($agrupados[$nombre])) {

                    $agrupados[$nombre] = array_merge([
                        'id'     => Str::slug($nombre, '_'),
                        'nombre' => $nombre,
                    ], $days);
                }
            }

            // return $agrupados;
        }

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

    public function obtenerDiasDelMes($year, $month)
    {
        // Convertimos a nombre del mes (ej: "Enero")
        $nombreMes = Carbon::createFromDate($year, $month, 1)->translatedFormat('F');

        // Obtenemos la cantidad de días que tiene el mes
        $diasEnElMes = Carbon::createFromDate($year, $month, 1)->daysInMonth;

        // Creamos un array con claves del 1 al último día del mes
        $dias = [];
        for ($i = 1; $i <= $diasEnElMes; $i++) {
            $dias[$i] = null; // o puedes inicializar con algún valor por defecto
        }

        return $dias;
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

    /**
     * Test básico de conexión
     */
    public function test()
    {
        try {
            return response()->json([
                'success' => true,
                'message' => 'API funcionando correctamente',
                'timestamp' => now()->toDateTimeString(),
                'php_version' => PHP_VERSION,
                'laravel_version' => app()->version()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en test básico',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test de modelos Eloquent
     */
    public function testModels()
    {
        try {
            $results = [];

            // Test modelo Employee
            try {
                $employeesCount = Employees::count();
                $results['employees'] = [
                    'model_exists' => true,
                    'count' => $employeesCount,
                    'sample' => $employeesCount > 0 ? Employees::first() : null
                ];
            } catch (\Exception $e) {
                $results['employees'] = [
                    'model_exists' => false,
                    'error' => $e->getMessage()
                ];
            }

            // Test modelo EmployeeShifts
            try {
                $shiftsCount = EmployeeShifts::count();
                $results['employee_shifts'] = [
                    'model_exists' => true,
                    'count' => $shiftsCount,
                    'sample' => $shiftsCount > 0 ? EmployeeShifts::first() : null
                ];
            } catch (\Exception $e) {
                $results['employee_shifts'] = [
                    'model_exists' => false,
                    'error' => $e->getMessage()
                ];
            }

            // Test modelo Rol
            try {
                $rolesCount = Rol::count();
                $results['roles'] = [
                    'model_exists' => true,
                    'count' => $rolesCount,
                    'sample' => $rolesCount > 0 ? Rol::all() : null
                ];
            } catch (\Exception $e) {
                $results['roles'] = [
                    'model_exists' => false,
                    'error' => $e->getMessage()
                ];
            }

            return response()->json([
                'success' => true,
                'models' => $results
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error general en test de modelos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener información de empleados por rol
     */
    public function getEmployeesByRole()
    {
        try {
            // Contar empleados por rol usando Eloquent
            $employeesByRole = Employees::selectRaw('rol_id, count(*) as total')
                ->groupBy('rol_id')
                ->get()
                ->pluck('total', 'rol_id')
                ->toArray();

            // Obtener nombres de roles si el modelo existe
            $roleNames = [];
            try {
                $roleNames = Rol::pluck('name', 'id')->toArray();
            } catch (\Exception $e) {
                Log::info("No se pudieron obtener nombres de roles: " . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'employees_by_role' => $employeesByRole,
                'role_names' => $roleNames,
                'total_employees' => Employees::count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error obteniendo empleados por rol',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener turnos de hoy
     */
    public function getTodayShifts()
    {
        try {
            $today = Carbon::today();

            // Obtener turnos de hoy con información del empleado
            $todayShifts = EmployeeShifts::with('employee')
                ->whereDate('date', $today)
                ->get();

            // Contar por rol y tipo de turno
            $shiftsByRole = [];
            $shiftTypes = [];

            foreach ($todayShifts as $shift) {
                $roleId = $shift->employee->rol_id ?? 'unknown';
                $shiftType = $shift->shift;

                // Contar por rol
                if (!isset($shiftsByRole[$roleId])) {
                    $shiftsByRole[$roleId] = 0;
                }
                $shiftsByRole[$roleId]++;

                // Contar tipos de turno
                if (!isset($shiftTypes[$shiftType])) {
                    $shiftTypes[$shiftType] = 0;
                }
                $shiftTypes[$shiftType]++;
            }

            return response()->json([
                'success' => true,
                'date' => $today->format('Y-m-d'),
                'total_shifts_today' => $todayShifts->count(),
                'shifts_by_role' => $shiftsByRole,
                'shift_types' => $shiftTypes,
                'shifts' => $todayShifts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error obteniendo turnos de hoy',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Estadísticas del dashboard usando Eloquent
     */
    public function getDashboardStats()
    {
        try {
            $today = Carbon::today();

            // Inicializar estadísticas
            $stats = [
                'alertaMovil' => ['total' => 0, 'activos' => 0, 'trabajandoHoy' => 0],
                'fiscalizacion' => ['total' => 0, 'activos' => 0, 'trabajandoHoy' => 0],
                'motorizado' => ['total' => 0, 'activos' => 0, 'trabajandoHoy' => 0],
                'totals' => ['total' => 0, 'activos' => 0, 'trabajandoHoy' => 0]
            ];

            // 1. PERSONAL TOTAL: Todos los empleados por rol
            $empleadosTotales = Employees::selectRaw('rol_id, count(*) as total')
                ->groupBy('rol_id')
                ->get()
                ->pluck('total', 'rol_id')
                ->toArray();

            // 2. PERSONAL ACTIVO: Empleados con turno asignado HOY (cualquier turno, incluso descanso)
            // Si tienen turno (aunque sea F o L) significa que están programados/activos
            $empleadosActivos = Employees::join('employee_shifts', 'employees.id', '=', 'employee_shifts.employee_id')
                ->whereDate('employee_shifts.date', $today)
                ->whereNotNull('employee_shifts.shift')
                ->where('employee_shifts.shift', '!=', '') // Campo no vacío
                ->selectRaw('employees.rol_id, count(*) as total')
                ->groupBy('employees.rol_id')
                ->get()
                ->pluck('total', 'rol_id')
                ->toArray();

            // 3. TRABAJANDO HOY: Con turno asignado hoy, excluyendo descansos y ausencias
            $trabajandoHoy = Employees::join('employee_shifts', 'employees.id', '=', 'employee_shifts.employee_id')
                ->whereDate('employee_shifts.date', $today)
                ->whereNotNull('employee_shifts.shift')
                ->where('employee_shifts.shift', '!=', '') // Campo no vacío
                ->whereNotIn('employee_shifts.shift', [
                    'F',  // Franco (descanso)
                    'L',  // Libre (descanso)
                    'V',  // Vacaciones
                    'LM', // Licencia Médica
                    'S'   // Sindical
                ])
                ->selectRaw('employees.rol_id, count(*) as total')
                ->groupBy('employees.rol_id')
                ->get()
                ->pluck('total', 'rol_id')
                ->toArray();

            // Mapear roles (1=Alerta Móvil, 2=Fiscalización, 3=Motorizado)
            $roleMap = [
                1 => 'alertaMovil',
                2 => 'fiscalizacion',
                3 => 'motorizado'
            ];

            // Llenar estadísticas
            foreach ($roleMap as $roleId => $roleName) {
                $total = $empleadosTotales[$roleId] ?? 0;
                $activos = $empleadosActivos[$roleId] ?? 0; // Solo quienes tienen turno asignado
                $trabajando = $trabajandoHoy[$roleId] ?? 0;

                $stats[$roleName] = [
                    'total' => $total,
                    'activos' => $activos,
                    'trabajandoHoy' => $trabajando
                ];

                // Sumar a totales
                $stats['totals']['total'] += $total;
                $stats['totals']['activos'] += $activos;
                $stats['totals']['trabajandoHoy'] += $trabajando;
            }

            return response()->json([
                'success' => true,
                'data' => $stats,
                'date' => $today->format('Y-m-d'),
                'message' => $stats['totals']['total'] === 0 ? 'No hay empleados registrados' : null,
                'definitions' => [
                    'total' => 'Todos los empleados registrados en el sistema',
                    'activos' => 'Empleados con turno asignado hoy (incluyendo descansos F, L)',
                    'trabajandoHoy' => 'Empleados trabajando hoy (excluye F, L, V, LM, S)'
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("Error en getDashboardStats: " . $e->getMessage());

            return response()->json([
                'success' => true,
                'data' => [
                    'alertaMovil' => ['total' => 0, 'activos' => 0, 'trabajandoHoy' => 0],
                    'fiscalizacion' => ['total' => 0, 'activos' => 0, 'trabajandoHoy' => 0],
                    'motorizado' => ['total' => 0, 'activos' => 0, 'trabajandoHoy' => 0],
                    'totals' => ['total' => 0, 'activos' => 0, 'trabajandoHoy' => 0]
                ],
                'date' => Carbon::today()->format('Y-m-d'),
                'message' => 'Error interno - usando valores por defecto',
                'error_details' => config('app.debug') ? $e->getMessage() : null
            ]);
        }
    }

    /**
     * Obtener detalles del estado de empleados por categorías
     */
    public function getEmployeeStatus()
    {
        try {
            $today = Carbon::today();

            // Obtener todos los empleados
            $employees = Employees::all();

            // Obtener los turnos de hoy
            $todayShifts = EmployeeShifts::whereDate('date', $today)->get();

            $status = [
                'trabajando' => [], // M, T, N, 1, 2, 3, A
                'descanso' => [],   // F, L
                'ausente' => [],    // V, LM, S
                'sinTurno' => []    // Sin turno asignado hoy (NO ACTIVOS)
            ];

            $counts = [
                'trabajando' => ['total' => 0, 'byRole' => []],
                'descanso' => ['total' => 0, 'byRole' => []],
                'ausente' => ['total' => 0, 'byRole' => []],
                'sinTurno' => ['total' => 0, 'byRole' => []]
            ];

            // Crear un mapa de turnos por empleado_id para acceso rápido
            $shiftsByEmployee = $todayShifts->groupBy('employee_id');

            foreach ($employees as $employee) {
                $roleId = $employee->rol_id;
                $employeeShifts = $shiftsByEmployee->get($employee->id, collect());
                $todayShift = $employeeShifts->first();

                // Inicializar contador de rol si no existe
                if (!isset($counts['sinTurno']['byRole'][$roleId])) {
                    $counts['sinTurno']['byRole'][$roleId] = 0;
                }
                if (!isset($counts['descanso']['byRole'][$roleId])) {
                    $counts['descanso']['byRole'][$roleId] = 0;
                }
                if (!isset($counts['ausente']['byRole'][$roleId])) {
                    $counts['ausente']['byRole'][$roleId] = 0;
                }
                if (!isset($counts['trabajando']['byRole'][$roleId])) {
                    $counts['trabajando']['byRole'][$roleId] = 0;
                }

                if (!$todayShift || !$todayShift->shift || trim($todayShift->shift) === '') {
                    // Sin turno asignado = NO ACTIVO HOY
                    $status['sinTurno'][] = [
                        'id' => $employee->id,
                        'name' => $employee->name ?? 'Sin nombre',
                        'rol_id' => $roleId,
                        'reason' => 'Sin turno programado'
                    ];
                    $counts['sinTurno']['total']++;
                    $counts['sinTurno']['byRole'][$roleId]++;

                } elseif (in_array($todayShift->shift, ['F', 'L'])) {
                    // En descanso programado = ACTIVO (tienen turno asignado)
                    $status['descanso'][] = [
                        'id' => $employee->id,
                        'name' => $employee->name ?? 'Sin nombre',
                        'rol_id' => $roleId,
                        'shift' => $todayShift->shift,
                        'shift_label' => $todayShift->shift === 'F' ? 'Franco' : 'Libre'
                    ];
                    $counts['descanso']['total']++;
                    $counts['descanso']['byRole'][$roleId]++;

                } elseif (in_array($todayShift->shift, ['V', 'LM', 'S'])) {
                    // Ausente pero programado = ACTIVO (tienen turno asignado)
                    $shiftLabels = [
                        'V' => 'Vacaciones',
                        'LM' => 'Licencia Médica',
                        'S' => 'Sindical'
                    ];

                    $status['ausente'][] = [
                        'id' => $employee->id,
                        'name' => $employee->name ?? 'Sin nombre',
                        'rol_id' => $roleId,
                        'shift' => $todayShift->shift,
                        'shift_label' => $shiftLabels[$todayShift->shift] ?? $todayShift->shift
                    ];
                    $counts['ausente']['total']++;
                    $counts['ausente']['byRole'][$roleId]++;

                } else {
                    // Trabajando = ACTIVO (M, T, N, 1, 2, 3, A)
                    $shiftLabels = [
                        'M' => 'Mañana', 'T' => 'Tarde', 'N' => 'Noche',
                        '1' => '1er Turno', '2' => '2do Turno', '3' => '3er Turno',
                        'A' => 'Administrativo'
                    ];

                    $status['trabajando'][] = [
                        'id' => $employee->id,
                        'name' => $employee->name ?? 'Sin nombre',
                        'rol_id' => $roleId,
                        'shift' => $todayShift->shift,
                        'shift_label' => $shiftLabels[$todayShift->shift] ?? $todayShift->shift
                    ];
                    $counts['trabajando']['total']++;
                    $counts['trabajando']['byRole'][$roleId]++;
                }
            }

            // Calcular totales de activos (todos excepto sinTurno)
            $totalActivos = $counts['trabajando']['total'] + $counts['descanso']['total'] + $counts['ausente']['total'];
            $totalEmpleados = $employees->count();

            // Definir nombres de roles
            $roles = [
                1 => 'Alerta Móvil',
                2 => 'Fiscalización',
                3 => 'Motorizado',
                4 => 'Administrativo',
                5 => 'Dron',
                6 => 'Ciclopatrullaje',
                7 => 'Personal de Servicio',
                8 => 'Despachadores'
            ];

            return response()->json([
                'success' => true,
                'date' => $today->format('Y-m-d'),
                'data' => [
                    'status' => $status,
                    'counts' => $counts,
                    'totalActivos' => $totalActivos,
                    'totalEmpleados' => $totalEmpleados,
                    'roles' => $roles
                ],
                'definitions' => [
                    'trabajando' => 'Turnos de trabajo: M, T, N, 1, 2, 3, A',
                    'descanso' => 'Descansos programados: F (Franco), L (Libre)',
                    'ausente' => 'Ausencias programadas: V (Vacaciones), LM (Licencia Médica), S (Sindical)',
                    'sinTurno' => 'Sin turno asignado = NO ACTIVOS hoy',
                    'activos' => 'trabajando + descanso + ausente (tienen turno asignado)',
                    'inactivos' => 'sinTurno (no tienen turno asignado)'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error obteniendo estado de empleados',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    public function getDebugInfo()
    {
        try {
            $info = [
                'employees_count' => 0,
                'shifts_count' => 0,
                'roles_count' => 0,
                'employees_by_role' => [],
                'recent_shifts' => [],
                'models_status' => []
            ];

            // Test Employee model
            try {
                $info['employees_count'] = Employees::count();
                $info['employees_by_role'] = Employees::selectRaw('rol_id, count(*) as total')
                    ->groupBy('rol_id')
                    ->get()
                    ->pluck('total', 'rol_id')
                    ->toArray();
                $info['models_status']['Employee'] = 'OK';
            } catch (\Exception $e) {
                $info['models_status']['Employee'] = 'ERROR: ' . $e->getMessage();
            }

            // Test EmployeeShifts model
            try {
                $info['shifts_count'] = EmployeeShifts::count();
                $info['recent_shifts'] = EmployeeShifts::with('employee')
                    ->orderBy('date', 'desc')
                    ->limit(5)
                    ->get();
                $info['models_status']['EmployeeShifts'] = 'OK';
            } catch (\Exception $e) {
                $info['models_status']['EmployeeShifts'] = 'ERROR: ' . $e->getMessage();
            }

            // Test Rol model
            try {
                $info['roles_count'] = Rol::count();
                $info['roles'] = Rol::all();
                $info['models_status']['Rol'] = 'OK';
            } catch (\Exception $e) {
                $info['models_status']['Rol'] = 'ERROR: ' . $e->getMessage();
            }

            return response()->json([
                'success' => true,
                'debug_info' => $info,
                'timestamp' => now()->toDateTimeString()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error en debug info',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
