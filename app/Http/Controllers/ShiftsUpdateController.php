<?php
namespace App\Http\Controllers;

use App\Jobs\SendWhatsAppMessage;
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
        Log::info('🚀 INICIO: updateShifts llamado', [
            'user_id'        => Auth::id(),
            'user_name'      => Auth::user()?->name,
            'request_method' => $request->method(),
            'request_url'    => $request->fullUrl(),
        ]);

        try {
            DB::beginTransaction();

            $cambios            = $request->input('cambios');
            $mes                = $request->input('mes', now()->month);
            $año               = $request->input('año', now()->year);
            $multiMonth         = $request->input('multi_month', false);
            $actualUser         = Auth::id();
            $whatsappRecipients = $request->input('whatsapp_recipients', []);
            $testingMode        = $request->input('whatsapp_testing_mode', false);
            $sendToEmployee     = $request->input('send_to_employee', true);

            // Validar que solo administradores puedan usar el modo testing
            if ($testingMode && !Auth::user()->hasRole('Administrador')) {
                Log::warning('⚠️ Usuario no administrador intentó usar modo testing', [
                    'user_id' => Auth::id(),
                    'user_name' => Auth::user()?->name,
                    'testing_mode_requested' => $testingMode
                ]);
                $testingMode = false; // Forzar a false para usuarios no administradores
            }

            // Usar destinatarios seleccionados por el administrador o los por defecto
            $numerosAReportarCambios = $this->getNotificationNumbers($whatsappRecipients, $testingMode);

            $mensaje = '🔄 Valores recibidos en actualización' . PHP_EOL .
            'Mes: ' . $mes . PHP_EOL .
            'Año: ' . $año . PHP_EOL .
            'Multi-mes: ' . ($multiMonth ? 'true' : 'false') . PHP_EOL .
            'Cambios recibidos: ' . json_encode($cambios, JSON_PRETTY_PRINT) . PHP_EOL .
            'WhatsApp recipients: ' . json_encode($whatsappRecipients) . PHP_EOL .
            'Testing mode: ' . ($testingMode ? 'true' : 'false') . PHP_EOL .
            'Request completo: ' . json_encode($request->all(), JSON_PRETTY_PRINT);
            Log::info($mensaje, [
                'mes'                 => $mes,
                'año'                 => $año,
                'multi_month'         => $multiMonth,
                'cambios'             => $cambios,
                'whatsapp_recipients' => $whatsappRecipients,
                'testing_mode'        => $testingMode,
                'request_all'         => $request->all(),
            ]);

            if (! is_array($cambios) || empty($cambios)) {
                Log::warning('⚠️ No hay cambios para guardar', [
                    'cambios_type' => gettype($cambios),
                    'cambios_empty' => empty($cambios),
                    'cambios_is_array' => is_array($cambios),
                    'cambios_content' => $cambios,
                    'user_id' => Auth::id(),
                ]);
                return back()->withErrors(['message' => 'No hay cambios para guardar']);
            }

            $cambiosPorFuncionario = $this->processShiftsChanges($cambios, $mes, $año, $actualUser);

            Log::info('✅ Cambios procesados correctamente:', [
                'cambios_por_funcionario' => $cambiosPorFuncionario,
                'total_cambios' => count($cambiosPorFuncionario),
                'user_id' => Auth::id(),
            ]);

            $this->sendConsolidatedMessages($cambiosPorFuncionario, $numerosAReportarCambios, $testingMode, $sendToEmployee);

            DB::commit();

            Log::info('🎉 Transacción completada exitosamente', [
                'user_id' => Auth::id(),
                'mes' => $mes,
                'año' => $año,
            ]);

            return back()->with('success', 'Cambios guardados correctamente.');

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Error al actualizar turnos: ' . $e->getMessage(), [
                'user_id'      => Auth::id(),
                'request_data' => $request->all(),
                'trace'        => $e->getTraceAsString(),
            ]);

            return back()->with('success', 'Error al guardar los cambios: ' . $e->getMessage());
        }
    }

    /**
     * Get phone number to name mapping
     */
    private function getPhoneToNameMapping(): array
    {
        return [
            Employees::where('rut', '12282547-7')->first()->phone ?? '' => 'Julio Sarmiento',
            Employees::where('rut', '18522287-K')->first()->phone ?? '' => 'Priscila Escobar',
            '964949887'                                                 => 'Central',
            '951004035'                                                 => 'Jorge Waltemath',
            '968012847'                                                 => 'Eduardo Esparza',
        ];
    }

    /**
     * Get notification phone numbers based on environment and selected recipients
     */
    private function getNotificationNumbers(array $selectedRecipients = [], bool $testingMode = false): array
    {
        // Números reales (comentados para evitar envíos accidentales)
        $numeroJulioSarmiento      = Employees::where('rut', '12282547-7')->first()->phone ?? '';
        $numeroPriscilaEscobar     = Employees::where('rut', '18522287-K')->first()->phone ?? '';
        $numeroCentral             = "964949887";
        $numeroJorgeWaltemath      = "951004035";
        $numeroEduardoEsparza      = "968012847";

        // Número de prueba
        $testNumber = "951004035";

        // Mapeo de IDs a números de teléfono
        $recipientsMap = [
            'julio-sarmiento'      => $testingMode ? $testNumber : $numeroJulioSarmiento,
            'priscila-escobar'     => $testingMode ? $testNumber : $numeroPriscilaEscobar,
            'central'              => $testingMode ? $testNumber : $numeroCentral,
            'jorge-waltemath'      => $testingMode ? $testNumber : $numeroJorgeWaltemath,
            'eduardo-esparza'      => $numeroEduardoEsparza,
        ];

        // Si hay destinatarios seleccionados, usar solo esos
        if (! empty($selectedRecipients)) {
            $selectedNumbers = [];

            foreach ($selectedRecipients as $recipientId) {
                if (isset($recipientsMap[$recipientId]) && ! empty($recipientsMap[$recipientId])) {
                    if($recipientId === 'eduardo-esparza') {
                        $selectedNumbers[] = $numeroEduardoEsparza;
                    } else {
                        $selectedNumbers[] = $testingMode ? $testNumber : $recipientsMap[$recipientId];
                    }
                }
            }

            Log::info('📱 Usando destinatarios WhatsApp seleccionados:', [
                'selected_recipients' => $selectedRecipients,
                'selected_numbers'   => $selectedNumbers,
                'total_count'        => count($selectedNumbers),
                'testing_mode'       => $testingMode,
            ]);

            return $selectedNumbers;
        }

        // Si no hay destinatarios seleccionados, no enviar a nadie (solo al funcionario si está habilitado)
        // Esto se maneja en sendProductionMessages con el parámetro send_to_employee
        return [];
    }

    /**
     * Process shifts changes for all employees
     */
    private function processShiftsChanges(array $cambios, ?int $mes, ?int $año, int $actualUser): array
    {
        $cambiosPorFuncionario = [];

        foreach ($cambios as $employeeId => $employeeData) {
            // El frontend ahora envía el objeto completo del empleado con la propiedad 'turnos'
            $turnos = $employeeData['turnos'] ?? [];

            Log::info("🔍 Procesando empleado {$employeeId}:", [
                'employee_data' => $employeeData,
                'turnos'        => $turnos,
            ]);

            foreach ($turnos as $dia => $turno) {
                $empleado = Employees::find($employeeId);
                if (! $empleado) {
                    continue;
                }

                // Determinar si es una fecha completa (YYYY-MM-DD) o solo el día
                $fecha = '';
                if (strpos($dia, '-') !== false && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dia)) {
                    // Es una fecha completa (formato YYYY-MM-DD)
                    $fecha = $dia;
                } else {
                    // Es solo el día, usar mes y año del request
                    if ($mes === null || $año === null) {
                        // Si no hay mes/año (modo multi-mes), usar fecha actual como fallback
                        $fecha = sprintf('%04d-%02d-%02d', now()->year, now()->month, (int) $dia);
                    } else {
                        $fecha = sprintf('%04d-%02d-%02d', $año, $mes, (int) $dia);
                    }
                }

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
                'employee_id'       => $empleado->id,
                'employee_shift_id' => null,
                'changed_by'        => $actualUser,
                'old_shift'         => $turnoActual->shift,
                'new_shift'         => '',
                'comment'           => 'Turno eliminado desde plataforma',
                'shift_date'        => $fecha,
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
                'employee_id'       => $empleado->id,
                'employee_shift_id' => $turnoActual->id,
                'changed_by'        => $actualUser,
                'old_shift'         => $turnoActual->shift,
                'new_shift'         => $nuevoTurno,
                'comment'           => "modificado el turno desde plataforma",
                'shift_date'        => $fecha,
            ]);

            $this->addChangeToEmployee($empleado, $fecha, $this->getShiftDescription($turnoActual->shift), $this->getShiftDescription($nuevoTurno), $cambiosPorFuncionario);
        } elseif ($turnoActual === null) {
            $shiftToMake = $this->updateOrCreateShift($empleado, $fecha, $nuevoTurno);

            ShiftChangeLog::create([
                'employee_id'       => $empleado->id,
                'employee_shift_id' => $shiftToMake->id,
                'changed_by'        => $actualUser,
                'old_shift'         => '',
                'new_shift'         => $nuevoTurno,
                'comment'           => "Turno creado desde plataforma",
                'shift_date'        => $fecha,
            ]);

            $this->addChangeToEmployee($empleado, $fecha, 'Sin Turno', $this->getShiftDescription($nuevoTurno), $cambiosPorFuncionario);
        }
    }

    /**
     * Update or create a shift
     */
    private function updateOrCreateShift($empleado, $fecha, $nuevoTurno)
    {
        Log::info("💾 Actualizando/creando turno:", [
            'employee_id'   => $empleado->id,
            'employee_name' => $empleado->name,
            'fecha'         => $fecha,
            'nuevo_turno'   => $nuevoTurno,
        ]);

        $result = EmployeeShifts::updateOrCreate(
            ['employee_id' => $empleado->id, 'date' => $fecha],
            ['shift' => $nuevoTurno, 'comments' => '']
        );

        Log::info("✅ Turno guardado en DB:", [
            'shift_id'    => $result->id,
            'employee_id' => $result->employee_id,
            'date'        => $result->date,
            'shift'       => $result->shift,
        ]);

        return $result;
    }

    /**
     * Add change to employee changes array
     */
    private function addChangeToEmployee($empleado, $fecha, $turnoAnterior, $turnoNuevo, &$cambiosPorFuncionario): void
    {
        if (! isset($cambiosPorFuncionario[$empleado->id])) {
            // Usar first_name + paternal_lastname si están disponibles, sino usar name completo
            $nombreParaMostrar = $empleado->first_name && $empleado->paternal_lastname
                ? $empleado->first_name . ' ' . $empleado->paternal_lastname
                : $empleado->name;

            $cambiosPorFuncionario[$empleado->id] = [
                'nombre'   => $nombreParaMostrar,
                'telefono' => $empleado->phone,
                'cambios'  => [],
            ];
        }

        $cambiosPorFuncionario[$empleado->id]['cambios'][] = [
            'fecha'          => $fecha,
            'turno_anterior' => $turnoAnterior,
            'turno_nuevo'    => $turnoNuevo,
        ];
    }

    /**
     * Get shift description from code
     */
    private function getShiftDescription($shift): string
    {
        return match ($shift) {
            'PE'    => 'Patrulla Escolar',
            'PG'    => 'Permiso por día compensado',
            'A'     => 'Administrativo',
            'AE'    => 'Administrativo Extra',
            'LM'    => 'Licencia Médica',
            'S'     => 'Día Sindical',
            'SE'    => 'Día Sindical Extra',
            'M'     => 'Mañana',
            'T'     => 'Tarde',
            'N'     => 'Noche',
            'ME'    => 'Mañana Extra',
            'TE'    => 'Tarde Extra',
            'NE'    => 'Noche Extra',
            'F'     => 'Franco',
            'FE'    => 'Franco Extra',
            'L'     => 'Libre',
            'LE'    => 'Libre Extra',
            '1'     => 'Primer Turno',
            '2'     => 'Segundo Turno',
            '3'     => 'Tercer Turno',
            '1E'    => 'Primer Turno Extra',
            '2E'    => 'Segundo Turno Extra',
            '3E'    => 'Tercer Turno Extra',
            'E'     => 'Extra',
            'V'     => 'Vacaciones',
            'P'     => 'Permiso / Cumpleaño',
            'SA', 'X' => 'Sin Asignar',
            null, '', ' ' => 'Sin Turno',
            default => 'Desconocido',
        };
    }

    /**
     * Send consolidated messages to notification numbers
     */
    private function sendConsolidatedMessages(array $cambiosPorFuncionario, array $numerosAReportarCambios, bool $testingMode = false, bool $sendToEmployee = true): void
    {
        foreach ($cambiosPorFuncionario as $funcionarioId => $datosFuncionario) {
            if (empty($datosFuncionario['cambios'])) {
                continue;
            }

            // Filtrar cambios que no deben notificarse (turnos sin asignar o vacíos)
            $cambiosValidos = $this->filterValidChanges($datosFuncionario['cambios']);

            if (empty($cambiosValidos)) {
                continue;
            }

            // Actualizar los cambios con solo los válidos
            $datosFuncionario['cambios'] = $cambiosValidos;
            $mensaje                     = $this->buildConsolidatedMessage($datosFuncionario);

            // Agregar el teléfono del empleado afectado a la lista de números a reportar
            $numerosConEmpleado = $numerosAReportarCambios;
            if (!empty($datosFuncionario['telefono']) && !in_array($datosFuncionario['telefono'], $numerosConEmpleado)) {
                $numerosConEmpleado[] = $datosFuncionario['telefono'];
                Log::info('📱 Agregando teléfono del empleado afectado a la lista de notificaciones:', [
                    'telefono_empleado' => $datosFuncionario['telefono'],
                    'nombre_empleado' => $datosFuncionario['nombre'],
                    'numeros_originales' => $numerosAReportarCambios,
                    'numeros_con_empleado' => $numerosConEmpleado
                ]);
            }

            // Siempre usar sendProductionMessages, pero con números de prueba si está en testing mode
            $this->sendProductionMessages($mensaje, $numerosConEmpleado, $datosFuncionario, $testingMode, $sendToEmployee);
        }
    }

    /**
     * Check if we're in test mode (local environment)
     */
    private function isTestMode(): bool
    {
        return app()->environment('local') || app()->environment('testing');
    }

    /**
     * Send test messages (only to test number in local environment)
     */
    private function sendTestMessages(string $mensaje, array $numerosAReportarCambios, array $datosFuncionario): void
    {
        $testNumber         = "951004035"; // Tu número de prueba
        $phoneToNameMapping = $this->getPhoneToNameMapping();

        $mensajePrueba = "🧪 MODO PRUEBA - WhatsApp\n\n";
        $mensajePrueba .= "📋 Destinatarios que recibirían el mensaje:\n";

        // Listar todos los destinatarios que recibirían el mensaje con sus nombres
        foreach ($numerosAReportarCambios as $numero) {
            $nombre = $phoneToNameMapping[$numero] ?? 'Desconocido';
            $mensajePrueba .= "• {$numero} ({$nombre})\n";
        }

        if ($datosFuncionario['telefono']) {
            $mensajePrueba .= "• {$datosFuncionario['telefono']} ({$datosFuncionario['nombre']} - empleado)\n";
        }

        $mensajePrueba .= "\n📱 Mensaje original:\n{$mensaje}";

        // Log del mensaje de prueba
        Log::info('🧪 Mensaje de prueba WhatsApp', [
            'destinatarios'     => $numerosAReportarCambios,
            'empleado_telefono' => $datosFuncionario['telefono'] ?? null,
            'mensaje'           => $mensaje,
            'test_number'       => $testNumber,
        ]);

        // Enviar solo al número de prueba (asíncrono)
        SendWhatsAppMessage::dispatch($mensajePrueba, $testNumber, true, $testNumber);

        Log::info('📤 Mensaje de prueba encolado para envío asíncrono', [
            'test_number' => $testNumber,
        ]);
    }

    /**
     * Send production messages
     */
        private function sendProductionMessages(string $mensaje, array $numerosAReportarCambios, array $datosFuncionario, bool $testingMode = false, bool $sendToEmployee = true): void
    {
        $testNumber = "951004035";

        Log::info('🔍 DEBUG - sendProductionMessages llamado:', [
            'testing_mode' => $testingMode,
            'test_number' => $testNumber,
            'numeros_a_reportar' => $numerosAReportarCambios,
            'empleado_telefono' => $datosFuncionario['telefono'] ?? 'No disponible'
        ]);

        $numeroEduardoEsparza = "968012847";

        // Send to notification contacts (asíncrono)
        foreach ($numerosAReportarCambios as $numero) {
            $esEduardoInfoReal = ($numero === $numeroEduardoEsparza);
            $aplicarTest = $testingMode && !$esEduardoInfoReal;

            $mensajeFinal = $aplicarTest ?
                "🧪 MODO TESTING - WhatsApp\n\n📋 Este mensaje se enviaría a: {$numero}\n\n📱 Mensaje original:\n{$mensaje}" :
                $mensaje;

            $numeroFinal = $aplicarTest ? $testNumber : $numero;

            // Enviar mensaje de forma asíncrona
            SendWhatsAppMessage::dispatch($mensajeFinal, $numeroFinal, $aplicarTest, $numero);

            Log::info('📤 Mensaje encolado para envío asíncrono a destinatario', [
                'numero_original' => $numero,
                'numero_enviado'  => $numeroFinal,
                'testing_mode'    => $aplicarTest,
            ]);
        }

        // Send to employee if enabled and they have a phone number (asíncrono)
        if ($sendToEmployee && !empty($datosFuncionario['telefono'])) {
            // Verificar que no se haya enviado ya (para evitar duplicados)
            $yaEnviado = in_array($datosFuncionario['telefono'], $numerosAReportarCambios);

            if (!$yaEnviado) {
                Log::info('🔍 DEBUG - Enviando a empleado afectado (siempre se notifica):', [
                    'testing_mode' => $testingMode,
                    'telefono_empleado' => $datosFuncionario['telefono'],
                    'test_number' => $testNumber,
                    'numero_final_calculado' => $testingMode ? $testNumber : $datosFuncionario['telefono'],
                ]);

                $mensajeFinal = $testingMode ?
                    "🧪 MODO TESTING - WhatsApp\n\n📋 Este mensaje se enviaría al empleado: {$datosFuncionario['telefono']}\n\n📱 Mensaje original:\n{$mensaje}" :
                    $mensaje;

                $numeroFinal = $testingMode ? $testNumber : $datosFuncionario['telefono'];

                // Enviar mensaje de forma asíncrona
                SendWhatsAppMessage::dispatch($mensajeFinal, $numeroFinal, $testingMode, $datosFuncionario['telefono']);

                Log::info('📤 Mensaje encolado para envío asíncrono a empleado afectado', [
                    'numero_original' => $datosFuncionario['telefono'],
                    'numero_enviado'  => $numeroFinal,
                    'testing_mode'    => $testingMode,
                ]);
            } else {
                Log::info('🔍 DEBUG - Empleado ya recibió mensaje (está en lista de notificaciones):', [
                    'telefono_empleado' => $datosFuncionario['telefono'],
                ]);
            }
        } else {
            Log::info('🔍 DEBUG - NO enviando a empleado (sin teléfono):', [
                'empleado_id' => $datosFuncionario['id'] ?? 'N/A',
                'nombre_empleado' => $datosFuncionario['nombre'] ?? 'N/A',
            ]);
        }
    }

    /**
     * Build consolidated message for an employee
     */
    private function buildConsolidatedMessage(array $datosFuncionario): string
    {

        $nombreCorto = $this->getShortName($datosFuncionario['nombre']);
        $mensaje     = "Se *Autoriza* el turno de: *{$nombreCorto}* _siendo modificado_ los días:\n";

        foreach ($datosFuncionario['cambios'] as $cambio) {
            $fechaFormateada = date('d/m/Y', strtotime($cambio['fecha']));
            $mensaje .= "• *{$fechaFormateada}* de \"*{$cambio['turno_anterior']}*\" a \"*{$cambio['turno_nuevo']}*\"\n";
        }

        return $mensaje;
    }

    /**
     * Filter changes to exclude unassigned or empty shifts
     */
    private function filterValidChanges(array $cambios): array
    {
        $turnosNoNotificables = ['Sin Asignar', 'Sin Turno', 'Desconocido'];

        return array_filter($cambios, function ($cambio) use ($turnosNoNotificables) {
            $turnoAnterior = $cambio['turno_anterior'];
            $turnoNuevo    = $cambio['turno_nuevo'];

            // No notificar si ambos turnos son no notificables
            if (in_array($turnoAnterior, $turnosNoNotificables) && in_array($turnoNuevo, $turnosNoNotificables)) {
                return false;
            }

            // No notificar si el turno nuevo es no notificable
            if (in_array($turnoNuevo, $turnosNoNotificables)) {
                return false;
            }

            return true;
        });
    }

    /**
     * Extract first name and paternal surname from full name
     * Nota: Ahora el nombre ya viene formateado correctamente desde addChangeToEmployee
     */
    private function getShortName(string $fullName): string
    {
        // El nombre ya viene formateado como "Nombre Paternal_surname"
        return $fullName;
    }
}
