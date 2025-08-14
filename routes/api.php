<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Rol;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Rutas para datos de plataforma (solo administradores)
Route::middleware(['auth:sanctum', 'admin'])->prefix('platform-data')->group(function () {
    
    // Obtener todos los datos de la plataforma
    Route::get('/', function () {
        $roles = Rol::all();
        
        return response()->json([
            'roles' => $roles
        ]);
    });

    // Rutas para roles
    Route::prefix('roles')->group(function () {
        // Crear nuevo rol
        Route::post('/', function (Request $request) {
            $request->validate([
                'name' => 'required|string|max:255|unique:rols,name',
                'description' => 'nullable|string|max:500'
            ]);

            $role = Rol::create([
                'name' => $request->name,
                'description' => $request->description
            ]);

            return response()->json($role, 201);
        });

        // Actualizar rol
        Route::put('/{id}', function (Request $request, $id) {
            $role = Rol::findOrFail($id);
            
            $request->validate([
                'name' => 'required|string|max:255|unique:rols,name,' . $id,
                'description' => 'nullable|string|max:500'
            ]);

            $role->update([
                'name' => $request->name,
                'description' => $request->description
            ]);

            return response()->json($role);
        });

        // Eliminar rol
        Route::delete('/{id}', function ($id) {
            $role = Rol::findOrFail($id);
            
            // Verificar si hay empleados usando este rol
            $employeesCount = $role->employees()->count();
            if ($employeesCount > 0) {
                return response()->json([
                    'error' => 'No se puede eliminar el rol porque hay ' . $employeesCount . ' empleado(s) asignado(s) a él.'
                ], 400);
            }

            $role->delete();
            return response()->json(['message' => 'Rol eliminado correctamente']);
        });
    });
});






