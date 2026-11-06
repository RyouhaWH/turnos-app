<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftPublication extends Model
{
    protected $fillable = ['rol_id', 'year', 'month', 'published_by', 'changes_count', 'employees_count', 'notified'];

    protected $casts = ['notified' => 'boolean'];

    public function publisher()
    {
        return $this->belongsTo(User::class, 'published_by');
    }
}
