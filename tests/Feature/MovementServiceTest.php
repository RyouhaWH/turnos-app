<?php
// tests/Feature/MovementServiceTest.php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Item;
use App\Models\Movement;
use App\Services\MovementService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class MovementServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_asignacion_actualiza_item()
    {
        $item = Item::factory()->create([
            'estado' => 'Disponible',
            'responsable' => null
        ]);

        $service = new MovementService();
        $result = $service->createMovementWithItemUpdate([
            'item_id' => $item->id,
            'tipo' => 'Asignación',
            'responsable' => 'Admin',
            'asignado_a' => 'Juan Pérez',
            'ubicacion_destino' => 'Oficina 201',
            'observaciones' => 'Asignación de laptop',
            'fecha' => now()->format('Y-m-d')
        ]);

        $this->assertEquals('Asignado', $result['updated_item']->estado);
        $this->assertEquals('Juan Pérez', $result['updated_item']->responsable);
        $this->assertEquals('Oficina 201', $result['updated_item']->ubicacion);
    }
}
