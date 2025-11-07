<?php
// app/Models/ItemParent.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ItemParent extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'items_parents';

    protected $fillable = [
        'purchase_id',
        'nombre',
        'categoria',
        'cantidad',
        'unidad',
        'valor_unitario',
        'valor_total',
        'atributos_comunes',
        'fecha_ingreso',
        'totales',
        'variantes',
        'codigo',
        'descripcion',
        'estado',
        'ubicacion',
        'responsable',
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'valor_unitario' => 'decimal:2',
        'valor_total' => 'decimal:2',
        'atributos_comunes' => 'array',
        'totales' => 'array',
        'variantes' => 'array',
        'fecha_ingreso' => 'date',
    ];

    // Relaciones
    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    public function items()
    {
        return $this->hasMany(Item::class, 'parent_id');
    }

    // Métodos helper
    public function updateTotales(): void
    {
        $items = $this->items;

        $this->totales = [
            'cantidad' => $this->cantidad,
            'asignados' => $items->whereIn('estado', ['Asignado', 'En uso'])->count(),
            'disponibles' => $items->where('estado', 'Disponible')->count(),
            'baja' => $items->where('estado', 'Dado de baja')->count(),
        ];

        $this->save();
    }
}
