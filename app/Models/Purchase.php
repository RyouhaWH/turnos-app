<?php
// app/Models/Purchase.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Purchase extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'proveedor_id',
        'proveedor_nombre',
        'fecha_compra',
        'tipo_documento',
        'numero_documento',
        'tipo_compra',
        'responsable',
        'ubicacion_destino',
        'monto_total',
        'observaciones',
        'documentos',
        'lotes',
    ];

    protected $casts = [
        'fecha_compra' => 'date',
        'monto_total' => 'decimal:2',
        'documentos' => 'array',
        'lotes' => 'array',
    ];

    // Relaciones
    public function provider()
    {
        return $this->belongsTo(Provider::class, 'proveedor_id');
    }

    public function itemParents()
    {
        return $this->hasMany(ItemParent::class, 'purchase_id');
    }
}
