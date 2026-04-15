<?php

namespace App\Services;

use App\Models\AssignmentLog;
use App\Models\EmployeeAssignment;
use App\Models\Employees;
use App\Models\Rol;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AssignmentService
{
    /**
     * Upsert a sector/vehicle assignment for one employee on a given date.
     * Returns the assignment and records an audit log entry.
     */
    public function upsert(int $employeeId, string $date, ?int $sectorId, ?int $vehicleId, ?string $notes = null): EmployeeAssignment
    {
        return DB::transaction(function () use ($employeeId, $date, $sectorId, $vehicleId, $notes) {
            $existing = EmployeeAssignment::where('employee_id', $employeeId)
                ->whereDate('date', $date)
                ->first();

            $oldSectorId  = $existing?->sector_id;
            $oldVehicleId = $existing?->vehicle_id;

            $assignment = EmployeeAssignment::updateOrCreate(
                ['employee_id' => $employeeId, 'date' => $date],
                [
                    'sector_id'   => $sectorId,
                    'vehicle_id'  => $vehicleId,
                    'assigned_by' => Auth::id(),
                    'notes'       => $notes,
                ]
            );

            // Only log if something actually changed
            if ($oldSectorId !== $sectorId || $oldVehicleId !== $vehicleId) {
                AssignmentLog::create([
                    'employee_id'     => $employeeId,
                    'assignment_id'   => $assignment->id,
                    'changed_by'      => Auth::id(),
                    'assignment_date' => $date,
                    'old_sector_id'   => $oldSectorId,
                    'new_sector_id'   => $sectorId,
                    'old_vehicle_id'  => $oldVehicleId,
                    'new_vehicle_id'  => $vehicleId,
                ]);
            }

            return $assignment->load(['sector', 'vehicle', 'employee']);
        });
    }

    /**
     * Bulk upsert assignments for multiple employees on the same date.
     * Payload: [['employee_id' => x, 'sector_id' => y, 'vehicle_id' => z], ...]
     */
    public function bulkUpsert(string $date, array $items): array
    {
        $results = [];
        foreach ($items as $item) {
            $results[] = $this->upsert(
                $item['employee_id'],
                $date,
                $item['sector_id'] ?? null,
                $item['vehicle_id'] ?? null,
                $item['notes'] ?? null,
            );
        }
        return $results;
    }

    /**
     * Get assignments for a date grouped by rol → sector.
     * Used by the dashboard API to enrich employee status data.
     *
     * Returns: [ employee_id => ['sector_id', 'sector_name', 'sector_color', 'vehicle_id', 'vehicle_name', 'vehicle_type'] ]
     */
    public function getAssignmentMapForDate(string $date): array
    {
        $assignments = EmployeeAssignment::with(['sector', 'vehicle'])
            ->whereDate('date', $date)
            ->get();

        $map = [];
        foreach ($assignments as $a) {
            $map[$a->employee_id] = [
                'sector_id'    => $a->sector_id,
                'sector_name'  => $a->sector?->name,
                'sector_color' => $a->sector?->color,
                'vehicle_id'   => $a->vehicle_id,
                'vehicle_name' => $a->vehicle?->name,
                'vehicle_type' => $a->vehicle?->type,
                'notes'        => $a->notes,
            ];
        }

        return $map;
    }

    /**
     * Get all employees for a date grouped by: rol → sector → [employees].
     * Only includes operational roles (is_operational = true).
     */
    public function getGroupedByRolAndSector(string $date): array
    {
        $roles = Rol::where('is_operational', true)->get()->keyBy('id');

        $employees = Employees::with(['rol', 'shifts' => function ($q) use ($date) {
            $q->whereDate('date', $date);
        }])
            ->whereIn('rol_id', $roles->keys())
            ->get();

        $assignmentMap = $this->getAssignmentMapForDate($date);

        $grouped = [];

        foreach ($employees as $employee) {
            $rolId   = $employee->rol_id;
            $rolName = $roles[$rolId]?->nombre ?? 'Sin rol';

            $assignment = $assignmentMap[$employee->id] ?? null;
            $sectorKey  = $assignment['sector_id'] ?? 0;
            $sectorName = $assignment['sector_name'] ?? 'Sin sector';

            $shift = $employee->shifts->first();

            if (!isset($grouped[$rolId])) {
                $grouped[$rolId] = [
                    'rol_id'   => $rolId,
                    'rol_name' => $rolName,
                    'color'    => $roles[$rolId]?->color ?? '#3B82F6',
                    'sectors'  => [],
                ];
            }

            if (!isset($grouped[$rolId]['sectors'][$sectorKey])) {
                $grouped[$rolId]['sectors'][$sectorKey] = [
                    'sector_id'    => $assignment['sector_id'] ?? null,
                    'sector_name'  => $sectorName,
                    'sector_color' => $assignment['sector_color'] ?? null,
                    'employees'    => [],
                ];
            }

            $grouped[$rolId]['sectors'][$sectorKey]['employees'][] = [
                'id'                => $employee->id,
                'name'              => $employee->name,
                'paternal_lastname' => $employee->paternal_lastname,
                'amzoma'            => $employee->amzoma,
                'shift'             => $shift?->shift,
                'sector_id'         => $assignment['sector_id'] ?? null,
                'sector_name'       => $assignment['sector_name'] ?? null,
                'sector_color'      => $assignment['sector_color'] ?? null,
                'vehicle_id'        => $assignment['vehicle_id'] ?? null,
                'vehicle_name'      => $assignment['vehicle_name'] ?? null,
                'vehicle_type'      => $assignment['vehicle_type'] ?? null,
            ];
        }

        // Re-index sectors to plain arrays for JSON
        foreach ($grouped as &$rol) {
            $rol['sectors'] = array_values($rol['sectors']);
        }

        return array_values($grouped);
    }
}
