<?php

namespace App\Console\Commands;

use App\Models\Employees;
use App\Models\EmployeeShifts;
use Illuminate\Console\Command;

class ImportarTurnosFuncionarios extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'importar:turnos-funcionarios {archivo}';


    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Importa turnos desde un CSV con formato: nombre,fecha,turno';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $archivo = $this->argument('archivo');

        $path = storage_path("app/$archivo");

        if (!file_exists($path)) {
            $this->error("Archivo no encontrado: $path");
            return;
        }

        $handle = fopen($path, 'r');

        $linea = 0;
        while (($data = fgetcsv($handle, 1000, ',')) !== false) {
            $linea++;

            if ($linea == 1) continue; // Saltar encabezado

            [$nombre, $fecha, $turno] = $data;

            $nombreFormateado = ucwords(strtolower(trim($nombre)));

            $funcionario = Employees::where('name', $nombreFormateado)->first();

            if (!$funcionario) {
                $this->warn("Funcionario no encontrado: $nombreFormateado");
                continue;
            }

            EmployeeShifts::updateOrCreate(
                ['employee_id' => $funcionario->id, 'date' => $fecha],
                ['shift' => $turno]
            );
        }

        fclose($handle);

        $this->info("Importación completada.");
    }
}
