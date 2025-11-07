<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    /**
     * Listar categorías
     */
    public function index(): JsonResponse
    {
        $categories = Category::orderBy('nombre')->get(['id', 'nombre', 'descripcion']);
        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Crear categoría
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
        ]);

        $category = Category::create($validated);

        return response()->json([
            'success' => true,
            'data' => $category,
            'message' => 'Categoría creada exitosamente'
        ], 201);
    }

    /**
     * Mostrar categoría
     */
    public function show($id): JsonResponse
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Categoría no encontrada'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $category,
        ]);
    }

    /**
     * Actualizar categoría
     */
    public function update(Request $request, $id): JsonResponse
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Categoría no encontrada'
            ], 404);
        }

        $validated = $request->validate([
            'nombre' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
        ]);

        $category->update($validated);

        return response()->json([
            'success' => true,
            'data' => $category,
            'message' => 'Categoría actualizada exitosamente'
        ]);
    }

    /**
     * Eliminar categoría
     */
    public function destroy($id): JsonResponse
    {
        $category = Category::find($id);
        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Categoría no encontrada'
            ], 404);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Categoría eliminada exitosamente'
        ]);
    }
}






