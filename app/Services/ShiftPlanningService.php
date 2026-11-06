<?php

namespace App\Services;

use App\Jobs\SendWhatsAppMessage;
use App\Models\Employees;
use App\Models\EmployeeShifts;
use App\Models\Rol;
use App\Models\ShiftChangeLog;
use App\Models\ShiftDraft;
use App\Models\ShiftPublication;
use App\Models\ShiftType;
use App\Models\WhatsAppRecipient;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Planilla de turnos por facción con borrador y publicación.
 *
 * - Lo publicado vive en employee_shifts (es lo que ven los funcionarios).
 * - Lo que el supervisor está armando vive en shift_drafts y se superpone a lo publicado.
 * - Publicar aplica el borrador, deja historial en shift_change_logs y avisa a cada persona una sola vez.
 */
class ShiftPlanningService
{
    public const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    private const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

    /** Primer y último día del mes. */
    public function monthRange(int $year, int $month): array
    {
        $start = CarbonImmutable::create($year, $month, 1);

        return [$start->toDateString(), $start->endOfMonth()->toDateString()];
    }

    /** Rango ampliado a semanas completas (lunes a domingo) para calcular horas y descansos en los bordes del mes. */
    public function contextRange(int $year, int $month): array
    {
        $start = CarbonImmutable::create($year, $month, 1);

        return [
            $start->startOfWeek(Carbon::MONDAY)->toDateString(),
            $start->endOfMonth()->endOfWeek(Carbon::SUNDAY)->toDateString(),
        ];
    }

    public static function normalize(?string $code): string
    {
        return strtoupper(trim((string) $code));
    }

    /** Funcionarios de la facción: los no inactivos, más cualquiera que tenga turnos en el rango. */
    public function employeesFor(Rol $rol, string $from, string $to): Collection
    {
        $withShifts = EmployeeShifts::whereBetween('date', [$from, $to])
            ->whereHas('employee', fn ($q) => $q->where('rol_id', $rol->id))
            ->distinct()
            ->pluck('employee_id');

        return Employees::where('rol_id', $rol->id)
            ->where(function ($q) use ($withShifts) {
                $q->whereNull('status')->orWhere('status', '!=', 'inactivo')->orWhereIn('id', $withShifts);
            })
            ->orderBy('name')
            ->get(['id', 'name', 'first_name', 'paternal_lastname', 'status']);
    }

    /** [employee_id => [Y-m-d => código]] de lo publicado. */
    public function publishedMap(array $employeeIds, string $from, string $to): array
    {
        $map = [];
        EmployeeShifts::whereIn('employee_id', $employeeIds)
            ->whereBetween('date', [$from, $to])
            ->get(['employee_id', 'date', 'shift'])
            ->each(function ($s) use (&$map) {
                $map[$s->employee_id][Carbon::parse($s->date)->toDateString()] = self::normalize($s->shift);
            });

        return $map;
    }

    /** [employee_id => [Y-m-d => código | '' (quitar turno)]] del borrador. */
    public function draftMap(array $employeeIds, string $from, string $to): array
    {
        $map = [];
        ShiftDraft::whereIn('employee_id', $employeeIds)
            ->whereBetween('date', [$from, $to])
            ->get(['employee_id', 'date', 'shift'])
            ->each(function ($d) use (&$map) {
                $map[$d->employee_id][Carbon::parse($d->date)->toDateString()] = (string) $d->shift;
            });

        return $map;
    }

    public function draftCount(Rol $rol, int $year, int $month): int
    {
        [$from, $to] = $this->monthRange($year, $month);

        return ShiftDraft::where('rol_id', $rol->id)->whereBetween('date', [$from, $to])->count();
    }

    /** Todo lo que necesita la pantalla de la planilla. */
    public function sheet(Rol $rol, int $year, int $month): array
    {
        [$from, $to] = $this->monthRange($year, $month);
        [$ctxFrom, $ctxTo] = $this->contextRange($year, $month);

        $employees = $this->employeesFor($rol, $ctxFrom, $ctxTo);
        $ids = $employees->pluck('id')->all();

        $lastPublication = ShiftPublication::with('publisher:id,name')
            ->where('rol_id', $rol->id)->where('year', $year)->where('month', $month)
            ->latest()->first();

        $holidays = collect(config('planning.holidays', []))
            ->filter(fn ($name, $date) => $date >= $ctxFrom && $date <= $ctxTo)
            ->all();

        return [
            'rol' => ['id' => $rol->id, 'name' => $rol->nombre, 'color' => $rol->color],
            'month' => sprintf('%04d-%02d', $year, $month),
            'monthLabel' => self::MONTHS[$month - 1] . ' ' . $year,
            'range' => ['from' => $from, 'to' => $to, 'contextFrom' => $ctxFrom, 'contextTo' => $ctxTo],
            'employees' => $employees->map(fn ($e) => [
                'id' => $e->id,
                'name' => $e->name,
                'status' => $e->status,
            ])->values(),
            'published' => (object) $this->publishedMap($ids, $ctxFrom, $ctxTo),
            'drafts' => (object) $this->draftMap($ids, $ctxFrom, $ctxTo),
            'draftCount' => $this->draftCount($rol, $year, $month),
            'lastPublication' => $lastPublication ? [
                'at' => $lastPublication->created_at->toIso8601String(),
                'by' => $lastPublication->publisher?->name,
                'changes' => $lastPublication->changes_count,
            ] : null,
            'shiftTypes' => ShiftType::where('is_active', true)->orderBy('sort_order')
                ->get(['code', 'name', 'category', 'starts_at', 'ends_at', 'hours', 'base_code', 'is_extra', 'color']),
            'minCoverage' => (object) ($rol->planning_settings['min_coverage'] ?? []),
            'holidays' => (object) $holidays,
            'rules' => config('planning.rules'),
            'whatsappRecipients' => WhatsAppRecipient::where('is_active', true)->orderBy('name')->get(['id', 'name', 'role']),
        ];
    }

    /**
     * Guarda cambios en el borrador. Si un cambio deja la celda igual a lo publicado, se quita del borrador.
     *
     * @param  array<int, array{employee_id:int, date:string, shift:?string}>  $changes
     */
    public function saveDraft(Rol $rol, array $changes, int $userId): void
    {
        $codes = array_flip(ShiftType::activeCodes());
        $employeeIds = array_flip(Employees::where('rol_id', $rol->id)->pluck('id')->all());

        foreach ($changes as $i => $change) {
            $shift = self::normalize($change['shift'] ?? '');
            if (! isset($employeeIds[(int) $change['employee_id']])) {
                throw ValidationException::withMessages(["changes.$i.employee_id" => 'El funcionario no pertenece a esta facción.']);
            }
            if ($shift !== '' && ! isset($codes[$shift])) {
                throw ValidationException::withMessages(["changes.$i.shift" => "El código \"$shift\" no existe en el catálogo de turnos."]);
            }
        }

        DB::transaction(function () use ($rol, $changes, $userId) {
            foreach ($changes as $change) {
                $employeeId = (int) $change['employee_id'];
                $date = Carbon::parse($change['date'])->toDateString();
                $shift = self::normalize($change['shift'] ?? '');

                $published = self::normalize(
                    EmployeeShifts::where('employee_id', $employeeId)->whereDate('date', $date)->value('shift')
                );

                if ($shift === $published) {
                    ShiftDraft::where('employee_id', $employeeId)->where('date', $date)->delete();

                    continue;
                }

                ShiftDraft::updateOrCreate(
                    ['employee_id' => $employeeId, 'date' => $date],
                    ['rol_id' => $rol->id, 'shift' => $shift === '' ? null : $shift, 'updated_by' => $userId],
                );
            }
        });
    }

    public function discardDraft(Rol $rol, int $year, int $month): int
    {
        [$from, $to] = $this->monthRange($year, $month);

        return ShiftDraft::where('rol_id', $rol->id)->whereBetween('date', [$from, $to])->delete();
    }

    /**
     * Publica el borrador del mes: lo aplica a employee_shifts, deja historial y encola un aviso por persona.
     *
     * @return array{changes:int, employees:int, notified:int}
     */
    public function publish(Rol $rol, int $year, int $month, int $userId, bool $notifyEmployees, array $recipientIds = []): array
    {
        [$from, $to] = $this->monthRange($year, $month);
        $perEmployee = [];
        $changes = 0;
        $publication = null;

        DB::transaction(function () use ($rol, $from, $to, $userId, $year, $month, &$perEmployee, &$changes, &$publication) {
            $drafts = ShiftDraft::with('employee')
                ->where('rol_id', $rol->id)
                ->whereBetween('date', [$from, $to])
                ->orderBy('employee_id')->orderBy('date')
                ->lockForUpdate()
                ->get();

            foreach ($drafts as $draft) {
                $employee = $draft->employee;
                $date = Carbon::parse($draft->date)->toDateString();
                $new = self::normalize($draft->shift);
                $draft->delete();

                if (! $employee) {
                    continue;
                }

                $current = EmployeeShifts::where('employee_id', $employee->id)->whereDate('date', $date)->first();
                $old = self::normalize($current?->shift);
                if ($old === $new) {
                    continue;
                }

                if ($new === '') {
                    ShiftChangeLog::create([
                        'employee_id' => $employee->id, 'employee_shift_id' => null, 'changed_by' => $userId,
                        'old_shift' => $current->shift, 'new_shift' => '', 'shift_date' => $date,
                        'comment' => 'Turno eliminado al publicar la planilla',
                    ]);
                    $current->delete();
                } else {
                    if ($current) {
                        $current->update(['shift' => $new]);
                        $saved = $current;
                    } else {
                        $saved = EmployeeShifts::create(['employee_id' => $employee->id, 'date' => $date, 'shift' => $new, 'comments' => '']);
                    }
                    ShiftChangeLog::create([
                        'employee_id' => $employee->id, 'employee_shift_id' => $saved->id, 'changed_by' => $userId,
                        'old_shift' => $old, 'new_shift' => $new, 'shift_date' => $date,
                        'comment' => $current ? 'Turno modificado al publicar la planilla' : 'Turno creado al publicar la planilla',
                    ]);
                }

                $perEmployee[$employee->id]['employee'] = $employee;
                $perEmployee[$employee->id]['changes'][] = ['date' => $date, 'old' => $old, 'new' => $new];
                $changes++;
            }

            $publication = ShiftPublication::create([
                'rol_id' => $rol->id, 'year' => $year, 'month' => $month, 'published_by' => $userId,
                'changes_count' => $changes, 'employees_count' => count($perEmployee),
            ]);
        });

        $notified = $this->notify($perEmployee, $year, $month, $notifyEmployees, $recipientIds);

        if ($notified > 0) {
            $publication->update(['notified' => true]);
        }

        return ['changes' => $changes, 'employees' => count($perEmployee), 'notified' => $notified];
    }

    /** Encola un solo mensaje por funcionario con todos sus cambios. Devuelve cuántos mensajes se encolaron. */
    private function notify(array $perEmployee, int $year, int $month, bool $notifyEmployees, array $recipientIds): int
    {
        if (! $notifyEmployees && empty($recipientIds)) {
            return 0;
        }

        $names = ShiftType::pluck('name', 'code')->all();
        $copyTo = WhatsAppRecipient::whereIn('id', $recipientIds)->where('is_active', true)
            ->pluck('phone')->map(fn ($p) => $this->normalizePhone($p))->filter()->all();

        $sent = 0;
        foreach ($perEmployee as $info) {
            $visible = array_values(array_filter($info['changes'], fn ($c) => $c['new'] !== ''));
            if (! $visible) {
                continue;
            }

            $message = $this->buildMessage($info['employee'], $visible, $names, $year, $month);
            $phones = $copyTo;
            if ($notifyEmployees && ($own = $this->normalizePhone($info['employee']->phone))) {
                $phones[] = $own;
            }

            foreach (array_unique($phones) as $phone) {
                SendWhatsAppMessage::dispatch($message, $phone, false, $phone);
                $sent++;
            }
        }

        return $sent;
    }

    private function buildMessage(Employees $employee, array $changes, array $names, int $year, int $month): string
    {
        $who = $employee->first_name && $employee->paternal_lastname
            ? "{$employee->first_name} {$employee->paternal_lastname}"
            : $employee->name;
        $label = fn (string $code) => $code === '' ? 'Sin turno' : ($names[$code] ?? $code);
        $url = rtrim((string) config('app.url'), '/') . "/turno-mensual?year={$year}&month={$month}";

        $text = "Hola *{$who}*, se publicaron tus turnos de *" . self::MONTHS[$month - 1] . " {$year}*.\n";

        if (count($changes) <= 10) {
            foreach ($changes as $c) {
                $d = CarbonImmutable::parse($c['date']);
                $text .= '• ' . self::WEEKDAYS[$d->dayOfWeek] . ' ' . $d->format('d/m') . ': ' . $label($c['old']) . ' → *' . $label($c['new']) . "*\n";
            }
        } else {
            $text .= 'Tienes ' . count($changes) . " días con turnos nuevos o modificados.\n";
        }

        return $text . "\nRevísalos en la app: {$url}";
    }

    /** Deja solo los 9 dígitos del celular (el job antepone el 56). */
    private function normalizePhone(?string $phone): ?string
    {
        $digits = preg_replace('/\D/', '', (string) $phone);
        if (strlen($digits) === 11 && str_starts_with($digits, '56')) {
            $digits = substr($digits, 2);
        }

        return strlen($digits) === 9 ? $digits : null;
    }

    /**
     * @param  array<string, array{min:int, weekdays_only?:bool}>  $minimums
     */
    public function updateMinimums(Rol $rol, array $minimums): array
    {
        $codes = array_flip(ShiftType::where('is_extra', false)->where('category', 'work')->pluck('code')->all());
        $clean = [];
        foreach ($minimums as $code => $rule) {
            $code = self::normalize($code);
            if (! isset($codes[$code])) {
                throw ValidationException::withMessages(["minimums.$code" => "El turno \"$code\" no admite mínimo de cobertura."]);
            }
            $min = (int) ($rule['min'] ?? 0);
            if ($min > 0) {
                $clean[$code] = ['min' => min($min, 99), 'weekdays_only' => (bool) ($rule['weekdays_only'] ?? false)];
            }
        }

        $settings = $rol->planning_settings ?? [];
        $settings['min_coverage'] = $clean;
        $rol->planning_settings = $settings;
        $rol->save();

        return $clean;
    }
}
