<?php
namespace Database\Seeders;

use App\Models\Employees;
use App\Models\Rol;
use Illuminate\Database\Seeder;

class EmployeesAlertaMovilSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        $rol = Rol::firstOrCreate(['nombre' => 'AlertaMovil']);

        // $patrullerosAmzoma = [
        //     "Baltasar Mercado Maldonado",
        //     "Jaime Ramirez Troncozo",
        //     "Jorge Delgado Mena",
        //     "Natalia Canario Peñafiel",
        //     "Jorge Yañez Yañez",
        //     "Luis Illesca Montre",
        //     "Clancy Henriquez",
        //     "Eliseo Montupil Moreno",
        //     "Alonso Barrientos Coliñanco",
        //     "Oscar Arias Rubio",
        //     "Eugenio Espinoza Yañez",
        //     "Luis Ortega Marín",
        //     "Michael Mellado Yañez",
        //     "Emilio Acuña Lizama",
        //     "Cesar Vasquez Barrera",
        //     "Juan Rojas Urra",
        // ];

        $patrulleros = [
            "Ricardo Mardones Soto",
            "Hugo Guajardo Aguayo",
            "Manuel Vega Vega",
            "Jaime Moncada Ovalle",
            "Ivan Cifuentes Vidal",
            "Patricio Carvajal Campos",
            "Luis Noa Pino",
            "Hugo Gonzalez Martínez",
            "Hugo Alarcon Godoy",
        ];

        // foreach ($patrullerosAmzoma as $nombre) {

        //     $nombreFormateado = ucwords(strtolower($nombre));

        //     $existe = Employees::where('name', $nombreFormateado)->exists();

        //     if (! $existe) {
        //         Employees::create([
        //             'name' => $nombreFormateado,
        //             'amzoma' => true,
        //             'rol_id' => $rol->id
        //         ]);
        //     }
        // }

        foreach ($patrulleros as $nombre) {

            $nombreFormateado = ucwords(strtolower($nombre));

            $existe = Employees::where('name', $nombreFormateado)->exists();

            if (! $existe) {
                Employees::create([
                    'name' => $nombreFormateado,
                    'amzoma' => false,
                    'rol_id' => $rol->id,
                ]);
            }
        }
    }
}
