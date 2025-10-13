<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employees extends Model
{
    protected $fillable = [
        'name',
        'first_name',
        'paternal_lastname',
        'maternal_lastname',
        'rut',
        'phone',
        'email',
        'address',
        'position',
        'department',
        'start_date',
        'status',
        'amzoma',
        'rol_id',
        'user_id',
    ];

    protected $casts = [
        'start_date' => 'date',
        'amzoma' => 'boolean',
    ];

    /**
     * Accessor para obtener solo el primer nombre
     * Maneja casos donde first_name contiene múltiples nombres
     */
    public function getOnlyFirstNameAttribute(): string
    {
        if (!$this->first_name) {
            return '';
        }

        // Divide el campo first_name por espacios y toma solo el primero
        $names = explode(' ', trim($this->first_name));
        return $names[0] ?? '';
    }

    /**
     * Accessor para obtener nombre completo formateado
     * Formato: Primer nombre + Apellido paterno
     */
    public function getFormattedNameAttribute(): string
    {
        $firstName = $this->only_first_name;
        $lastName = $this->paternal_lastname ?? '';

        return trim($firstName . ' ' . $lastName);
    }

    /**
     * Accessor para obtener nombre completo
     * Formato: Primer nombre + Todos los nombres + Apellidos
     */
    public function getFullNameAttribute(): string
    {
        $parts = array_filter([
            $this->first_name,
            $this->paternal_lastname,
            $this->maternal_lastname
        ]);

        return implode(' ', $parts);
    }

    /**
     * Scope para empleados activos
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'activo');
    }

    /**
     * Scope para empleados de Amzoma
     */
    public function scopeAmzoma($query)
    {
        return $query->where('amzoma', true);
    }

    /**
     * Scope para empleados por departamento
     */
    public function scopeByDepartment($query, string $department)
    {
        return $query->where('department', $department);
    }

    // Relaciones
    public function rol()
    {
        return $this->belongsTo(Rol::class, 'rol_id');
    }

    public function shifts()
    {
        return $this->hasMany(EmployeeShifts::class, 'employee_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
