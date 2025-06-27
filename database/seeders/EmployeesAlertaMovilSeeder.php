<?php

namespace Database\Seeders;

use App\Models\Employees;
use App\Models\Rol;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EmployeesAlertaMovilSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        $rol = Rol::firstOrCreate(['nombre' => 'AlertaMovil']);


        $patrulleros = array(
            "Ricardo Mardones Soto",
            "Hugo Guajardo Aguayo",
            "Manuel Vega Vega",
            "Jaime Moncada Ovalle",
            "Ivan Cifuentes Vidal",
            "Patricio Carvajal Campos",
            "Luis Noa Pino",
            "Hugo Gonzalez Martínez",
            "Hugo Alarcon Godoy",
            "Baltasar Mercado Maldonado",
            "Jaime Ramirez Troncozo",
            "Jorge Delgado Mena",
            "Natalia Canario Peñafiel",
            "Jorge Yañez Yañez",
            "Luis Illesca Montre",
            "Clancy Henriquez",
            "Eliseo Montupil Moreno",
            "Alonso Barrientos Coliñanco",
            "Oscar Arias Rubio",
            "Eugenio Espinoza Yañez",
            "Luis Ortega Marín",
            "Michael Mellado Yañez",
            "Emilio Acuña Lizama",
            "Cesar Vasquez Barrera",
            "Juan Rojas Urra"
        );

        foreach($patrulleros as $patrullero)
        {
            Employees::create([
                'name' => ucwords(strtolower($patrullero)),
                'rol_id'=> $rol->id
            ]);
        }


    }
}
