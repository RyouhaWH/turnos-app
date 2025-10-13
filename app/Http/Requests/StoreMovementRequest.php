<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMovementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Ajustar según autenticación
    }

    public function rules(): array
    {
        return [
            'item_id' => 'required|exists:items,id',
            'tipo' => 'required|in:Ingreso,Asignación,Devolución,Mantenimiento,Baja',
            'responsable' => 'required|string|max:255',
            'asignado_a' => 'nullable|string|max:255',
            'ubicacion_origen' => 'nullable|string|max:255',
            'ubicacion_destino' => 'nullable|string|max:255',
            'observaciones' => 'required|string',
            'fecha' => 'required|date',
            'archivos' => 'nullable|array',
            'archivos.*.nombre' => 'required_with:archivos|string',
            'archivos.*.tipo' => 'required_with:archivos|in:foto,acta,documento',
            'archivos.*.url' => 'required_with:archivos|string',
        ];
    }

    public function messages(): array
    {
        return [
            'item_id.required' => 'El ítem es obligatorio',
            'item_id.exists' => 'El ítem seleccionado no existe',
            'tipo.required' => 'El tipo de movimiento es obligatorio',
            'tipo.in' => 'El tipo de movimiento no es válido',
            'responsable.required' => 'El responsable es obligatorio',
            'observaciones.required' => 'Las observaciones son obligatorias',
            'fecha.required' => 'La fecha es obligatoria',
            'fecha.date' => 'La fecha debe ser válida',
        ];
    }
}
