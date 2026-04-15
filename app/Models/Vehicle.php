<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vehicle extends Model
{
    protected $fillable = [
        'name',
        'plate_number',
        'type',
        'status',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function assignments(): HasMany
    {
        return $this->hasMany(EmployeeAssignment::class);
    }

    public static function types(): array
    {
        return ['patrol', 'motorcycle', 'bicycle', 'drone', 'van', 'other'];
    }

    public static function statuses(): array
    {
        return ['available', 'in_use', 'maintenance', 'inactive'];
    }
}
