<?php

use App\Jobs\SendWhatsAppMessage;
use App\Models\Employees;
use App\Models\EmployeeShifts;
use App\Models\Rol;
use App\Models\ShiftChangeLog;
use App\Models\ShiftDraft;
use App\Models\ShiftPublication;
use App\Models\ShiftType;
use App\Models\User;
use Illuminate\Support\Facades\Queue;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Administrador', 'Supervisor', 'Usuario'] as $name) {
        Role::firstOrCreate(['name' => $name]);
    }
    $this->rol = Rol::create(['nombre' => 'Despachadores', 'is_operational' => true]);
    $this->otherRol = Rol::create(['nombre' => 'Fiscalización', 'is_operational' => true]);
    $this->ana = Employees::create(['name' => 'Ana Rojas', 'amzoma' => false, 'rol_id' => $this->rol->id, 'phone' => '912345678', 'first_name' => 'Ana', 'paternal_lastname' => 'Rojas']);
    $this->beto = Employees::create(['name' => 'Beto Díaz', 'amzoma' => false, 'rol_id' => $this->rol->id]);
    $this->outsider = Employees::create(['name' => 'Otra Persona', 'amzoma' => false, 'rol_id' => $this->otherRol->id]);
    EmployeeShifts::create(['employee_id' => $this->ana->id, 'date' => '2026-12-01', 'shift' => 'M', 'comments' => '']);
    EmployeeShifts::create(['employee_id' => $this->ana->id, 'date' => '2026-12-02', 'shift' => 'T', 'comments' => '']);
});

function planningUser(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

function saveDraft($test, $user, array $changes)
{
    return $test->actingAs($user)->putJson("/planificacion/{$test->rol->id}/borrador", ['mes' => '2026-12', 'changes' => $changes]);
}

it('trae el catálogo de turnos cargado por la migración', function () {
    expect(ShiftType::where('code', 'M')->value('category'))->toBe('work')
        ->and(ShiftType::where('code', 'NE')->value('base_code'))->toBe('N')
        ->and(ShiftType::where('code', 'V')->value('category'))->toBe('absence');
});

it('muestra la planilla a un supervisor con lo publicado y el borrador', function () {
    ShiftDraft::create(['rol_id' => $this->rol->id, 'employee_id' => $this->beto->id, 'date' => '2026-12-03', 'shift' => 'N']);

    $this->actingAs(planningUser('Supervisor'))
        ->get("/planificacion/{$this->rol->id}?mes=2026-12")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('planning/sheet')
            ->where('month', '2026-12')
            ->where('range.from', '2026-12-01')
            ->where('range.contextFrom', '2026-11-30')
            ->has('employees', 2)
            ->where("published.{$this->ana->id}.2026-12-01", 'M')
            ->where("drafts.{$this->beto->id}.2026-12-03", 'N')
            ->where('draftCount', 1)
            ->has('shiftTypes'));
});

it('impide la planilla a un usuario sin rol de supervisor', function () {
    $this->actingAs(planningUser('Usuario'))->getJson("/planificacion/{$this->rol->id}")->assertForbidden();
    saveDraft($this, planningUser('Usuario'), [['employee_id' => $this->ana->id, 'date' => '2026-12-05', 'shift' => 'M']])->assertForbidden();
});

it('guarda el borrador sin tocar lo publicado', function () {
    saveDraft($this, planningUser('Supervisor'), [
        ['employee_id' => $this->ana->id, 'date' => '2026-12-01', 'shift' => 'N'],
        ['employee_id' => $this->beto->id, 'date' => '2026-12-01', 'shift' => 'm'],
    ])->assertOk()->assertJson(['draftCount' => 2]);

    expect(EmployeeShifts::where('employee_id', $this->ana->id)->whereDate('date', '2026-12-01')->value('shift'))->toBe('M')
        ->and(ShiftDraft::where('employee_id', $this->beto->id)->value('shift'))->toBe('M');
});

it('quita del borrador una celda que vuelve a quedar igual a lo publicado', function () {
    $sup = planningUser('Supervisor');
    saveDraft($this, $sup, [['employee_id' => $this->ana->id, 'date' => '2026-12-01', 'shift' => 'N']])->assertJson(['draftCount' => 1]);
    saveDraft($this, $sup, [['employee_id' => $this->ana->id, 'date' => '2026-12-01', 'shift' => 'M']])->assertJson(['draftCount' => 0]);

    expect(ShiftDraft::count())->toBe(0);
});

it('rechaza códigos que no existen y funcionarios de otra facción', function () {
    $sup = planningUser('Supervisor');
    saveDraft($this, $sup, [['employee_id' => $this->ana->id, 'date' => '2026-12-05', 'shift' => 'P/N']])->assertUnprocessable();
    saveDraft($this, $sup, [['employee_id' => $this->outsider->id, 'date' => '2026-12-05', 'shift' => 'M']])->assertUnprocessable();

    expect(ShiftDraft::count())->toBe(0);
});

it('publica el borrador, deja historial y avisa una sola vez por persona', function () {
    Queue::fake();
    $sup = planningUser('Supervisor');

    saveDraft($this, $sup, [
        ['employee_id' => $this->ana->id, 'date' => '2026-12-01', 'shift' => 'N'],   // modifica
        ['employee_id' => $this->ana->id, 'date' => '2026-12-02', 'shift' => ''],    // elimina
        ['employee_id' => $this->ana->id, 'date' => '2026-12-03', 'shift' => 'L'],   // crea
        ['employee_id' => $this->beto->id, 'date' => '2026-12-04', 'shift' => 'M'],  // crea (sin teléfono)
    ])->assertOk();

    $this->actingAs($sup)
        ->post("/planificacion/{$this->rol->id}/publicar", ['mes' => '2026-12', 'notify_employees' => true])
        ->assertRedirect();

    expect(EmployeeShifts::where('employee_id', $this->ana->id)->whereDate('date', '2026-12-01')->value('shift'))->toBe('N')
        ->and(EmployeeShifts::where('employee_id', $this->ana->id)->whereDate('date', '2026-12-02')->exists())->toBeFalse()
        ->and(EmployeeShifts::where('employee_id', $this->ana->id)->whereDate('date', '2026-12-03')->value('shift'))->toBe('L')
        ->and(EmployeeShifts::where('employee_id', $this->beto->id)->whereDate('date', '2026-12-04')->value('shift'))->toBe('M')
        ->and(ShiftDraft::count())->toBe(0)
        ->and(ShiftChangeLog::count())->toBe(4);

    $publication = ShiftPublication::first();
    expect($publication->changes_count)->toBe(4)
        ->and($publication->employees_count)->toBe(2)
        ->and($publication->published_by)->toBe($sup->id);

    // Ana tiene teléfono: un solo mensaje con todos sus cambios. Beto no tiene teléfono: no se envía nada.
    Queue::assertPushed(SendWhatsAppMessage::class, 1);
    Queue::assertPushed(SendWhatsAppMessage::class, fn ($job) => $job->numero === '912345678'
        && str_contains($job->mensaje, 'diciembre 2026')
        && str_contains($job->mensaje, 'Noche'));
});

it('no envía avisos si se desactivan al publicar', function () {
    Queue::fake();
    $sup = planningUser('Supervisor');
    saveDraft($this, $sup, [['employee_id' => $this->ana->id, 'date' => '2026-12-01', 'shift' => 'N']]);

    $this->actingAs($sup)->post("/planificacion/{$this->rol->id}/publicar", ['mes' => '2026-12', 'notify_employees' => false]);

    Queue::assertNothingPushed();
    expect(EmployeeShifts::where('employee_id', $this->ana->id)->whereDate('date', '2026-12-01')->value('shift'))->toBe('N');
});

it('descarta el borrador del mes', function () {
    $sup = planningUser('Supervisor');
    saveDraft($this, $sup, [['employee_id' => $this->ana->id, 'date' => '2026-12-10', 'shift' => 'N']]);

    $this->actingAs($sup)->delete("/planificacion/{$this->rol->id}/borrador", ['mes' => '2026-12'])->assertRedirect();

    expect(ShiftDraft::count())->toBe(0)
        ->and(EmployeeShifts::where('employee_id', $this->ana->id)->whereDate('date', '2026-12-10')->exists())->toBeFalse();
});

it('guarda los mínimos de cobertura de la facción', function () {
    $this->actingAs(planningUser('Supervisor'))
        ->putJson("/planificacion/{$this->rol->id}/minimos", ['minimums' => ['M' => ['min' => 2, 'weekdays_only' => true], 'T' => ['min' => 0]]])
        ->assertOk()
        ->assertJson(['minCoverage' => ['M' => ['min' => 2, 'weekdays_only' => true]]]);

    expect($this->rol->fresh()->planning_settings['min_coverage'])->toBe(['M' => ['min' => 2, 'weekdays_only' => true]]);
});

it('deja editar el catálogo solo a administradores', function () {
    $type = ShiftType::where('code', 'M')->first();
    $data = ['name' => 'Mañana', 'category' => 'work', 'starts_at' => '08:00', 'ends_at' => '16:00', 'hours' => 8, 'color' => 'amber', 'is_extra' => false, 'is_active' => true];

    $this->actingAs(planningUser('Supervisor'))->putJson("/planificacion/turnos/{$type->id}", $data)->assertForbidden();
    $this->actingAs(planningUser('Administrador'))->put("/planificacion/turnos/{$type->id}", $data)->assertRedirect();

    expect($type->fresh()->starts_at)->toBe('08:00');
});
