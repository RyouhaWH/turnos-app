<?php

namespace App\Console\Commands;

use App\Models\Employees;
use Illuminate\Console\Command;

class PopulateEmployeeLastNames extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'employees:populate-lastnames';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Separa los nombres completos de empleados en nombre, apellido paterno y apellido materno';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Iniciando separación de nombres de empleados...');

        $employees = Employees::whereNotNull('name')->get();
        $updated = 0;
        $skipped = 0;

        $this->withProgressBar($employees, function ($employee) use (&$updated, &$skipped) {
            $nameParts = $this->parseFullName($employee->name);

            if ($nameParts) {
                $employee->update([
                    'first_name' => $nameParts['first_name'],
                    'paternal_lastname' => $nameParts['paternal_lastname'],
                    'maternal_lastname' => $nameParts['maternal_lastname']
                ]);
                $updated++;
            } else {
                $skipped++;
            }
        });

        $this->newLine();
        $this->info("✅ Proceso completado:");
        $this->info("   - Empleados actualizados: {$updated}");
        $this->info("   - Empleados omitidos: {$skipped}");
        $this->info("   - Total procesados: " . $employees->count());
    }

    /**
     * Parsea un nombre completo y lo separa en componentes
     */
    private function parseFullName(string $fullName): ?array
    {
        // Limpiar el nombre de caracteres extraños y espacios múltiples
        $cleanName = trim(preg_replace('/\s+/', ' ', $fullName));

        // Si el nombre está vacío o es muy corto, omitir
        if (empty($cleanName) || strlen($cleanName) < 3) {
            return null;
        }

        // Dividir el nombre en partes
        $parts = explode(' ', $cleanName);

        // Si solo hay una parte, es solo el nombre
        if (count($parts) === 1) {
            return [
                'first_name' => $parts[0],
                'paternal_lastname' => null,
                'maternal_lastname' => null
            ];
        }

        // Si hay dos partes: nombre y apellido paterno
        if (count($parts) === 2) {
            return [
                'first_name' => $parts[0],
                'paternal_lastname' => $parts[1],
                'maternal_lastname' => null
            ];
        }

        // Si hay tres o más partes:
        // - Primera parte: nombre
        // - Penúltima parte: apellido paterno
        // - Última parte: apellido materno
        // - Partes intermedias: se agregan al nombre
        $firstName = $parts[0];
        $paternalLastname = $parts[count($parts) - 2]; // Penúltimo
        $maternalLastname = $parts[count($parts) - 1]; // Último

        // Si hay partes intermedias, agregarlas al nombre
        if (count($parts) > 3) {
            $middleNames = array_slice($parts, 1, count($parts) - 3);
            $firstName .= ' ' . implode(' ', $middleNames);
        }

        return [
            'first_name' => $firstName,
            'paternal_lastname' => $paternalLastname,
            'maternal_lastname' => $maternalLastname
        ];
    }
}
