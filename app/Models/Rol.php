<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{
    protected $fillable = [
        'nombre',
        'is_operational',
        'color'
    ];

    protected $casts = [
        'is_operational' => 'boolean'
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
