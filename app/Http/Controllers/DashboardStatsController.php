<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class DashboardStatsController extends Controller
{
    /**
     * Obtener estadísticas generales del dashboard
     */
    public function getDashboardStats()
    {
        try {
            $today = Carbon::today();

            // Obtener estadísticas por rol con manejo de errores
            $alertaMovilStats = $this->getStatsForRole(1, $today);
            $fiscalizacionStats = $this->getStatsForRole(2, $today);
            $motorizadoStats = $this->getStatsForRole(3, $today);

            // Calcular totales de forma segura
            $totalTotal = ($alertaMovilStats['total'] ?? 0) + ($fiscalizacionStats['total'] ?? 0) + ($motorizadoStats['total'] ?? 0);
            $totalActivos = ($alertaMovilStats['activos'] ?? 0) + ($fiscalizacionStats['activos'] ?? 0) + ($motorizadoStats['activos'] ?? 0);
            $totalTrabajandoHoy = ($alertaMovilStats['trabajandoHoy'] ?? 0) + ($fiscalizacionStats['trabajandoHoy'] ?? 0) + ($motorizadoStats['trabajandoHoy'] ?? 0);

            return response()->json([
                'success' => true,
                'data' => [
                    'alertaMovil' => [
                        'total' => $alertaMovilStats['total'] ?? 0,
                        'activos' => $alertaMovilStats['activos'] ?? 0,
                        'trabajandoHoy' => $alertaMovilStats['trabajandoHoy'] ?? 0
                    ],
                    'fiscalizacion' => [
                        'total' => $fiscalizacionStats['total'] ?? 0,
                        'activos' => $fiscalizacionStats['activos'] ?? 0,
                        'trabajandoHoy' => $fiscalizacionStats['trabajandoHoy'] ?? 0
                    ],
                    'motorizado' => [
                        'total' => $motorizadoStats['total'] ?? 0,
                        'activos' => $motorizadoStats['activos'] ?? 0,
                        'trabajandoHoy' => $motorizadoStats['trabajandoHoy'] ?? 0
                    ],
                    'totals' => [
                        'total' => $totalTotal,
                        'activos' => $totalActivos,
                        'trabajandoHoy' => $totalTrabajandoHoy
                    ]
                ],
                'date' => $today->format('Y-m-d'),
                'message' => $totalTotal === 0 ? 'No hay datos cargados para hoy' : null
            ]);
        } catch (\Exception $e) {
            Log::error("Error en getDashboardStats: " . $e->getMessage());

            return response()->json([
                'success' => true, // Mantenemos success=true para evitar errores en frontend
                'data' => [
                    'alertaMovil' => ['total' => 0, 'activos' => 0, 'trabajandoHoy' => 0],
                    'fiscalizacion' => ['total' => 0, 'activos' => 0, 'trabajandoHoy' => 0],
                    'motorizado' => ['total' => 0, 'activos' => 0, 'trabajandoHoy' => 0],
                    'totals' => ['total' => 0, 'activos' => 0, 'trabajandoHoy' => 0]
                ],
                'date' => Carbon::today()->format('Y-m-d'),
                'message' => 'Sistema iniciando - sin datos disponibles',
                'error_details' => config('app.debug') ? $e->getMessage() : null
            ]);
        }
    }

    /**
     * Obtener estadísticas para un rol específico
     */
    public function getStatsForRole($roleId, $date = null)
    {
        if (!$date) {
            $date = Carbon::today();
        }

        // Total de empleados por rol
        $totalEmpleados = DB::table('employees')
            ->where('role_id', $roleId)
            ->where('active', true) // Asumiendo que tienes un campo active
            ->count();

        // Empleados activos (que no están en licencia médica, vacaciones largas, etc.)
        $empleadosActivos = DB::table('employees')
            ->where('role_id', $roleId)
            ->where('active', true)
            ->where(function($query) {
                $query->whereNull('status')
                      ->orWhereNotIn('status', ['licencia_medica', 'vacaciones_largas', 'suspendido']);
            })
            ->count();

        // Empleados trabajando hoy (tienen turno asignado)
        $trabajandoHoy = $this->getWorkingTodayCount($roleId, $date);

        return [
            'total' => $totalEmpleados,
            'activos' => $empleadosActivos,
            'trabajandoHoy' => $trabajandoHoy
        ];
    }

    /**
     * Contar empleados trabajando hoy
     */
    private function getWorkingTodayCount($roleId, $date)
    {
        $dateString = $date->format('Y-m-d');

        // Buscar en la tabla de turnos (ajusta según tu estructura)
        $trabajandoHoy = DB::table('shifts as s')
            ->join('employees as e', 's.employee_id', '=', 'e.id')
            ->where('e.role_id', $roleId)
            ->where('s.date', $dateString)
            ->whereNotNull('s.shift_type')
            ->whereNotIn('s.shift_type', ['F', 'L', 'V', 'LM']) // Excluir francos, libres, vacaciones, licencias
            ->count();

        return $trabajandoHoy;
    }

    /**
     * Obtener detalles de personal por rol y fecha
     */
    public function getPersonalDetails($roleId, $date = null)
    {
        try {
            if (!$date) {
                $date = Carbon::today();
            } else {
                $date = Carbon::parse($date);
            }

            $dateString = $date->format('Y-m-d');

            // Obtener empleados con sus turnos del día
            $personal = DB::table('employees as e')
                ->leftJoin('shifts as s', function($join) use ($dateString) {
                    $join->on('e.id', '=', 's.employee_id')
                         ->where('s.date', '=', $dateString);
                })
                ->where('e.role_id', $roleId)
                ->where('e.active', true)
                ->select([
                    'e.id',
                    'e.name',
                    'e.status',
                    's.shift_type',
                    's.date as shift_date'
                ])
                ->get();

            // Clasificar personal
            $trabajando = $personal->filter(function($emp) {
                return $emp->shift_type && !in_array($emp->shift_type, ['F', 'L', 'V', 'LM']);
            });

            $descanso = $personal->filter(function($emp) {
                return in_array($emp->shift_type, ['F', 'L']);
            });

            $ausente = $personal->filter(function($emp) {
                return in_array($emp->shift_type, ['V', 'LM', 'S']) ||
                       in_array($emp->status, ['licencia_medica', 'vacaciones_largas']);
            });

            $sinTurno = $personal->filter(function($emp) {
                return !$emp->shift_type;
            });

            return response()->json([
                'success' => true,
                'data' => [
                    'roleId' => $roleId,
                    'date' => $dateString,
                    'summary' => [
                        'total' => $personal->count(),
                        'trabajando' => $trabajando->count(),
                        'descanso' => $descanso->count(),
                        'ausente' => $ausente->count(),
                        'sinTurno' => $sinTurno->count()
                    ],
                    'personal' => [
                        'trabajando' => $trabajando->values(),
                        'descanso' => $descanso->values(),
                        'ausente' => $ausente->values(),
                        'sinTurno' => $sinTurno->values()
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener detalles de personal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estadísticas por período (para gráficos)
     */
    public function getStatsForPeriod(Request $request)
    {
        try {
            $startDate = $request->input('start_date', Carbon::now()->startOfMonth());
            $endDate = $request->input('end_date', Carbon::now()->endOfMonth());
            $roleId = $request->input('role_id');

            $startDate = Carbon::parse($startDate);
            $endDate = Carbon::parse($endDate);

            $stats = [];
            $currentDate = $startDate->copy();

            while ($currentDate <= $endDate) {
                $dateString = $currentDate->format('Y-m-d');

                if ($roleId) {
                    $dayStats = $this->getStatsForRole($roleId, $currentDate);
                } else {
                    // Todas las áreas
                    $alertaMovil = $this->getStatsForRole(1, $currentDate);
                    $fiscalizacion = $this->getStatsForRole(2, $currentDate);
                    $motorizado = $this->getStatsForRole(3, $currentDate);

                    $dayStats = [
                        'total' => $alertaMovil['total'] + $fiscalizacion['total'] + $motorizado['total'],
                        'activos' => $alertaMovil['activos'] + $fiscalizacion['activos'] + $motorizado['activos'],
                        'trabajandoHoy' => $alertaMovil['trabajandoHoy'] + $fiscalizacion['trabajandoHoy'] + $motorizado['trabajandoHoy']
                    ];
                }

                $stats[] = [
                    'date' => $dateString,
                    'day_name' => $currentDate->translatedFormat('l'),
                    'stats' => $dayStats
                ];

                $currentDate->addDay();
            }

            return response()->json([
                'success' => true,
                'data' => $stats,
                'period' => [
                    'start' => $startDate->format('Y-m-d'),
                    'end' => $endDate->format('Y-m-d')
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas del período',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
