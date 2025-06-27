<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmployeeShifts extends Model
{
    protected $fillable = [
        'id',
        'fecha',
        'turno',
        'observacion',
    ];
    public function employee()
    {
        return $this->belongsTo(Employees::class);
    }
}
