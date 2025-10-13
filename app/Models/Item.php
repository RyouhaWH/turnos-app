<?php
// app/Models/Item.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'parent_id',
        'parent_batch_id',
        'purchase_id',
        'nombre',
        'categoria',
        'sku',
        'codigo',
        'estado',
        'ubicacion',
        'responsable',
        'unidad',
        'valor_unitario',
        'atributos',
        'historial',
        'fecha_ingreso',
        'fecha_ultimo_movimiento',
        'proveedor_id',
        'proveedor_nombre',
    ];

    protected $casts = [
        'atributos' => 'array',
        'historial' => 'array',
        'fecha_ingreso' => 'date',
        'fecha_ultimo_movimiento' => 'date',
        'valor_unitario' => 'decimal:2',
    ];

    // Relaciones
    public function movements()
    {
        return $this->hasMany(Movement::class);
    }

    public function parent()
    {
        return $this->belongsTo(ItemParent::class, 'parent_id');
    }

    // Scopes
    public function scopeDisponible($query)
    {
        return $query->where('estado', 'Disponible')
                     ->where(function($q) {
                         $q->whereNull('responsable')
                           ->orWhere('responsable', '')
                           ->orWhere('responsable', 'Sin asignar');
                     });
    }

    public function scopeAsignado($query)
    {
        return $query->where('estado', 'Asignado')
                     ->orWhere(function($q) {
                         $q->whereNotNull('responsable')
                           ->where('responsable', '!=', '')
                           ->where('responsable', '!=', 'Sin asignar');
                     });
    }

    public function scopeBySku($query, string $sku)
    {
        return $query->where('sku', $sku);
    }

    public function scopeByCategoria($query, string $categoria)
    {
        return $query->where('categoria', $categoria);
    }

    public function scopeByEstado($query, string $estado)
    {
        return $query->where('estado', $estado);
    }

    public function scopeByResponsable($query, string $responsable)
    {
        return $query->where('responsable', $responsable);
    }

    // Métodos helper
    public function addHistorialEntry(string $evento, string $responsable, ?string $detalles = null): void
    {
        $historial = $this->historial ?? [];
        $historial[] = [
            'fecha' => now()->format('Y-m-d'),
            'evento' => $evento,
            'responsable' => $responsable,
            'detalles' => $detalles,
        ];
        $this->historial = $historial;
        $this->save();
    }

    public function isDisponible(): bool
    {
        return $this->estado === 'Disponible' &&
               (empty($this->responsable) || $this->responsable === 'Sin asignar');
    }

    public function isAsignado(): bool
    {
        return $this->estado === 'Asignado' ||
               (!empty($this->responsable) && $this->responsable !== 'Sin asignar');
    }
}
