<?php
// app/Models/Provider.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Provider extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'nombre',
        'email',
        'telefono',
        'direccion',
        'contacto',
        'historial_compras',
        'fecha_registro',
    ];

    protected $casts = [
        'historial_compras' => 'array',
        'fecha_registro' => 'date',
    ];

    // Relaciones
    public function purchases()
    {
        return $this->hasMany(Purchase::class, 'proveedor_id');
    }
}
