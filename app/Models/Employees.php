<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employees extends Model
{
    protected $fillable = [
        'name',
        'rut',
        'phone',
        'amzoma',
        'rol_id',
    ];

    public function rol()
    {
        return $this->belongsTo(Rol::class, 'rol_id');
    }

    public function shifts()
    {
        return $this->hasMany(EmployeeShifts::class, 'employee_id');
    }
}
