<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    protected $fillable = [
        'nombre',
        'is_operational',
        'color',
        'planning_settings',
    ];

    protected $casts = [
        'is_operational' => 'boolean',
        'planning_settings' => 'array',
    ];

    public function usuarios()
    {
        return $this->hasMany(User::class);
    }

    public function employees()
    {
        return $this->hasMany(Employees::class, 'rol_id');
    }
}
