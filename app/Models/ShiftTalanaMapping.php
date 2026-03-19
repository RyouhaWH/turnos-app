<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftTalanaMapping extends Model
{
    protected $fillable = [
        'shift_code',
        'talana_id',
        'description'
    ];
}
