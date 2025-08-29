<?php

namespace App\Console\Commands;

use App\Models\Employees;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class LinkEmployeesToUsers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'employees:link-users {--dry-run : Solo mostrar qué se haría sin ejecutar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Vincula funcionarios existentes con usuarios de la aplicación, creando cuentas automáticamente';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('🧪 MODO SIMULACIÓN - No se realizarán cambios reales');
            $this->newLine();
        }

        $this->info('🔗 Iniciando vinculación de funcionarios con usuarios...');
        $this->newLine();

        // Obtener todos los funcionarios
        $employees = Employees::whereNull('user_id')->get();

        if ($employees->isEmpty()) {
            $this->warn('⚠️  No hay funcionarios sin vincular.');
            return;
        }

        $this->info("📊 Funcionarios encontrados sin vincular: {$employees->count()}");
        $this->newLine();

        // Estadísticas
        $created = 0;
        $linked = 0;
        $errors = 0;
        $report = [];

        // Obtener rol por defecto para funcionarios
        $defaultRole = Role::where('name', 'Usuario')->first();

        if (!$defaultRole) {
            $this->error('❌ No se encontró el rol "Usuario". Ejecuta el seeder de roles primero.');
            return;
        }

        foreach ($employees as $employee) {
            try {
                $result = $this->processEmployee($employee, $defaultRole, $dryRun);
                $report[] = $result;

                if ($result['action'] === 'created') {
                    $created++;
                } elseif ($result['action'] === 'linked') {
                    $linked++;
                }

                // Mostrar progreso
                $this->line($result['message']);

            } catch (\Exception $e) {
                $errors++;
                $this->error("❌ Error procesando {$employee->name}: " . $e->getMessage());
            }
        }

        $this->newLine();
        $this->info('📋 RESUMEN DE EJECUCIÓN:');
        $this->table(['Tipo', 'Cantidad'], [
            ['Usuarios creados', $created],
            ['Funcionarios vinculados', $linked],
            ['Errores', $errors],
            ['Total procesados', $created + $linked + $errors]
        ]);

        if (!$dryRun && ($created > 0 || $linked > 0)) {
            $this->newLine();
            $this->info('📄 Generando reporte detallado...');
            $this->generateDetailedReport($report);
        }

        if ($dryRun) {
            $this->newLine();
            $this->comment('💡 Para ejecutar los cambios reales, ejecuta el comando sin --dry-run');
        }
    }

    private function processEmployee(Employees $employee, Role $defaultRole, bool $dryRun): array
    {
        // Verificar si ya tiene campos de nombre separados
        if (empty($employee->first_name) || empty($employee->paternal_lastname)) {
            // Intentar extraer nombres del campo 'name'
            $names = $this->parseFullName($employee->name);

            if (!$dryRun) {
                $employee->update([
                    'first_name' => $names['first_name'],
                    'paternal_lastname' => $names['paternal_lastname'],
                    'maternal_lastname' => $names['maternal_lastname'] ?? null,
                ]);
            }
        } else {
            $names = [
                'first_name' => $employee->first_name,
                'paternal_lastname' => $employee->paternal_lastname,
                'maternal_lastname' => $employee->maternal_lastname,
            ];
        }

        // Generar email
        $email = $this->generateEmail($names['first_name'], $names['paternal_lastname'], $employee->amzoma);

        // Verificar si ya existe un usuario con este email
        $existingUser = User::where('email', $email)->first();

        if ($existingUser) {
            // Vincular funcionario existente con usuario existente
            if (!$dryRun) {
                $employee->update(['user_id' => $existingUser->id]);
            }

            return [
                'action' => 'linked',
                'employee_name' => $employee->name,
                'email' => $email,
                'password' => 'Ya existía',
                'message' => "🔗 Vinculado: {$employee->name} → {$email} (usuario ya existía)"
            ];
        }

        // Crear nuevo usuario
        $password = $this->generatePassword($names['first_name'], $names['paternal_lastname']);

        if (!$dryRun) {
            $user = User::create([
                'name' => $employee->name,
                'email' => $email,
                'password' => Hash::make($password),
            ]);

            // Asignar rol por defecto
            $user->assignRole($defaultRole);

            // Vincular funcionario con usuario
            $employee->update(['user_id' => $user->id]);
        }

        return [
            'action' => 'created',
            'employee_name' => $employee->name,
            'email' => $email,
            'password' => $password,
            'message' => "✅ Creado: {$employee->name} → {$email} | Contraseña: {$password}"
        ];
    }

    private function parseFullName(string $fullName): array
    {
        $parts = explode(' ', trim($fullName));
        $count = count($parts);

        if ($count >= 3) {
            return [
                'first_name' => $parts[0],
                'paternal_lastname' => $parts[1],
                'maternal_lastname' => $parts[2],
            ];
        } elseif ($count === 2) {
            return [
                'first_name' => $parts[0],
                'paternal_lastname' => $parts[1],
                'maternal_lastname' => null,
            ];
        } else {
            return [
                'first_name' => $parts[0],
                'paternal_lastname' => 'Apellido',
                'maternal_lastname' => null,
            ];
        }
    }

    private function generateEmail(string $firstName, string $paternalLastname, bool $isAmzoma): string
    {
        // Normalizar nombres (quitar acentos, convertir a minúsculas)
        $firstName = $this->normalizeString($firstName);
        $paternalLastname = $this->normalizeString($paternalLastname);

        // Tomar solo el primer nombre si hay varios
        $firstNameParts = explode(' ', $firstName);
        $firstNameOnly = $firstNameParts[0];

        $domain = $isAmzoma ? 'amzoma.cl' : 'temuco.cl';

        return "{$firstNameOnly}.{$paternalLastname}@{$domain}";
    }

    private function generatePassword(string $firstName, string $paternalLastname): string
    {
        $firstName = $this->normalizeString($firstName);
        $paternalLastname = $this->normalizeString($paternalLastname);

        // Tomar solo el primer nombre
        $firstNameParts = explode(' ', $firstName);
        $firstNameOnly = $firstNameParts[0];

        return "{$firstNameOnly}.{$paternalLastname}";
    }

    private function normalizeString(string $str): string
    {
        // Convertir a minúsculas
        $str = strtolower($str);

        // Reemplazar caracteres especiales
        $replacements = [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
            'ä' => 'a', 'ë' => 'e', 'ï' => 'i', 'ö' => 'o', 'ü' => 'u',
            'ñ' => 'n', 'Ñ' => 'n',
            'ç' => 'c',
        ];

        $str = strtr($str, $replacements);

        // Quitar espacios extras
        $str = trim($str);

        return $str;
    }

    private function generateDetailedReport(array $report): void
    {
        $filename = 'employee_user_link_report_' . now()->format('Y-m-d_H-i-s') . '.txt';
        $filepath = storage_path("logs/{$filename}");

        $content = "REPORTE DE VINCULACIÓN FUNCIONARIOS-USUARIOS\n";
        $content .= "===============================================\n";
        $content .= "Fecha: " . now()->format('d/m/Y H:i:s') . "\n\n";

        foreach ($report as $item) {
            $content .= "Funcionario: {$item['employee_name']}\n";
            $content .= "Email: {$item['email']}\n";
            $content .= "Contraseña: {$item['password']}\n";
            $content .= "Acción: {$item['action']}\n";
            $content .= "---\n";
        }

        file_put_contents($filepath, $content);

        $this->info("📄 Reporte guardado en: {$filepath}");
    }
}
