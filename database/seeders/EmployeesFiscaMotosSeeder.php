<?php

namespace Database\Seeders;

use App\Models\Employees;
use App\Models\Rol;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EmployeesFiscaMotosSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $rolFisca = Rol::firstOrCreate(['nombre' => 'Fiscalizacion']);

        $rolMoto = Rol::firstOrCreate(['nombre' => 'Motorizado']);

        $PersonalMotorizado = [
            "Cesar Soto",
            "Leonardo Sanhueza",
            "Fernando Maturana",
            "Roman Lepin",
            "Nicolas Correa",
            "Joan Ramirez",
            "Raul Carvajal",
            "Pablo Riquelme",
            "Freddy Gonzalez",
            "Christofer Gonzalez",
        ];

        $personalFiscalización = [
            "Elias Fuentes",
            "Javier Fernandez",
            "Victor Silva",
            "Jonathan Torres",
            "Matias Caniulef",
            "Natalia Ñanco",
            "Kevin Vizcarra",
            "Uriel Toro Toro",
            "Raul Huaiquinao Traipe",
            "Robinson Oyarzun",
            "Bernardino Tropa",
            "Fabiola Novoa",
            "Wilson Vidal Paredes",
            "Daniel Obreque",
            "Andrés Painen",
            "Sara Paredes",
            "Raul Campos Ortega",
            "Alvaro Neira",
            "Juan Becerra",
            "Danny Choquechambe",
            "Eduardo Olivares",
            "Rodrigo Ponce",
            "Gastón Salazar",
        ];

        foreach ($PersonalMotorizado as $nombre)
        {
            $nombreFormateado = ucwords(strtolower($nombre));

            $existe = Employees::where('name', $nombreFormateado)->exists();

            if (! $existe) {
                Employees::create([
                    'name' => $nombreFormateado,
                    'amzoma' => false,
                    'rol_id' => $rolMoto->id,
                ]);
            }
        }

        foreach ($personalFiscalización as $nombre)
        {
            $nombreFormateado = ucwords(strtolower($nombre));

            $existe = Employees::where('name', $nombreFormateado)->exists();

            if (! $existe) {
                Employees::create([
                    'name' => $nombreFormateado,
                    'amzoma' => false,
                    'rol_id' => $rolFisca->id,
                ]);
            }
        }
    }
}
