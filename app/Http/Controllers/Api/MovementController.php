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
            'item_id' => 'required|exists:items,id',
            'tipo' => 'required|in:Ingreso,Asignación,Devolución,Mantenimiento,Baja',
            'responsable' => 'required|string',
            'asignado_a' => 'nullable|string',
            'ubicacion_origen' => 'nullable|string',
            'ubicacion_destino' => 'nullable|string',
            'observaciones' => 'required|string',
            'fecha' => 'required|date',
            'archivos' => 'nullable|array',
        ]);

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
