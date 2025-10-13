<?php
namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;
    use HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'items_asignados',
        'activo',
        'rol',
        'departamento',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'items_asignados'   => 'array',
            'activo'            => 'boolean',
        ];
    }

    // Scopes
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function scopeByRol($query, string $rol)
    {
        return $query->where('rol', $rol);
    }

    public function scopeByDepartamento($query, string $departamento)
    {
        return $query->where('departamento', $departamento);
    }

    // Relaciones
    public function rol()
    {
        return $this->belongsTo(rol::class);
    }

    public function shifts()
    {
        return $this->belongsTo(shifts::class);
    }

    public function employee()
    {
        return $this->hasOne(Employees::class);
    }

}
