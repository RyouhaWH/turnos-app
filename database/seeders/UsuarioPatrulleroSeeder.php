<?php

namespace Database\Seeders;

use App\Models\Rol;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Spatie\Permission\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class UsuarioPatrulleroSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // // Crear el puesto Patrullero si no existe
        // $puesto = Rol::firstOrCreate(['nombre' => 'Patrullero']);

        // // Crear el rol Usuario si no existe
        // $rol = Role::firstOrCreate(['name' => 'Usuario']);

        // $nombres = [
        //     "RICARDO MARDONES SOTO",
        //     "HUGO GUAJARDO AGUAYO",
        //     "MANUEL VEGA VEGA",
        //     "JAIME MONCADA OVALLE",
        //     "IVAN CIFUENTES VIDAL",
        //     "PATRICIO CARVAJAL CAMPOS",
        //     "LUIS NOA PINO",
        //     "HUGO GONZALEZ MARTÍNEZ",
        //     "HUGO ALARCON GODOY",
        //     "BALTASAR MERCADO MALDONADO",
        //     "JAIME RAMIREZ TRONCOZO",
        //     "JORGE DELGADO MENA",
        //     "NATALIA CANARIO PEÑAFIEL",
        //     "JORGE YAÑEZ YAÑEZ",
        //     "LUIS ILLESCA MONTRE",
        //     "CLANCY HENRIQUEZ",
        //     "ELISEO MONTUPIL MORENO",
        //     "ALONSO BARRIENTOS COLIÑANCO",
        //     "OSCAR ARIAS RUBIO",
        //     "EUGENIO ESPINOZA YAÑEZ",
        //     "LUIS ORTEGA MARÍN",
        //     "MICHAEL MELLADO YAÑEZ",
        //     "EMILIO ACUÑA LIZAMA",
        //     "CESAR VASQUEZ BARRERA",
        //     "JUAN ROJAS URRA"
        // ];

        // foreach ($nombres as $nombreCompleto) {
        //     $nombreFormateado = ucwords(strtolower($nombreCompleto));

        //     // Crear correo base (puedes cambiar la lógica)
        //     $correo = Str::slug($nombreFormateado, '.') . '@amzoma.cl';

        //     // Crear usuario
        //     $user = User::firstOrCreate(
        //         ['email' => $correo],
        //         [
        //             'name' => $nombreFormateado,
        //             'password' => Hash::make('1q2w3e4r'),
        //         ]
        //     );

        //     // Asignar rol
        //     $user->assignRole($rol);
        // }
    }
}
