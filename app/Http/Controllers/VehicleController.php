<?php

namespace App\Http\Controllers;

use App\Models\Vehicle;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    public function index()
    {
        $vehicles = Vehicle::orderBy('name')->get();
        return inertia('vehicles/index', [
            'vehicles' => $vehicles,
            'types'    => Vehicle::types(),
            'statuses' => Vehicle::statuses(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'plate_number' => 'nullable|string|max:20',
            'type'         => 'required|in:patrol,motorcycle,bicycle,drone,van,other',
            'status'       => 'required|in:available,in_use,maintenance,inactive',
            'notes'        => 'nullable|string|max:500',
            'is_active'    => 'boolean',
        ]);

        Vehicle::create($validated);

        return back()->with('success', 'Vehículo creado exitosamente.');
    }

    public function update(Request $request, int $id)
    {
        $vehicle = Vehicle::findOrFail($id);

        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'plate_number' => 'nullable|string|max:20',
            'type'         => 'required|in:patrol,motorcycle,bicycle,drone,van,other',
            'status'       => 'required|in:available,in_use,maintenance,inactive',
            'notes'        => 'nullable|string|max:500',
            'is_active'    => 'boolean',
        ]);

        $vehicle->update($validated);

        return back()->with('success', 'Vehículo actualizado exitosamente.');
    }

    public function destroy(int $id)
    {
        $vehicle = Vehicle::findOrFail($id);
        $vehicle->delete();

        return back()->with('success', 'Vehículo eliminado exitosamente.');
    }
}
