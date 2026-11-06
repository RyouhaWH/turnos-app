<?php

namespace App\Http\Controllers;

use App\Models\Rol;
use App\Services\ShiftPlanningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Planilla de turnos por facción (supervisores y administradores).
 */
class PlanningController extends Controller
{
    public function __construct(private readonly ShiftPlanningService $planning) {}

    public function show(Request $request, Rol $rol): Response
    {
        [$year, $month] = $this->parseMonth($request->query('mes'));

        return Inertia::render('planning/sheet', [
            ...$this->planning->sheet($rol, $year, $month),
            'canManageCatalog' => (bool) $request->user()?->hasRole('Administrador'),
        ]);
    }

    public function saveDraft(Request $request, Rol $rol): JsonResponse
    {
        $data = $request->validate([
            'mes' => ['required', 'date_format:Y-m'],
            'changes' => ['required', 'array', 'max:3000'],
            'changes.*.employee_id' => ['required', 'integer'],
            'changes.*.date' => ['required', 'date_format:Y-m-d'],
            'changes.*.shift' => ['nullable', 'string', 'max:10'],
        ]);
        [$year, $month] = $this->parseMonth($data['mes']);

        $this->planning->saveDraft($rol, $data['changes'], $request->user()->id);

        return response()->json([
            'draftCount' => $this->planning->draftCount($rol, $year, $month),
            'savedAt' => now()->toIso8601String(),
        ]);
    }

    public function discardDraft(Request $request, Rol $rol): RedirectResponse
    {
        $data = $request->validate(['mes' => ['required', 'date_format:Y-m']]);
        [$year, $month] = $this->parseMonth($data['mes']);

        $this->planning->discardDraft($rol, $year, $month);

        return back();
    }

    public function publish(Request $request, Rol $rol): RedirectResponse
    {
        $data = $request->validate([
            'mes' => ['required', 'date_format:Y-m'],
            'notify_employees' => ['boolean'],
            'recipients' => ['array'],
            'recipients.*' => ['integer'],
        ]);
        [$year, $month] = $this->parseMonth($data['mes']);

        $this->planning->publish(
            $rol, $year, $month, $request->user()->id,
            (bool) ($data['notify_employees'] ?? true),
            $data['recipients'] ?? [],
        );

        return back();
    }

    public function updateMinimums(Request $request, Rol $rol): JsonResponse
    {
        $data = $request->validate([
            'minimums' => ['present', 'array'],
            'minimums.*.min' => ['required', 'integer', 'min:0', 'max:99'],
            'minimums.*.weekdays_only' => ['boolean'],
        ]);

        return response()->json(['minCoverage' => (object) $this->planning->updateMinimums($rol, $data['minimums'])]);
    }

    /** @return array{0:int, 1:int} */
    private function parseMonth(?string $value): array
    {
        if ($value && preg_match('/^(\d{4})-(\d{2})$/', $value, $m) && (int) $m[2] >= 1 && (int) $m[2] <= 12) {
            return [(int) $m[1], (int) $m[2]];
        }
        $now = now('America/Santiago');

        return [$now->year, $now->month];
    }
}
