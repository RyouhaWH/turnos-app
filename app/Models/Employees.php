<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employees extends Model
{
    protected $fillable = [
        'name',
        'amzoma',
        'rol_id',
    ];

    public function puesto()
    {
        return $this->belongsTo(Rol::class);
    }

    public function shifts()
    {
        return $this->hasMany(EmployeeShifts::class);
    }

}
