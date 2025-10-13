<?php
// app/Models/Movement.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Movement extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_id',
        'tipo',
        'responsable',
        'asignado_a',
        'ubicacion_origen',
        'ubicacion_destino',
        'observaciones',
        'fecha',
        'archivos',
    ];

    protected $casts = [
        'archivos' => 'array',
        'fecha' => 'date',
    ];

    // Relaciones
    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    // Scopes
    public function scopeByTipo($query, string $tipo)
    {
        return $query->where('tipo', $tipo);
    }

    public function scopeByResponsable($query, string $responsable)
    {
        return $query->where('responsable', $responsable);
    }

    public function scopeByFecha($query, string $fecha)
    {
        return $query->whereDate('fecha', $fecha);
    }

    public function scopeRecientes($query, int $limit = 10)
    {
        return $query->orderBy('fecha', 'desc')
                     ->orderBy('created_at', 'desc')
                     ->limit($limit);
    }
}
