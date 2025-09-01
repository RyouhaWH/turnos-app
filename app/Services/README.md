# Servicios de la Aplicación

Esta carpeta contiene los servicios que manejan la lógica de negocio de la aplicación, separándola de los controladores para mejorar la mantenibilidad y testabilidad del código.

## Servicios Disponibles

### EmployeeDataService

Maneja la transformación y procesamiento de datos de empleados.

```php
use App\Services\EmployeeDataService;

class MiController extends Controller
{
    public function __construct(EmployeeDataService $employeeDataService)
    {
        $this->employeeDataService = $employeeDataService;
    }

    public function miMetodo()
    {
        // Obtener empleados sin vincular
        $unlinkedEmployees = $this->employeeDataService->getUnlinkedEmployees();
        
        // Transformar empleado para vista
        $employee = Employees::find(1);
        $employeeData = $this->employeeDataService->transformEmployeeForView($employee);
        
        // Analizar datos faltantes
        $employees = Employees::all();
        $missingData = $this->employeeDataService->categorizeEmployeesByMissingData($employees);
        $stats = $this->employeeDataService->calculateMissingDataStats($employees, $missingData);
    }
}
```

### EmployeeLinkingService

Gestiona la vinculación entre empleados y usuarios del sistema.

```php
use App\Services\EmployeeLinkingService;

class MiController extends Controller
{
    public function __construct(EmployeeLinkingService $employeeLinkingService)
    {
        $this->employeeLinkingService = $employeeLinkingService;
    }

    public function vincularEmpleado()
    {
        $result = $this->employeeLinkingService->linkEmployeeToUser($employeeId, $userId);
        
        if ($result['success']) {
            // Operación exitosa
        } else {
            // Manejar error
        }
    }

    public function crearUsuarioParaEmpleado()
    {
        $userData = [
            'name' => 'Juan Pérez',
            'email' => 'juan@example.com',
            'password' => 'password123',
            'roles' => ['empleado']
        ];
        
        $result = $this->employeeLinkingService->createUserForEmployee($employeeId, $userData);
    }
}
```

### EmployeeCrudService

Maneja las operaciones CRUD básicas de empleados.

```php
use App\Services\EmployeeCrudService;

class MiController extends Controller
{
    public function __construct(EmployeeCrudService $employeeCrudService)
    {
        $this->employeeCrudService = $employeeCrudService;
    }

    public function actualizarEmpleado(Request $request, $id)
    {
        // Validar datos
        $validation = $this->employeeCrudService->validateEmployeeData($request->all());
        
        if (!$validation['success']) {
            return response()->json(['errors' => $validation['errors']], 422);
        }

        // Actualizar empleado
        $result = $this->employeeCrudService->updateEmployee($id, $validation['data']);
        
        return response()->json($result, $result['status']);
    }
}
```

### RoleService

Gestiona las operaciones relacionadas con roles.

```php
use App\Services\RoleService;

class MiController extends Controller
{
    public function __construct(RoleService $roleService)
    {
        $this->roleService = $roleService;
    }

    public function obtenerRoles()
    {
        $roles = $this->roleService->getRolesForView();
        $spatieRoles = $this->roleService->getSpatieRoles();
        
        return response()->json([
            'roles' => $roles,
            'spatie_roles' => $spatieRoles
        ]);
    }
}
```

## Uso del ApiResponseTrait

Para respuestas JSON consistentes en toda la aplicación:

```php
use App\Traits\ApiResponseTrait;

class MiController extends Controller
{
    use ApiResponseTrait;

    public function miMetodo()
    {
        try {
            // Lógica del método
            
            return $this->successResponse($data, 'Operación exitosa');
            
        } catch (\Exception $e) {
            return $this->errorResponse('Error en la operación: ' . $e->getMessage());
        }
    }

    public function validarDatos(Request $request)
    {
        $validator = Validator::make($request->all(), $rules);
        
        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }
        
        // Continuar con la lógica...
    }
}
```

## Beneficios de Usar Servicios

1. **Separación de Responsabilidades**: Cada servicio tiene una responsabilidad específica
2. **Reutilización**: Los servicios pueden ser usados en múltiples controladores
3. **Testabilidad**: Es más fácil hacer pruebas unitarias de los servicios
4. **Mantenibilidad**: Los cambios en la lógica de negocio están centralizados
5. **Escalabilidad**: Fácil agregar nuevas funcionalidades sin afectar el código existente

## Convenciones de Nomenclatura

- Los servicios terminan con `Service`
- Los métodos son descriptivos y siguen camelCase
- Los nombres de las clases son claros sobre su responsabilidad
- Los métodos públicos están documentados con PHPDoc

## Próximos Pasos

1. Crear pruebas unitarias para cada servicio
2. Documentar todos los métodos con ejemplos de uso
3. Considerar la creación de interfaces para los servicios
4. Implementar cache donde sea apropiado
5. Agregar validaciones adicionales según sea necesario
