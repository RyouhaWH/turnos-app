<?php

namespace App\Http\Controllers;

use App\Models\EmployeeAssignment;
use App\Models\EmployeeShifts;
use App\Models\Employees;
use App\Models\Rol;
use App\Models\Sector;
use App\Models\Vehicle;
use App\Services\AssignmentService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class EmployeeAssignmentController extends Controller
{
    public function __construct(private AssignmentService $service) {}

    // Turnos que implican presencia activa en servicio
    private const WORKING_SHIFTS = ['M', 'T', 'N', '1', '2', '3'];

    private const SHIFT_LABELS = [
        'M' => 'Mañana',
        'T' => 'Tarde',
        'N' => 'Noche',
        '1' => '1er Turno',
        '2' => '2do Turno',
        '3' => '3er Turno',
    ];

    // Orden de visualización por turno base
    private const SHIFT_ORDER = ['M' => 0, 'T' => 1, 'N' => 2, '1' => 3, '2' => 4, '3' => 5];

    /**
     * Assignment management page.
     * Only shows employees currently on a working shift, grouped by rol → shift.
     */
    public function index(Request $request)
    {
        $date = $request->query('date', Carbon::today('America/Santiago')->toDateString());

        $operationalRolIds = Rol::where('is_operational', true)->pluck('id');

        // Mapa de turnos activos para la fecha: employee_id → shift
        $shiftMap = EmployeeShifts::whereDate('date', $date)
            ->pluck('shift', 'employee_id')
            ->toArray();

        // Mapa de asignaciones para la fecha: employee_id → assignment
        $assignmentMap = EmployeeAssignment::with(['sector', 'vehicle'])
            ->whereDate('date', $date)
            ->get()
            ->keyBy('employee_id');

        $employees = Employees::with('rol')
            ->whereIn('rol_id', $operationalRolIds)
            ->orderBy('name')
            ->get()
            ->filter(function ($emp) use ($shiftMap) {
                $shift = strtoupper($shiftMap[$emp->id] ?? '');
                if (empty($shift)) return false;

                // Obtener turno base (sin sufijo 'e'/'E' de turno extra)
                $base = in_array(substr($shift, -1), ['E']) ? substr($shift, 0, -1) : $shift;
                return in_array($base, self::WORKING_SHIFTS);
            })
            ->map(function ($emp) use ($shiftMap, $assignmentMap) {
                $shiftRaw = strtoupper($shiftMap[$emp->id]);
                $isExtra  = str_ends_with($shiftRaw, 'E');
                $base     = $isExtra ? substr($shiftRaw, 0, -1) : $shiftRaw;
                $label    = (self::SHIFT_LABELS[$base] ?? $base) . ($isExtra ? ' (Extra)' : '');

                $a = $assignmentMap[$emp->id] ?? null;

                return [
                    'id'                => $emp->id,
                    'name'              => $emp->name,
                    'first_name'        => $emp->first_name,
                    'paternal_lastname' => $emp->paternal_lastname,
                    'rol_id'            => $emp->rol_id,
                    'rol_name'          => $emp->rol?->nombre,
                    'rol_color'         => $emp->rol?->color,
                    'amzoma'            => $emp->amzoma,
                    'shift'             => $shiftRaw,
                    'shift_base'        => $base,
                    'shift_label'       => $label,
                    'shift_order'       => self::SHIFT_ORDER[$base] ?? 99,
                    'assignment'        => $a ? [
                        'id'         => $a->id,
                        'sector_id'  => $a->sector_id,
                        'vehicle_id' => $a->vehicle_id,
                        'notes'      => $a->notes,
                    ] : null,
                ];
            })
            ->values();

        return inertia('assignments/index', [
            'date'      => $date,
            'employees' => $employees,
            'sectors'   => Sector::where('is_active', true)->orderBy('name')->get(),
            'vehicles'  => Vehicle::where('is_active', true)->orderBy('name')->get(),
            'roles'     => Rol::where('is_operational', true)->orderBy('nombre')->get(),
        ]);
    }

    /**
     * Upsert a single employee assignment.
     */
    public function upsert(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'date'        => 'required|date',
            'sector_id'   => 'nullable|exists:sectors,id',
            'vehicle_id'  => 'nullable|exists:vehicles,id',
            'notes'       => 'nullable|string|max:500',
        ]);

        $assignment = $this->service->upsert(
            $validated['employee_id'],
            $validated['date'],
            $validated['sector_id'] ?? null,
            $validated['vehicle_id'] ?? null,
            $validated['notes'] ?? null,
        );

        return response()->json([
            'success'    => true,
            'assignment' => $assignment,
        ]);
    }

    /**
     * Bulk upsert assignments for multiple employees on the same date.
     */
    public function bulkUpsert(Request $request)
    {
        $validated = $request->validate([
            'date'               => 'required|date',
            'assignments'        => 'required|array|min:1',
            'assignments.*.employee_id' => 'required|exists:employees,id',
            'assignments.*.sector_id'   => 'nullable|exists:sectors,id',
            'assignments.*.vehicle_id'  => 'nullable|exists:vehicles,id',
            'assignments.*.notes'       => 'nullable|string|max:500',
        ]);

        $results = $this->service->bulkUpsert($validated['date'], $validated['assignments']);

        return response()->json([
            'success' => true,
            'count'   => count($results),
        ]);
    }

    /**
     * Dashboard-oriented grouped view: rol → sector → employees.
     */
    public function grouped(Request $request)
    {
        $date = $request->query('date', Carbon::today('America/Santiago')->toDateString());

        return response()->json([
            'success' => true,
            'date'    => $date,
            'data'    => $this->service->getGroupedByRolAndSector($date),
        ]);
    }
}
