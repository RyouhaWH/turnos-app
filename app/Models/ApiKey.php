<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ApiKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'key',
        'description',
        'is_active',
        'expired_at',
        'last_used_at'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_used_at' => 'datetime',
        'expired_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Generar una nueva API key
     */
    public static function generateKey(): string
    {
        return 'turnos_' . Str::random(32) . '_' . time();
    }

    /**
     * Validar si la API key es válida (activa y no expirada)
     */
    public function isValid(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->expired_at && $this->expired_at->isPast()) {
            return false;
        }

        return true;
    }

    /**
     * Actualizar última utilización
     */
    public function recordUsage(): void
    {
        $this->update(['last_used_at' => now()]);
    }
}
