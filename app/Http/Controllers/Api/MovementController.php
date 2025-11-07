<?php
// app/Http/Controllers/Api/MovementController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MovementService;
use App\Models\Movement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class MovementController extends Controller
{
    protected $movementService;

    public function __construct(MovementService $movementService)
    {
        $this->movementService = $movementService;
    }

    /**
     * Listar todos los movimientos
     */
    public function index(): JsonResponse
    {
        $movements = Movement::with('item')->orderBy('fecha', 'desc')->get();

        return response()->json($movements);
    }

    /**
     * Obtener un movimiento específico
     */
    public function show($id): JsonResponse
    {
        $movement = Movement::with('item')->find($id);

        if (!$movement) {
            return response()->json([
                'success' => false,
                'message' => 'Movimiento no encontrado'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $movement
        ]);
    }

    /**
     * Crear nuevo movimiento Y actualizar ítem
     *
     * ENDPOINT PRINCIPAL - TODO EN UNA LLAMADA
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_id' => 'nullable|exists:items,id',
            'itemId' => 'nullable|exists:items,id',
            'tipo' => 'required|in:Ingreso,Asignación,Devolución,Mantenimiento,Baja',
            'responsable' => 'required|string',
            'asignado_a' => 'nullable|string',
            'asignadoA' => 'nullable|string',
            'ubicacion_origen' => 'nullable|string',
            'ubicacionOrigen' => 'nullable|string',
            'ubicacion_destino' => 'nullable|string',
            'ubicacionDestino' => 'nullable|string',
            'observaciones' => 'required|string',
            'fecha' => 'required|date',
            'archivos' => 'nullable|array',
        ]);

        // Normalizar nombres de campos
        $validated['item_id'] = $validated['item_id'] ?? $validated['itemId'];
        $validated['asignado_a'] = $validated['asignado_a'] ?? $validated['asignadoA'];
        $validated['ubicacion_origen'] = $validated['ubicacion_origen'] ?? $validated['ubicacionOrigen'];
        $validated['ubicacion_destino'] = $validated['ubicacion_destino'] ?? $validated['ubicacionDestino'];

        // Validar que al menos uno de los campos item_id esté presente
        if (empty($validated['item_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'El campo item_id es requerido'
            ], 422);
        }

        try {
            // El servicio hace TODO: crear movimiento + actualizar ítem
            $result = $this->movementService->createMovementWithItemUpdate($validated);

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Movimiento registrado e ítem actualizado exitosamente'
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 400);
        }
    }
}
