<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class WhatsAppRecipient extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'phone',
        'role',
        'identifier_id',
        'is_active',
    ];
}
