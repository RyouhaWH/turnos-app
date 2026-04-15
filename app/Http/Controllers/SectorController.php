<?php

namespace App\Http\Controllers;

use App\Models\Sector;
use Illuminate\Http\Request;

class SectorController extends Controller
{
    public function index()
    {
        $sectors = Sector::orderBy('name')->get();
        return inertia('sectors/index', ['sectors' => $sectors]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:sectors,name',
            'description' => 'nullable|string|max:500',
            'color'       => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active'   => 'boolean',
        ]);

        Sector::create($validated);

        return back()->with('success', 'Sector creado exitosamente.');
    }

    public function update(Request $request, int $id)
    {
        $sector = Sector::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:sectors,name,' . $sector->id,
            'description' => 'nullable|string|max:500',
            'color'       => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'is_active'   => 'boolean',
        ]);

        $sector->update($validated);

        return back()->with('success', 'Sector actualizado exitosamente.');
    }

    public function destroy(int $id)
    {
        $sector = Sector::findOrFail($id);
        $sector->delete();

        return back()->with('success', 'Sector eliminado exitosamente.');
    }
}
