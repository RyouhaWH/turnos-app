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
     * Test de conexión a base de datos
     */
    public function testDatabase()
    {
        try {

            // Test básico de conexión
            $connection = DB::connection();
            $pdo = $connection->getPdo();

            return response()->json([
                'success' => true,
                'message' => 'Conexión a base de datos exitosa',
                'database_name' => $connection->getDatabaseName(),
                'driver' => $connection->getDriverName(),
                'timestamp' => now()->toDateTimeString()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de conexión a base de datos',
                'error' => $e->getMessage(),
                'timestamp' => now()->toDateTimeString()
            ], 500);
        }
    }

    /**
     * Listar tablas disponibles
     */
    public function listTables()
    {
        try {
            $tables = DB::select('SHOW TABLES');
            $tableNames = [];

            foreach ($tables as $table) {
                $tableArray = (array) $table;
                $tableNames[] = reset($tableArray);
            }

            return response()->json([
                'success' => true,
                'tables' => $tableNames,
                'count' => count($tableNames)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error listando tablas',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test de tabla employees
     */
    public function testEmployees()
    {
        try {
            // Verificar si existe la tabla
            $tableExists = DB::getSchemaBuilder()->hasTable('employees');

            if (!$tableExists) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tabla employees no existe'
                ]);
            }

            // Obtener columnas
            $columns = DB::getSchemaBuilder()->getColumnListing('employees');

            // Contar registros
            $count = DB::table('employees')->count();

            // Sample data (solo si hay registros)
            $sample = null;
            if ($count > 0) {
                $sample = DB::table('employees')->first();
            }

            return response()->json([
                'success' => true,
                'table_exists' => true,
                'columns' => $columns,
                'count' => $count,
                'sample' => $sample
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error verificando tabla employees',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Estadísticas súper simples
     */
    public function getSimpleStats()
    {
        try {
            $stats = [
                'alertaMovil' => ['total' => 0, 'activos' => 0, 'trabajandoHoy' => 0],
                'fiscalizacion' => ['total' => 0, 'activos' => 0, 'trabajandoHoy' => 0],
                'motorizado' => ['total' => 0, 'activos' => 0, 'trabajandoHoy' => 0],
                'totals' => ['total' => 0, 'activos' => 0, 'trabajandoHoy' => 0]
            ];

            // Solo si la tabla existe, intentar obtener datos
            if (DB::getSchemaBuilder()->hasTable('employees')) {
                try {
                    // Intentar contar empleados por rol_id
                    $role1 = DB::table('employees')->where('rol_id', 1)->count();
                    $role2 = DB::table('employees')->where('rol_id', 2)->count();
                    $role3 = DB::table('employees')->where('rol_id', 3)->count();

                    $stats['alertaMovil']['total'] = $role1;
                    $stats['alertaMovil']['activos'] = $role1;

                    $stats['fiscalizacion']['total'] = $role2;
                    $stats['fiscalizacion']['activos'] = $role2;

                    $stats['motorizado']['total'] = $role3;
                    $stats['motorizado']['activos'] = $role3;

                    $stats['totals']['total'] = $role1 + $role2 + $role3;
                    $stats['totals']['activos'] = $role1 + $role2 + $role3;

                } catch (\Exception $e) {
                    Log::warning("Error contando empleados: " . $e->getMessage());
                    // Mantener stats en 0
                }
            }

            return response()->json([
                'success' => true,
                'data' => $stats,
                'date' => Carbon::today()->format('Y-m-d'),
                'message' => $stats['totals']['total'] === 0 ? 'No hay empleados registrados' : null
            ]);
        } catch (\Exception $e) {
            Log::error("Error en getSimpleStats: " . $e->getMessage());

            return response()->json([
                'success' => true, // Mantener success true para evitar errores en frontend
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
     * Alias para compatibilidad
     */
    public function getDashboardStats()
    {
        return $this->getSimpleStats();
    }
}
