<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * Listar todos los usuarios
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $users = User::orderBy('name')->get();

        return response()->json($users);
    }

    /**
     * Obtener usuario por ID
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        return response()->json($user);
    }

    /**
     * Crear nuevo usuario
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'rol' => 'nullable|string|max:255',
            'departamento' => 'nullable|string|max:255',
            'activo' => 'nullable|boolean',
            'password' => 'nullable|string|min:6',
            'items_asignados' => 'nullable|array',
        ]);

        // Hash password si se proporciona
        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user = User::create($validated);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Usuario creado exitosamente'
        ], 201);
    }

    /**
     * Actualizar usuario
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'email' => 'nullable|email|unique:users,email,' . $id,
            'rol' => 'nullable|string|max:255',
            'departamento' => 'nullable|string|max:255',
            'activo' => 'nullable|boolean',
            'password' => 'nullable|string|min:6',
            'items_asignados' => 'nullable|array',
        ]);

        // Hash password si se proporciona
        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'data' => $user,
            'message' => 'Usuario actualizado exitosamente'
        ]);
    }

    /**
     * Eliminar usuario (soft delete si está habilitado)
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado'
            ], 404);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Usuario eliminado exitosamente'
        ]);
    }

    /**
     * Obtener usuarios activos
     *
     * @return JsonResponse
     */
    public function activos(): JsonResponse
    {
        // Usa el scope definido en el modelo User
        $users = User::activo()->orderBy('name')->get();

        return response()->json($users);
    }
}
