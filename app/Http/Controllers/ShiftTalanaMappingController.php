<?php

namespace App\Http\Controllers;

use App\Models\ShiftTalanaMapping;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftTalanaMappingController extends Controller
{
    public function index()
    {
        $mappings = ShiftTalanaMapping::orderBy('shift_code')->get();
        return Inertia::render('talana/mappings', [
            'mappings' => $mappings
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'shift_code' => 'required|string|unique:shift_talana_mappings,shift_code|max:10',
            'talana_id' => 'required|integer',
            'description' => 'nullable|string|max:255',
        ]);

        ShiftTalanaMapping::create($request->all());

        return redirect()->back()->with('success', 'Mapeo creado exitosamente');
    }

    public function update(Request $request, $id)
    {
        $mapping = ShiftTalanaMapping::findOrFail($id);

        $request->validate([
            'shift_code' => 'required|string|max:10|unique:shift_talana_mappings,shift_code,' . $id,
            'talana_id' => 'required|integer',
            'description' => 'nullable|string|max:255',
        ]);

        $mapping->update($request->all());

        return redirect()->back()->with('success', 'Mapeo actualizado exitosamente');
    }

    public function destroy($id)
    {
        $mapping = ShiftTalanaMapping::findOrFail($id);
        $mapping->delete();

        return redirect()->back()->with('success', 'Mapeo eliminado exitosamente');
    }
}
