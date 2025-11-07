<?php
// app/Http/Requests/StorePurchaseRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Ajustar según tu sistema de autenticación
    }

    public function rules(): array
    {
        return [
            'proveedor_id' => 'required|exists:providers,id',
            'proveedor_nombre' => 'required|string|max:255',
            'fecha_compra' => 'required|date',
            'tipo_documento' => 'required|in:Factura,Boleta,Guía,Orden de Compra',
            'numero_documento' => 'required|string|unique:purchases,numero_documento',
            'tipo_compra' => 'nullable|string|max:255',
            'responsable' => 'nullable|string|max:255',
            'ubicacion_destino' => 'nullable|string|max:255',
            'monto_total' => 'required|numeric|min:0',
            'observaciones' => 'nullable|string',
            'documentos' => 'nullable|array',
            'documentos.*.nombre' => 'required_with:documentos|string',
            'documentos.*.tipo' => 'required_with:documentos|string',
            'documentos.*.url' => 'required_with:documentos|string',
            'documentos.*.fechaSubida' => 'nullable|date',
            'lotes' => 'nullable|array',
            'lotes.*' => 'exists:items_parents,id',

            // Validación de items
            'items' => 'nullable|array',
            'items.*.nombre' => 'required_with:items|string|max:255',
            'items.*.categoria' => 'required_with:items|string|max:255',
            'items.*.cantidad' => 'required_with:items|integer|min:1',
            'items.*.unidad' => 'nullable|string|max:50',
            'items.*.precioUnitario' => 'nullable|numeric|min:0',
            'items.*.precioTotal' => 'nullable|numeric|min:0',
            'items.*.codigo' => 'nullable|string|max:255',
            'items.*.descripcion' => 'nullable|string',
            'items.*.atributos' => 'nullable|array',
            'items.*.variantes' => 'nullable|array',
            'items.*.variantes.*.nombre' => 'required_with:items.*.variantes|string',
            'items.*.variantes.*.cantidad' => 'required_with:items.*.variantes|integer|min:1',
            'items.*.variantes.*.atributos' => 'nullable|array',
            'items.*.variantes.*.valorUnitario' => 'nullable|numeric|min:0',
            'items.*.fechaIngreso' => 'nullable|date',
            'items.*.estado' => 'nullable|string|max:50',
            'items.*.ubicacion' => 'nullable|string|max:255',
            'items.*.responsable' => 'nullable|string|max:255',
        ];
    }

    public function messages(): array
    {
        return [
            'proveedor_id.required' => 'El proveedor es obligatorio',
            'proveedor_id.exists' => 'El proveedor seleccionado no existe',
            'proveedor_nombre.required' => 'El nombre del proveedor es obligatorio',
            'fecha_compra.required' => 'La fecha de compra es obligatoria',
            'fecha_compra.date' => 'La fecha de compra debe ser válida',
            'tipo_documento.required' => 'El tipo de documento es obligatorio',
            'tipo_documento.in' => 'El tipo de documento no es válido',
            'numero_documento.required' => 'El número de documento es obligatorio',
            'numero_documento.unique' => 'Este número de documento ya está registrado',
            'monto_total.required' => 'El monto total es obligatorio',
            'monto_total.numeric' => 'El monto total debe ser un número',
            'monto_total.min' => 'El monto total no puede ser negativo',
            'lotes.*.exists' => 'Uno o más lotes seleccionados no existen',
        ];
    }

    /**
     * Preparar datos antes de la validación
     * Útil para formatear datos del frontend
     */
    protected function prepareForValidation(): void
    {
        // Si el frontend envía itemId en vez de item_id, lo normaliza
        if ($this->has('proveedorId')) {
            $this->merge([
                'proveedor_id' => $this->proveedorId,
            ]);
        }

        if ($this->has('proveedorNombre')) {
            $this->merge([
                'proveedor_nombre' => $this->proveedorNombre,
            ]);
        }

        if ($this->has('fechaCompra')) {
            $this->merge([
                'fecha_compra' => $this->fechaCompra,
            ]);
        }

        if ($this->has('tipoDocumento')) {
            $this->merge([
                'tipo_documento' => $this->tipoDocumento,
            ]);
        }

        if ($this->has('numeroDocumento')) {
            $this->merge([
                'numero_documento' => $this->numeroDocumento,
            ]);
        }

        if ($this->has('tipoCompra')) {
            $this->merge([
                'tipo_compra' => $this->tipoCompra,
            ]);
        }

        if ($this->has('ubicacionDestino')) {
            $this->merge([
                'ubicacion_destino' => $this->ubicacionDestino,
            ]);
        }

        if ($this->has('montoTotal')) {
            $this->merge([
                'monto_total' => $this->montoTotal,
            ]);
        }
    }
}
