<?php

namespace App\Console\Commands;

use App\Models\ShiftChangeLog;
use Illuminate\Console\Command;

class UpdateShiftChangeLogDates extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'shift:update-log-dates';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Actualiza las fechas de los registros de ShiftChangeLog que no tienen shift_date';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Actualizando fechas de registros de ShiftChangeLog...');

        $logs = ShiftChangeLog::whereNull('shift_date')->get();
        $updated = 0;

        foreach ($logs as $log) {
            if ($log->employeeShift && $log->employeeShift->date) {
                // Si tenemos la relación employeeShift, usar esa fecha
                $log->shift_date = $log->employeeShift->date;
                $log->save();
                $updated++;
            } else {
                // Si no tenemos employeeShift, usar la fecha del log como fallback
                $log->shift_date = $log->created_at->toDateString();
                $log->save();
                $updated++;
            }
        }

        $this->info("Se actualizaron {$updated} registros.");
        $this->info('¡Completado!');
    }
}
