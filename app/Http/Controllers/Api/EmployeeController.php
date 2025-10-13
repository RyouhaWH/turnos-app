<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employees;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class EmployeeController extends Controller
{
    /**
     * Listar todos los empleados con nombres formateados
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Employees::query();

        // Filtros opcionales
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('department')) {
            $query->byDepartment($request->department);
        }

        if ($request->has('amzoma')) {
            $query->where('amzoma', filter_var($request->amzoma, FILTER_VALIDATE_BOOLEAN));
        }

        $employees = $query->orderBy('first_name')->get();

        $formattedEmployees = $employees->map(function ($employee) {
            return [
                'id' => $employee->id,
                'only_first_name' => $employee->only_first_name,
                'formatted_name' => $employee->formatted_name,
                'full_name' => $employee->full_name,
                'first_name' => $employee->first_name,
                'paternal_lastname' => $employee->paternal_lastname,
                'maternal_lastname' => $employee->maternal_lastname,
                'rut' => $employee->rut,
                'email' => $employee->email,
                'phone' => $employee->phone,
                'position' => $employee->position,
                'department' => $employee->department,
                'status' => $employee->status,
                'amzoma' => $employee->amzoma,
                'start_date' => $employee->start_date?->format('Y-m-d'),
            ];
        });

        return response()->json($formattedEmployees);
    }

    /**
     * Obtener lista simple de empleados (solo nombres e IDs)
     * Útil para dropdowns/selects
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function listaSimple(Request $request): JsonResponse
    {
        $query = Employees::query();

        // Solo empleados activos por defecto
        if (!$request->has('incluir_inactivos')) {
            $query->active();
        }

        if ($request->has('department')) {
            $query->byDepartment($request->department);
        }

        if ($request->has('amzoma')) {
            $query->where('amzoma', filter_var($request->amzoma, FILTER_VALIDATE_BOOLEAN));
        }

        $employees = $query->orderBy('first_name')->get();

        $simpleList = $employees->map(function ($employee) {
            return [
                'id' => $employee->id,
                'first_name' => $employee->only_first_name,
                'paternal_lastname' => $employee->paternal_lastname,
                'formatted_name' => $employee->formatted_name,
            ];
        });

        return response()->json($simpleList);
    }

    /**
     * Obtener empleados activos con nombres formateados
     *
     * @return JsonResponse
     */
    public function activos(): JsonResponse
    {
        $employees = Employees::active()
            ->orderBy('first_name')
            ->get();

        $formattedEmployees = $employees->map(function ($employee) {
            return [
                'id' => $employee->id,
                'only_first_name' => $employee->only_first_name,
                'formatted_name' => $employee->formatted_name,
                'full_name' => $employee->full_name,
                'email' => $employee->email,
                'phone' => $employee->phone,
                'position' => $employee->position,
                'department' => $employee->department,
                'amzoma' => $employee->amzoma,
            ];
        });

        return response()->json($formattedEmployees);
    }

    /**
     * Obtener empleados de Amzoma
     *
     * @return JsonResponse
     */
    public function amzoma(): JsonResponse
    {
        $employees = Employees::amzoma()
            ->active()
            ->orderBy('first_name')
            ->get();

        $formattedEmployees = $employees->map(function ($employee) {
            return [
                'id' => $employee->id,
                'only_first_name' => $employee->only_first_name,
                'formatted_name' => $employee->formatted_name,
                'full_name' => $employee->full_name,
                'email' => $employee->email,
                'position' => $employee->position,
                'department' => $employee->department,
            ];
        });

        return response()->json($formattedEmployees);
    }

    /**
     * Obtener un empleado por ID con todos los datos
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show($id): JsonResponse
    {
        $employee = Employees::with(['rol', 'user'])->find($id);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Empleado no encontrado'
            ], 404);
        }

        $employeeData = [
            'id' => $employee->id,
            'only_first_name' => $employee->only_first_name,
            'formatted_name' => $employee->formatted_name,
            'full_name' => $employee->full_name,
            'first_name' => $employee->first_name,
            'paternal_lastname' => $employee->paternal_lastname,
            'maternal_lastname' => $employee->maternal_lastname,
            'rut' => $employee->rut,
            'email' => $employee->email,
            'phone' => $employee->phone,
            'address' => $employee->address,
            'position' => $employee->position,
            'department' => $employee->department,
            'status' => $employee->status,
            'amzoma' => $employee->amzoma,
            'start_date' => $employee->start_date?->format('Y-m-d'),
            'rol' => $employee->rol ? [
                'id' => $employee->rol->id,
                'name' => $employee->rol->name ?? null,
            ] : null,
            'user' => $employee->user ? [
                'id' => $employee->user->id,
                'name' => $employee->user->name,
                'email' => $employee->user->email,
            ] : null,
        ];

        return response()->json($employeeData);
    }

    /**
     * Obtener empleados por departamento
     *
     * @param string $department
     * @return JsonResponse
     */
    public function porDepartamento($department): JsonResponse
    {
        $employees = Employees::byDepartment($department)
            ->active()
            ->orderBy('first_name')
            ->get();

        $formattedEmployees = $employees->map(function ($employee) {
            return [
                'id' => $employee->id,
                'only_first_name' => $employee->only_first_name,
                'formatted_name' => $employee->formatted_name,
                'position' => $employee->position,
                'email' => $employee->email,
                'phone' => $employee->phone,
            ];
        });

        // return response()->json($formattedEmployees);

        return response()->json([
            'success' => true,
            'data' => $formattedEmployees,
            'department' => $department,
            'count' => $formattedEmployees->count()
        ]);
    }

    /**
     * Buscar empleados por nombre
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function buscar(Request $request): JsonResponse
    {
        $search = $request->input('q', '');

        if (strlen($search) < 2) {
            return response()->json([
                'success' => false,
                'message' => 'El término de búsqueda debe tener al menos 2 caracteres'
            ], 400);
        }

        $employees = Employees::where(function ($query) use ($search) {
            $query->where('first_name', 'like', "%{$search}%")
                  ->orWhere('paternal_lastname', 'like', "%{$search}%")
                  ->orWhere('maternal_lastname', 'like', "%{$search}%")
                  ->orWhere('rut', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
        })
        ->active()
        ->orderBy('first_name')
        ->limit(20)
        ->get();

        $results = $employees->map(function ($employee) {
            return [
                'id' => $employee->id,
                'only_first_name' => $employee->only_first_name,
                'formatted_name' => $employee->formatted_name,
                'full_name' => $employee->full_name,
                'email' => $employee->email,
                'rut' => $employee->rut,
                'department' => $employee->department,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $results,
            'count' => $results->count()
        ]);
    }

    /**
     * Crear nuevo empleado
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'paternal_lastname' => 'required|string|max:255',
            'maternal_lastname' => 'nullable|string|max:255',
            'rut' => 'required|string|unique:employees,rut',
            'email' => 'nullable|email|unique:employees,email',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'position' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'status' => 'nullable|in:activo,inactivo,licencia,vacaciones',
            'amzoma' => 'nullable|boolean',
            'rol_id' => 'nullable|exists:rols,id',
            'user_id' => 'nullable|exists:users,id',
        ]);

        // Establecer valores por defecto
        $validated['status'] = $validated['status'] ?? 'activo';
        $validated['amzoma'] = $validated['amzoma'] ?? false;

        $employee = Employees::create($validated);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $employee->id,
                'only_first_name' => $employee->only_first_name,
                'formatted_name' => $employee->formatted_name,
                'full_name' => $employee->full_name,
            ],
            'message' => 'Empleado creado exitosamente'
        ], 201);
    }

    /**
     * Actualizar empleado
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id): JsonResponse
    {
        $employee = Employees::find($id);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Empleado no encontrado'
            ], 404);
        }

        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'paternal_lastname' => 'sometimes|required|string|max:255',
            'maternal_lastname' => 'nullable|string|max:255',
            'rut' => 'sometimes|required|string|unique:employees,rut,' . $id,
            'email' => 'nullable|email|unique:employees,email,' . $id,
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'position' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'status' => 'nullable|in:activo,inactivo,licencia,vacaciones',
            'amzoma' => 'nullable|boolean',
            'rol_id' => 'nullable|exists:rols,id',
            'user_id' => 'nullable|exists:users,id',
        ]);

        $employee->update($validated);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $employee->id,
                'only_first_name' => $employee->only_first_name,
                'formatted_name' => $employee->formatted_name,
                'full_name' => $employee->full_name,
            ],
            'message' => 'Empleado actualizado exitosamente'
        ]);
    }

    /**
     * Eliminar empleado (soft delete)
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        $employee = Employees::find($id);

        if (!$employee) {
            return response()->json([
                'success' => false,
                'message' => 'Empleado no encontrado'
            ], 404);
        }

        // En lugar de eliminar, cambiar status a inactivo
        $employee->update(['status' => 'inactivo']);

        return response()->json([
            'success' => true,
            'message' => 'Empleado marcado como inactivo'
        ]);
    }
}

