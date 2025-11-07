<?php
// app/Models/Item.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Boot del modelo para generar SKU automáticamente
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($item) {
            if (empty($item->sku)) {
                $item->sku = static::generateSku($item);
            }
        });
    }

    /**
     * Generar SKU único automáticamente
     * Formato: CATEGORIA-PURCHASEID-BATCHID-CONTADOR
     * Ejemplo: TEC-5-2-0001
     */
    protected static function generateSku($item): string
    {
        // Prefijo de 3 letras basado en la categoría
        $prefix = strtoupper(substr($item->categoria ?? 'ITEM', 0, 3));
        $purchaseId = $item->purchase_id ?? 0;
        $batchId = $item->parent_batch_id ?? 0;

        // Buscar el último SKU con este patrón para obtener el siguiente número
        $pattern = "{$prefix}-{$purchaseId}-{$batchId}-%";
        $lastItem = static::withTrashed()
            ->where('sku', 'LIKE', $pattern)
            ->orderBy('id', 'desc')
            ->first();

        $counter = 1;
        if ($lastItem) {
            // Extraer el número del último SKU
            $parts = explode('-', $lastItem->sku);
            if (count($parts) >= 4) {
                $counter = intval($parts[3]) + 1;
            }
        }

        return sprintf('%s-%d-%d-%04d', $prefix, $purchaseId, $batchId, $counter);
    }

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

    // Alias usando el campo parent_batch_id
    public function parentBatch()
    {
        return $this->belongsTo(ItemParent::class, 'parent_batch_id');
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
