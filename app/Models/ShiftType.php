<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftType extends Model
{
    public const CATEGORIES = ['work', 'off', 'absence'];

    public const COLORS = ['amber', 'teal', 'indigo', 'sky', 'cyan', 'violet', 'pink', 'orange', 'green', 'red', 'slate', 'gray'];

    protected $fillable = [
        'code', 'name', 'category', 'starts_at', 'ends_at', 'hours',
        'base_code', 'is_extra', 'color', 'sort_order', 'is_active',
    ];

    protected $casts = [
        'hours' => 'float',
        'is_extra' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /** Códigos activos del catálogo. */
    public static function activeCodes(): array
    {
        return static::where('is_active', true)->pluck('code')->all();
    }
}
