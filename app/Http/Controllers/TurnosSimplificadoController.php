<?php

namespace App\Http\Controllers;

use App\Models\Employees;
use App\Models\EmployeeShifts;
use App\Models\Rol;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TurnosSimplificadoController extends Controller
{
    /**
     * Muestra la vista simplificada de turnos para roles operativos
     */
    public function index()
    {
        // Obtener el mes y año actual
        $month = now()->month;
        $year = now()->year;

        // Obtener roles operativos
        $rolesOperativos = Rol::where('is_operational', true)->get();

        // Obtener funcionarios con roles operativos
        $funcionarios = Employees::whereIn('rol_id', $rolesOperativos->pluck('id'))
            ->with('rol')
            ->get();

        // Obtener turnos para el mes actual
        $turnos = EmployeeShifts::whereIn('employee_id', $funcionarios->pluck('id'))
            ->whereMonth('date', $month)
            ->whereYear('date', $year)
            ->get();

        // Preparar datos para la vista
        $datosParaVista = $funcionarios->map(function ($funcionario) use ($turnos, $month, $year) {
            $turnosFuncionario = $turnos->where('employee_id', $funcionario->id);

            // Crear array con días del mes
            $diasDelMes = [];
            $diasEnMes = cal_days_in_month(CAL_GREGORIAN, $month, $year);

            for ($dia = 1; $dia <= $diasEnMes; $dia++) {
                $fecha = sprintf('%d-%02d-%02d', $year, $month, $dia);
                $turno = $turnosFuncionario->where('date', $fecha)->first();

                $diasDelMes[$dia + 1] = $turno ? $turno->shift : '';
            }

            return [
                'id' => $funcionario->id,
                'nombre' => $funcionario->name,
                'rol' => $funcionario->rol->name,
                'color' => $funcionario->rol->color,
                ...$diasDelMes
            ];
        });


        dd($datosParaVista);

        return Inertia::render('Turnos/TurnosSimplificado', [
            'datos' => $datosParaVista,
            'mes' => $month,
            'anio' => $year
        ]);
    }
}
