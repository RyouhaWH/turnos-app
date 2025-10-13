<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'parent_id' => 'nullable|exists:items_parents,id',
            'nombre' => 'required|string|max:255',
            'categoria' => 'required|string|max:255',
            'sku' => 'required|string|unique:items,sku',
            'codigo' => 'nullable|string|max:255',
            'estado' => 'required|in:Disponible,Asignado,En uso,En mantenimiento,Mantenimiento,Dado de baja',
            'ubicacion' => 'required|string|max:255',
            'responsable' => 'nullable|string|max:255',
            'valor_unitario' => 'nullable|numeric|min:0',
            'atributos' => 'nullable|array',
            'fecha_ingreso' => 'nullable|date',
        ];
    }
}
