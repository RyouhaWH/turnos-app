<?php

namespace App\Http\Controllers;

use App\Models\Employees;
use App\Models\EmployeeShifts;
use App\Models\ShiftChangeLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ShiftsUpdateController extends Controller
{
    /**
     * Update shifts for employees
     */
    public function updateShifts(Request $request)
    {
        try {
            DB::beginTransaction();

            $numerosAReportarCambios = $this->getNotificationNumbers();
            $cambios = $request->input('cambios');
            $mes = $request->input('mes', now()->month);
            $año = $request->input('año', now()->year);
            $actualUser = Auth::id();

            Log::info('🔄 Valores recibidos en actualización:', [
                'mes' => $mes,
                'año' => $año,
                'cambios' => $cambios,
            ]);

            if (!is_array($cambios) || empty($cambios)) {
                return response()->json(['message' => 'No hay cambios para guardar'], 400);
            }

            $cambiosPorFuncionario = $this->processShiftsChanges($cambios, $mes, $año, $actualUser);
            $this->sendConsolidatedMessages($cambiosPorFuncionario, $numerosAReportarCambios);

            DB::commit();

            return back()->with('success', 'Cambios guardados correctamente.');

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error al actualizar turnos: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('success', 'Error al guardar los cambios: ' . $e->getMessage());
        }
    }

    /**
     * Get notification phone numbers based on environment
     */
    private function getNotificationNumbers(): array
    {
        $numeroJulioSarmiento = Employees::where('rut', '12282547-7')->first()->phone ?? '';
        $numeroMarianelaHuequelef = Employees::where('rut', '10604235-7')->first()->phone ?? '';
        $numeroPriscilaEscobar = Employees::where('rut', '18522287-K')->first()->phone ?? '';
        $numeroJavierAlvarado = Employees::where('rut', '18984596-0')->first()->phone ?? '';
        $numeroEduardoEsparza = Employees::where('rut', '16948150-4')->first()->phone ?? '';
        $numeroDayanaChavez = "981841759";
        $numeroCentral = "964949887";
        $numeroMunuelVerdugo = Employees::where('rut', '15987971-2')->first()->phone ?? '';
        $numeroPaolaCarrasco = Employees::where('rut', '12389084-1')->first()->phone ?? '';
        $numeroCesarSoto = Employees::where('rut', '16533970-3')->first()->phone ?? '';
        $numeroCristianMontecinos = "975952121";
        $numeroInformacionesAmzoma = "985639782";
        $numeroJorgeWaltemath = Employees::where('rut', '18198426-0')->first()->phone ?? '';

        if (app()->environment('production')) {
            return [
                $numeroInformacionesAmzoma, $numeroJorgeWaltemath, $numeroJulioSarmiento,
                $numeroMarianelaHuequelef, $numeroPriscilaEscobar, $numeroJavierAlvarado,
                $numeroEduardoEsparza, $numeroDayanaChavez, $numeroCentral,
                $numeroMunuelVerdugo, $numeroPaolaCarrasco, $numeroCesarSoto,
                $numeroCristianMontecinos,
            ];
        }

        return [$numeroInformacionesAmzoma, $numeroJorgeWaltemath];
    }

    /**
     * Process shifts changes for all employees
     */
    private function processShiftsChanges(array $cambios, int $mes, int $año, int $actualUser): array
    {
        $cambiosPorFuncionario = [];

        foreach ($cambios as $employeeId => $fechas) {
            foreach ($fechas['turnos'] as $dia => $turno) {
                $empleado = Employees::find($employeeId);
                if (!$empleado) continue;

                $fecha = sprintf('%04d-%02d-%02d', $año, $mes, (int) $dia);
                $turnoActual = EmployeeShifts::where('employee_id', $empleado->id)
                    ->whereDate('date', $fecha)
                    ->first();

                $nuevoTurno = strtoupper($turno);

                if (empty($turno) || $turno === '') {
                    $this->processShiftDeletion($empleado, $turnoActual, $fecha, $actualUser, $cambiosPorFuncionario);
                } else {
                    $this->processShiftUpdate($empleado, $turnoActual, $fecha, $nuevoTurno, $actualUser, $cambiosPorFuncionario);
                }
            }
        }

        return $cambiosPorFuncionario;
    }

    /**
     * Process shift deletion
     */
    private function processShiftDeletion($empleado, $turnoActual, $fecha, $actualUser, &$cambiosPorFuncionario): void
    {
        if ($turnoActual !== null) {
            ShiftChangeLog::create([
                'employee_id' => $empleado->id,
                'employee_shift_id' => null,
                'changed_by' => $actualUser,
                'old_shift' => $turnoActual->shift,
                'new_shift' => '',
                'comment' => 'Turno eliminado desde plataforma',
                'shift_date' => $fecha,
            ]);

            $this->addChangeToEmployee($empleado, $fecha, $this->getShiftDescription($turnoActual->shift), 'Sin Turno', $cambiosPorFuncionario);
            $turnoActual->delete();
        }
    }

    /**
     * Process shift update or creation
     */
    private function processShiftUpdate($empleado, $turnoActual, $fecha, $nuevoTurno, $actualUser, &$cambiosPorFuncionario): void
    {
        if ($turnoActual !== null && $turnoActual->shift !== $nuevoTurno) {
            $this->updateOrCreateShift($empleado, $fecha, $nuevoTurno);

            ShiftChangeLog::create([
                'employee_id' => $empleado->id,
                'employee_shift_id' => $turnoActual->id,
                'changed_by' => $actualUser,
                'old_shift' => $turnoActual->shift,
                'new_shift' => $nuevoTurno,
                'comment' => "modificado el turno desde plataforma",
                'shift_date' => $fecha,
            ]);

            $this->addChangeToEmployee($empleado, $fecha, $this->getShiftDescription($turnoActual->shift), $this->getShiftDescription($nuevoTurno), $cambiosPorFuncionario);
        } elseif ($turnoActual === null) {
            $shiftToMake = $this->updateOrCreateShift($empleado, $fecha, $nuevoTurno);

            ShiftChangeLog::create([
                'employee_id' => $empleado->id,
                'employee_shift_id' => $shiftToMake->id,
                'changed_by' => $actualUser,
                'old_shift' => '',
                'new_shift' => $nuevoTurno,
                'comment' => "Turno creado desde plataforma",
                'shift_date' => $fecha,
            ]);

            $this->addChangeToEmployee($empleado, $fecha, 'Sin Turno', $this->getShiftDescription($nuevoTurno), $cambiosPorFuncionario);
        }
    }

    /**
     * Update or create a shift
     */
    private function updateOrCreateShift($empleado, $fecha, $nuevoTurno)
    {
        return EmployeeShifts::updateOrCreate(
            ['employee_id' => $empleado->id, 'date' => $fecha],
            ['shift' => $nuevoTurno, 'comments' => '']
        );
    }

    /**
     * Add change to employee changes array
     */
    private function addChangeToEmployee($empleado, $fecha, $turnoAnterior, $turnoNuevo, &$cambiosPorFuncionario): void
    {
        if (!isset($cambiosPorFuncionario[$empleado->id])) {
            $cambiosPorFuncionario[$empleado->id] = [
                'nombre' => $empleado->name,
                'telefono' => $empleado->phone,
                'cambios' => [],
            ];
        }

        $cambiosPorFuncionario[$empleado->id]['cambios'][] = [
            'fecha' => $fecha,
            'turno_anterior' => $turnoAnterior,
            'turno_nuevo' => $turnoNuevo,
        ];
    }

    /**
     * Get shift description from code
     */
    private function getShiftDescription($shift): string
    {
        return match ($shift) {
            'PE' => 'Patrulla Escolar',
            'A' => 'Administrativo',
            'AE' => 'Administrativo Extra',
            'LM' => 'Licencia Médica',
            'S' => 'Día Sindical',
            'SE' => 'Día Sindical Extra',
            'M' => 'Mañana',
            'T' => 'Tarde',
            'N' => 'Noche',
            'ME' => 'Mañana Extra',
            'TE' => 'Tarde Extra',
            'NE' => 'Noche Extra',
            'F' => 'Franco',
            'FE' => 'Franco Extra',
            'L' => 'Libre',
            'LE' => 'Libre Extra',
            '1' => 'Primer Turno',
            '2' => 'Segundo Turno',
            '3' => 'Tercer Turno',
            '1E' => 'Primer Turno Extra',
            '2E' => 'Segundo Turno Extra',
            '3E' => 'Tercer Turno Extra',
            null, '', ' ' => 'Sin Turno',
            default => 'Desconocido',
        };
    }

    /**
     * Send consolidated messages to notification numbers
     */
    private function sendConsolidatedMessages(array $cambiosPorFuncionario, array $numerosAReportarCambios): void
    {
        foreach ($cambiosPorFuncionario as $funcionarioId => $datosFuncionario) {
            if (empty($datosFuncionario['cambios'])) {
                continue;
            }

            $mensaje = $this->buildConsolidatedMessage($datosFuncionario);

            // Send to notification contacts
            foreach ($numerosAReportarCambios as $numero) {
                Http::post('http://localhost:3001/send-message', [
                    'mensaje' => $mensaje,
                    'numero' => "56" . $numero,
                ]);
            }

            if (app()->environment('production')) {

                // Send to employee
                if ($datosFuncionario['telefono']) {
                    Http::post('http://localhost:3001/send-message', [
                        'mensaje' => $mensaje,
                        'numero' => "56" . $datosFuncionario['telefono'],
                    ]);
                }
            }
        }
    }

    /**
     * Build consolidated message for an employee
     */
    private function buildConsolidatedMessage(array $datosFuncionario): string
    {
        $mensaje = "Se *Autoriza* el turno de: *{$datosFuncionario['nombre']}* _siendo modificado_ los días:\n";

        foreach ($datosFuncionario['cambios'] as $cambio) {
            $fechaFormateada = date('d/m/Y', strtotime($cambio['fecha']));
            $mensaje .= "• *{$fechaFormateada}* de \"*{$cambio['turno_anterior']}*\" a \"*{$cambio['turno_nuevo']}*\"\n";
        }

        return $mensaje;
    }
}
