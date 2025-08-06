<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Rol extends Model
{

    public function usuarios()
    {
        return $this->hasMany(User::class);
    }

    public function employees()
    {
        return $this->hasMany(Employees::class, 'rol_id');
    }
}
