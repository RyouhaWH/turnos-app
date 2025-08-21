<?php

namespace App\Console\Commands;

use App\Models\Employees;
use Illuminate\Console\Command;

class VerifyEmployeeNames extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'employees:verify-names {--limit=10 : Número de empleados a mostrar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Verifica y muestra ejemplos de cómo se separaron los nombres de empleados';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $limit = $this->option('limit');

        $this->info("Mostrando los primeros {$limit} empleados con nombres separados:");
        $this->newLine();

        $employees = Employees::whereNotNull('first_name')
            ->orWhereNotNull('paternal_lastname')
            ->orWhereNotNull('maternal_lastname')
            ->take($limit)
            ->get();

        foreach ($employees as $employee) {
            $fullName = $this->buildFullName($employee);

            $this->line("ID: {$employee->id}");
            $this->line("  Original: {$employee->name}");
            $this->line("  Nombre: " . ($employee->first_name ?? 'N/A'));
            $this->line("  Apellido Paterno: " . ($employee->paternal_lastname ?? 'N/A'));
            $this->line("  Apellido Materno: " . ($employee->maternal_lastname ?? 'N/A'));
            $this->line("  Nombre Completo: {$fullName}");
            $this->line("---");
        }

        // Estadísticas
        $totalEmployees = Employees::count();
        $withFirstName = Employees::whereNotNull('first_name')->count();
        $withPaternalLastname = Employees::whereNotNull('paternal_lastname')->count();
        $withMaternalLastname = Employees::whereNotNull('maternal_lastname')->count();

        $this->newLine();
        $this->info("📊 Estadísticas:");
        $this->info("   - Total de empleados: {$totalEmployees}");
        $this->info("   - Con nombre separado: {$withFirstName}");
        $this->info("   - Con apellido paterno: {$withPaternalLastname}");
        $this->info("   - Con apellido materno: {$withMaternalLastname}");
    }

    /**
     * Construye el nombre completo a partir de los campos separados
     */
    private function buildFullName($employee): string
    {
        $parts = [];

        if ($employee->first_name) {
            $parts[] = $employee->first_name;
        }

        if ($employee->paternal_lastname) {
            $parts[] = $employee->paternal_lastname;
        }

        if ($employee->maternal_lastname) {
            $parts[] = $employee->maternal_lastname;
        }

        return implode(' ', $parts) ?: 'N/A';
    }
}
