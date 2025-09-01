<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    /**
     * Respuesta exitosa
     */
    protected function successResponse($data = null, string $message = 'Operación exitosa', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    /**
     * Respuesta de error
     */
    protected function errorResponse(string $message = 'Error en la operación', int $status = 500, $errors = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors) {
            $response['errors'] = $errors;
        }

        return response()->json($response, $status);
    }

    /**
     * Respuesta de validación
     */
    protected function validationErrorResponse($errors, string $message = 'Datos de validación incorrectos'): JsonResponse
    {
        return $this->errorResponse($message, 422, $errors);
    }

    /**
     * Respuesta de recurso no encontrado
     */
    protected function notFoundResponse(string $message = 'Recurso no encontrado'): JsonResponse
    {
        return $this->errorResponse($message, 404);
    }

    /**
     * Respuesta de conflicto
     */
    protected function conflictResponse(string $message = 'Conflicto en la operación'): JsonResponse
    {
        return $this->errorResponse($message, 409);
    }
}
