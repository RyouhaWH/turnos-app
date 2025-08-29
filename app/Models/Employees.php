<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employees extends Model
{
    protected $fillable = [
        'name',
        'first_name',
        'paternal_lastname',
        'maternal_lastname',
        'rut',
        'phone',
        'email',
        'address',
        'position',
        'department',
        'start_date',
        'status',
        'amzoma',
        'rol_id',
        'user_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'amzoma' => 'boolean',
    ];

    public function rol()
    {
        return $this->belongsTo(Rol::class, 'rol_id');
    }

    public function shifts()
    {
        return $this->hasMany(EmployeeShifts::class, 'employee_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
