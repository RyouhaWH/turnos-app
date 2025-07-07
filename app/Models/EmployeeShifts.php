<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeShifts extends Model
{
    protected $fillable = [
        'id',
        'employee_id',
        'date',
        'shift',
        'comments',
    ];
    public function employee()
    {
        return $this->belongsTo(Employees::class);
    }
}
