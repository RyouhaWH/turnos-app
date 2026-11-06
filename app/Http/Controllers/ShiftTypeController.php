<?php

namespace App\Http\Controllers;

use App\Models\ShiftType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Catálogo de turnos (solo administradores).
 */
class ShiftTypeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('planning/shift-types', [
            'shiftTypes' => ShiftType::orderBy('sort_order')->orderBy('code')->get(),
            'categories' => ShiftType::CATEGORIES,
            'colors' => ShiftType::COLORS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $data['code'] = strtoupper($request->validate([
            'code' => ['required', 'string', 'max:10', 'regex:/^[A-Za-z0-9]+$/', Rule::unique('shift_types', 'code')],
        ])['code']);
        $data['sort_order'] = (int) ShiftType::max('sort_order') + 1;

        ShiftType::create($data);

        return back();
    }

    public function update(Request $request, ShiftType $shiftType): RedirectResponse
    {
        $shiftType->update($this->validated($request));

        return back();
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'category' => ['required', Rule::in(ShiftType::CATEGORIES)],
            'starts_at' => ['nullable', 'date_format:H:i'],
            'ends_at' => ['nullable', 'date_format:H:i', 'required_with:starts_at'],
            'hours' => ['required', 'numeric', 'min:0', 'max:24'],
            'base_code' => ['nullable', 'string', 'max:10', Rule::exists('shift_types', 'code')],
            'is_extra' => ['boolean'],
            'color' => ['required', Rule::in(ShiftType::COLORS)],
            'is_active' => ['boolean'],
        ]);

        if ($data['category'] !== 'work') {
            $data['starts_at'] = null;
            $data['ends_at'] = null;
            $data['hours'] = 0;
        }

        return $data;
    }
}
