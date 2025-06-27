<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shifts extends Model
{
    public function user()
    {
        return $this->belongsTo(user::class);
    }

    public function editor()
    {
        return $this->belongsTo(user::class, 'edited_by');
    }

}
