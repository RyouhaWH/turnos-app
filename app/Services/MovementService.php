<?php
// app/Services/MovementService.php

namespace App\Services;

use App\Models\Item;
use App\Models\Movement;
use Illuminate\Support\Facades\DB;
use Exception;

class MovementService
{
    /**
     * Crear un movimiento Y actualizar el ítem automáticamente
     *
     * ESTA ES LA MISMA LÓGICA QUE MovementService.ts
     * Ahora en PHP con transacciones DB
     */
    public function createMovementWithItemUpdate(array $data): array
    {
        return DB::transaction(function () use ($data) {
            // 1. Validar que el ítem existe
            $item = Item::find($data['item_id']);
            if (!$item) {
                throw new Exception("Ítem con ID {$data['item_id']} no encontrado");
            }

            // 2. Validaciones de negocio
            $this->validateMovement($item, $data);

            // 3. Crear el movimiento
            $movement = Movement::create([
                'item_id' => $data['item_id'],
                'tipo' => $data['tipo'],
                'responsable' => $data['responsable'],
                'asignado_a' => $data['asignado_a'] ?? null,
                'ubicacion_origen' => $data['ubicacion_origen'] ?? null,
                'ubicacion_destino' => $data['ubicacion_destino'] ?? null,
                'observaciones' => $data['observaciones'],
                'fecha' => $data['fecha'],
                'archivos' => $data['archivos'] ?? null,
            ]);

            // 4. Calcular cambios para el ítem
            $itemUpdates = $this->calculateItemUpdates($item, $data);

            // 5. Actualizar el ítem
            $item->update($itemUpdates);

            return [
                'movement' => $movement->fresh(),
                'updated_item' => $item->fresh(),
            ];
        });
    }

    /**
     * LÓGICA DE NEGOCIO PRINCIPAL
     * COPIADA EXACTA de MovementService.calculateItemUpdates()
     */
    private function calculateItemUpdates(Item $item, array $movement): array
    {
        $updates = [];

        // Actualizar estado y responsable según tipo de movimiento
        switch ($movement['tipo']) {
            case 'Asignación':
                $updates['estado'] = 'Asignado';
                $updates['responsable'] = $movement['asignado_a'] ?? $movement['responsable'];
                if (!empty($movement['ubicacion_destino'])) {
                    $updates['ubicacion'] = $movement['ubicacion_destino'];
                }
                break;

            case 'Devolución':
                $updates['estado'] = 'Disponible';
                $updates['responsable'] = null;
                if (!empty($movement['ubicacion_destino'])) {
                    $updates['ubicacion'] = $movement['ubicacion_destino'];
                }
                break;

            case 'Baja':
                $updates['estado'] = 'Dado de baja';
                $updates['responsable'] = null;
                break;

            case 'Mantenimiento':
                $updates['estado'] = 'En mantenimiento';
                if (!empty($movement['ubicacion_destino'])) {
                    $updates['ubicacion'] = $movement['ubicacion_destino'];
                }
                break;

            case 'Ingreso':
                $updates['estado'] = 'Disponible';
                if (!empty($movement['ubicacion_destino'])) {
                    $updates['ubicacion'] = $movement['ubicacion_destino'];
                }
                break;
        }

        // Agregar evento al historial
        $historial = $item->historial ?? [];
        $historial[] = [
            'fecha' => $movement['fecha'],
            'evento' => $this->getEventDescription($movement),
            'responsable' => $movement['responsable'],
            'detalles' => $movement['observaciones'] ?? null,
        ];

        $updates['historial'] = $historial;
        $updates['fecha_ultimo_movimiento'] = $movement['fecha'];

        return $updates;
    }

    /**
     * Generar descripción del evento
     * COPIADO de MovementService.getEventDescription()
     */
    private function getEventDescription(array $movement): string
    {
        switch ($movement['tipo']) {
            case 'Asignación':
                return !empty($movement['asignado_a'])
                    ? "Asignación a {$movement['asignado_a']}"
                    : 'Asignación';
            case 'Devolución':
                return 'Devolución';
            case 'Baja':
                return 'Dado de baja';
            case 'Mantenimiento':
                return 'Enviado a mantenimiento';
            case 'Ingreso':
                return 'Ingreso al inventario';
            default:
                return $movement['tipo'];
        }
    }

    /**
     * Validaciones de negocio
     * COPIADO de MovementService.validateMovement()
     */
    private function validateMovement(Item $item, array $movement): void
    {
        // Validar Asignación
        if ($movement['tipo'] === 'Asignación') {
            if (!in_array($item->estado, ['Disponible', 'En mantenimiento'])) {
                throw new Exception(
                    "No se puede asignar un ítem con estado \"{$item->estado}\". " .
                    "Solo se pueden asignar ítems Disponibles o que vuelven de Mantenimiento."
                );
            }
            if (empty($movement['asignado_a']) && empty($movement['responsable'])) {
                throw new Exception('Debe especificar a quién se asigna el ítem');
            }
        }

        // Validar Devolución
        if ($movement['tipo'] === 'Devolución') {
            if (!in_array($item->estado, ['Asignado', 'En uso'])) {
                throw new Exception(
                    "No se puede devolver un ítem con estado \"{$item->estado}\". " .
                    "Solo se pueden devolver ítems Asignados o En uso."
                );
            }
        }

        // Validar Baja
        if ($movement['tipo'] === 'Baja') {
            if ($item->estado === 'Dado de baja') {
                throw new Exception('El ítem ya está dado de baja');
            }
        }
    }
}
