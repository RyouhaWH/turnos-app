<?php

namespace App\Http\Controllers;

use App\Models\Employees;
use App\Models\User;
use App\Services\EmployeeDataService;
use App\Services\EmployeeLinkingService;
use App\Services\EmployeeCrudService;
use App\Services\RoleService;
use App\Traits\ApiResponseTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PlatformDataController extends Controller
{
    use ApiResponseTrait;

    protected EmployeeDataService $employeeDataService;
    protected EmployeeLinkingService $employeeLinkingService;
    protected EmployeeCrudService $employeeCrudService;
    protected RoleService $roleService;

    public function __construct(
        EmployeeDataService $employeeDataService,
        EmployeeLinkingService $employeeLinkingService,
        EmployeeCrudService $employeeCrudService,
        RoleService $roleService
    ) {
        $this->employeeDataService = $employeeDataService;
        $this->employeeLinkingService = $employeeLinkingService;
        $this->employeeCrudService = $employeeCrudService;
        $this->roleService = $roleService;
    }

    /**
     * Mostrar la vista principal de datos de plataforma
     */
    public function index()
    {
        $roles = $this->roleService->getRolesForView();

        $empleados = Employees::with(['rol', 'user'])->get()->map(function ($empleado) {
            return $this->employeeDataService->transformEmployeeForView($empleado);
        });

        return inertia('settings/platform-data', [
            'roles'     => $roles,
            'empleados' => $empleados,
        ]);
    }

    /**
     * Obtener funcionarios con datos faltantes
     */
    public function getMissingData()
    {
        try {
            Log::info('Missing data endpoint accessed by user: ' . (auth()->id() ?? 'guest'));

            $employees = Employees::with(['rol', 'user'])->get();
            $missingData = $this->employeeDataService->categorizeEmployeesByMissingData($employees);
            $stats = $this->employeeDataService->calculateMissingDataStats($employees, $missingData);

            Log::info('Missing data processed successfully', [
                'total_employees' => $stats['total_employees'],
                'missing_count' => $stats['total_employees'] - $stats['complete_data'],
                'completion_percentage' => $stats['completion_percentage']
            ]);

            return $this->successResponse([
                'categories' => $missingData,
                'stats' => $stats,
            ]);

        } catch (\Exception $e) {
            Log::error('Error processing missing data: ' . $e->getMessage(), [
                'user_id' => auth()->id() ?? 'guest',
                'trace' => $e->getTraceAsString()
            ]);

            return $this->errorResponse('Error al procesar los datos faltantes: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener funcionarios sin vincular y usuarios disponibles
     */
    public function getLinkingData()
    {
        try {
            $unlinkedEmployees = $this->employeeDataService->getUnlinkedEmployees();
            $availableUsers = $this->employeeDataService->getAvailableUsers();

            return $this->successResponse([
                'unlinked_employees' => $unlinkedEmployees,
                'available_users' => $availableUsers,
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting linking data: ' . $e->getMessage());
            return $this->errorResponse('Error al obtener datos de vinculación', 500);
        }
    }

    /**
     * Vincular funcionario con usuario
     */
    public function linkEmployeeToUser(Request $request, $employeeId)
    {
        try {
            $request->validate([
                'user_id' => 'required|exists:users,id',
            ]);

            $result = $this->employeeLinkingService->linkEmployeeToUser($employeeId, $request->user_id);

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message']
            ], $result['status']);

        } catch (\Exception $e) {
            Log::error('Error linking employee to user: ' . $e->getMessage());
            return $this->errorResponse('Error al vincular funcionario con usuario: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Desvincular funcionario
     */
    public function unlinkEmployee($employeeId)
    {
        try {
            $result = $this->employeeLinkingService->unlinkEmployee($employeeId);

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message']
            ], $result['status']);

        } catch (\Exception $e) {
            Log::error('Error unlinking employee: ' . $e->getMessage());
            return $this->errorResponse('Error al desvincular funcionario: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener datos completos de un empleado
     */
    public function getEmployee($id)
    {
        try {
            $empleado = $this->employeeCrudService->getEmployee($id);

            if (!$empleado) {
                return $this->notFoundResponse('Empleado no encontrado');
            }

            return $this->successResponse($empleado);

        } catch (\Exception $e) {
            Log::error('Error getting employee: ' . $e->getMessage());
            return $this->errorResponse('Error al obtener datos del empleado', 404);
        }
    }

    /**
     * Actualizar empleado
     */
    public function updateEmployee(Request $request, $id)
    {
        try {
            // Validar datos
            $validation = $this->employeeCrudService->validateEmployeeData($request->all());

            if (!$validation['success']) {
                return $this->validationErrorResponse($validation['errors']);
            }

            $result = $this->employeeCrudService->updateEmployee($id, $validation['data']);

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message']
            ], $result['status']);

        } catch (\Exception $e) {
            Log::error('Error updating employee: ' . $e->getMessage());
            return $this->errorResponse('Error al actualizar empleado: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Crear usuario para un empleado
     */
    public function createUserForEmployee(Request $request, $employeeId)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users,email',
                'password' => 'required|string|min:8',
                'roles' => 'required|array|min:1',
                'roles.*' => 'exists:roles,name'
            ]);

            $result = $this->employeeLinkingService->createUserForEmployee($employeeId, $request->all());

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message'],
                'data' => $result['data'] ?? null
            ], $result['status']);

        } catch (\Exception $e) {
            Log::error('Error creating user for employee: ' . $e->getMessage());
            return $this->errorResponse('Error al crear usuario: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Actualizar usuario de un empleado
     */
    public function updateUserForEmployee(Request $request, $employeeId)
    {
        try {
            $request->validate([
                'name' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'password' => 'nullable|string|min:8',
                'roles' => 'nullable|array|min:1',
                'roles.*' => 'exists:roles,name'
            ]);

            $result = $this->employeeLinkingService->updateUserForEmployee($employeeId, $request->all());

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message'],
                'data' => $result['data'] ?? null
            ], $result['status']);

        } catch (\Exception $e) {
            Log::error('Error updating user for employee: ' . $e->getMessage());
            return $this->errorResponse('Error al actualizar usuario: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Eliminar usuario de un empleado
     */
    public function deleteUserForEmployee($employeeId)
    {
        try {
            $result = $this->employeeLinkingService->deleteUserForEmployee($employeeId);

            return response()->json([
                'success' => $result['success'],
                'message' => $result['message']
            ], $result['status']);

        } catch (\Exception $e) {
            Log::error('Error deleting user for employee: ' . $e->getMessage());
            return $this->errorResponse('Error al eliminar usuario: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener roles de Spatie disponibles para usuarios
     */
    public function getSpatieRoles()
    {
        try {
            $roles = $this->roleService->getSpatieRoles();

            return $this->successResponse($roles);
        } catch (\Exception $e) {
            Log::error('Error getting Spatie roles: ' . $e->getMessage());
            return $this->errorResponse('Error al obtener roles', 500);
        }
    }
}
