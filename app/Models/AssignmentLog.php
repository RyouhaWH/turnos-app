<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentLog extends Model
{
    protected $fillable = [
        'employee_id',
        'assignment_id',
        'changed_by',
        'assignment_date',
        'old_sector_id',
        'new_sector_id',
        'old_vehicle_id',
        'new_vehicle_id',
        'comment',
        'changed_at',
    ];

    protected $casts = [
        'assignment_date' => 'date',
        'changed_at'      => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employees::class, 'employee_id');
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(EmployeeAssignment::class, 'assignment_id');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    public function oldSector(): BelongsTo
    {
        return $this->belongsTo(Sector::class, 'old_sector_id');
    }

    public function newSector(): BelongsTo
    {
        return $this->belongsTo(Sector::class, 'new_sector_id');
    }

    public function oldVehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'old_vehicle_id');
    }

    public function newVehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class, 'new_vehicle_id');
    }
}
