<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShiftChangeLog extends Model
{
    use HasFactory;

    protected $table = 'shift_change_logs';

    protected $fillable = [
        'employee_shift_id',
        'employee_id',
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

    public function employeeShift()
    {
        return $this->belongsTo(EmployeeShifts::class, 'employee_shift_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employees::class, 'employee_id');
    }
}
