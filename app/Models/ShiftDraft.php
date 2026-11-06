<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Cambio de turno en elaboración: lo ve el supervisor en la planilla,
 * pero los funcionarios no lo ven hasta que se publica.
 */
class ShiftDraft extends Model
{
    protected $fillable = ['rol_id', 'employee_id', 'date', 'shift', 'updated_by'];

    public function employee()
    {
        return $this->belongsTo(Employees::class, 'employee_id');
    }
}
