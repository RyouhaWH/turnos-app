<?php

namespace Database\Seeders;

use App\Models\Employees;
use App\Models\Rol;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class FuncionariosFiscalizacionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener el rol de Fiscalización existente (buscar con o sin tilde)
        $rolFiscalizacion = Rol::where('nombre', 'Fiscalización')
            ->orWhere('nombre', 'Fiscalizacion')
            ->first();

        if (!$rolFiscalizacion) {
            throw new \Exception('El rol de Fiscalización no existe en la base de datos. Por favor, créalo primero.');
        }

        $funcionarios = [
            [
                'rut' => '20106805-3',
                'first_name' => 'Barbra',
                'paternal_lastname' => 'Jara',
            ],
            [
                'rut' => '12343775-6',
                'first_name' => 'Carlos',
                'paternal_lastname' => 'Soto',
            ],
            [
                'rut' => '19478480-5',
                'first_name' => 'Cristina',
                'paternal_lastname' => 'Ravanal',
            ],
            [
                'rut' => '19304481-6',
                'first_name' => 'Franco',
                'paternal_lastname' => 'Duran',
            ],
            [
                'rut' => '11587428-4',
                'first_name' => 'Gaston',
                'paternal_lastname' => 'Pinilla',
            ],
            [
                'rut' => '12325719-7',
                'first_name' => 'Julio',
                'paternal_lastname' => 'Saez',
            ],
            [
                'rut' => '12294476-K',
                'first_name' => 'Mauro',
                'paternal_lastname' => 'Vargas',
            ],
            [
                'rut' => '10630544-7',
                'first_name' => 'Pedro',
                'paternal_lastname' => 'Muñoz',
            ],
            [
                'rut' => '12927116-7',
                'first_name' => 'Rene',
                'paternal_lastname' => 'Calluan',
            ],
            [
                'rut' => '10780392-0',
                'first_name' => 'Richard',
                'paternal_lastname' => 'Alarcon',
            ],
            [
                'rut' => '11948379-4',
                'first_name' => 'Ramon',
                'paternal_lastname' => 'Alfaro',
            ],
        ];

        // Insertar los funcionarios y crear sus cuentas de usuario
        foreach ($funcionarios as $funcionario) {
            // Construir el nombre completo
            $name = trim($funcionario['first_name'] . ' ' . $funcionario['paternal_lastname']);

            // Generar email: first_name.paternal_lastname@amzoma.cl (en minúsculas)
            $email = strtolower($funcionario['first_name'] . '.' . $funcionario['paternal_lastname']) . '@amzoma.cl';

            // Generar contraseña: RUT sin el guión (ej: 20106805-3 -> 20106805)
            $password = str_replace('-', '', explode('-', $funcionario['rut'])[0]);

            // Crear o actualizar el usuario
            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make($password),
                ]
            );

            // Crear o actualizar el empleado y asociarlo con el usuario
            DB::table('employees')->updateOrInsert(
                ['rut' => $funcionario['rut']], // Condición de búsqueda por RUT
                [
                    'name' => $name,
                    'first_name' => $funcionario['first_name'],
                    'paternal_lastname' => $funcionario['paternal_lastname'],
                    'rut' => $funcionario['rut'],
                    'rol_id' => $rolFiscalizacion->id,
                    'status' => 'activo',
                    'amzoma' => true,
                    'user_id' => $user->id,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}

