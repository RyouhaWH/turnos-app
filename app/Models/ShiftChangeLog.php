<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;


class ShiftChangeLog extends Model
{
    use HasFactory;

    protected $table = 'shift_change_logs';

    protected $fillable = [
        'employee_shift_id',
        'changed_by',
        'old_shift',
        'new_shift',
        'comment',
        'changed_at',
    ];

    protected $dates = ['changed_at'];

    public function shift()
    {
        return $this->belongsTo(EmployeeShifts::class, 'employee_shift_id');
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
