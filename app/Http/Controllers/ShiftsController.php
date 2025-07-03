<?php
namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use App\Models\Shifts;
use Illuminate\Http\Request;

class ShiftsController extends Controller
{

    public function index()
    {
        return Inertia::render('shifts-manager');
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'fecha'   => 'required|date',
            'turno'   => 'required|string|max:10',
        ]);

        $turno = Shifts::updateOrCreate(
            ['user_id' => $request->user_id, 'fecha' => $request->fecha],
            [
                'turno'       => $request->turno,
                'observacion' => $request->observacion,
                'editado_por' => auth::id(),
            ]
        );

        return redirect()->back()->with('success', 'Turno guardado');
    }
}
