<?php

namespace Database\Seeders;

use App\Models\Employees;
use App\Models\Rol;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class FuncionariosPatrullajeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener el rol de Fiscalización existente (buscar con o sin tilde)
        $rolPatrullaje = Rol::where('id', 1)
            ->orWhere('nombre', 'Patrullaje y Proximidad')
            ->first();

        if (!$rolPatrullaje) {
            throw new \Exception('El rol de Patrullaje y Proximidad no existe en la base de datos. Por favor, créalo primero.');
        }

        $funcionarios = [
            [
                'rut' => '11811429-9',
                'first_name' => 'Daniel',
                'paternal_lastname' => 'Obreque',
            ],
            [
                'rut' => '18180263-4',
                'first_name' => 'Alvaro',
                'paternal_lastname' => 'Caniupan',
            ],
            [
                'rut' => '13113413-4',
                'first_name' => 'Carlos',
                'paternal_lastname' => 'Frigerio',
            ],
            [
                'rut' => '9010922-7',
                'first_name' => 'Christian',
                'paternal_lastname' => 'Riquelme',
            ],
            [
                'rut' => '9450803-7',
                'first_name' => 'Hector',
                'paternal_lastname' => 'Osorio',
            ],
            [
                'rut' => '10157069-K',
                'first_name' => 'Ivan',
                'paternal_lastname' => 'Cerda',
            ],
            [
                'rut' => '11222333-4',
                'first_name' => 'Enrique',
                'paternal_lastname' => 'Cuevas',
            ],
            [
                'rut' => '18719694-9',
                'first_name' => 'Rosa',
                'paternal_lastname' => 'Jara',
            ],
        ];

        // Insertar los funcionarios y crear sus cuentas de usuario
        foreach ($funcionarios as $funcionario) {
            // Construir el nombre completo
            $name = trim($funcionario['first_name'] . ' ' . $funcionario['paternal_lastname']);

            // Generar email: first_name.paternal_lastname@amzoma.cl (en minúsculas)
            $email = strtolower($funcionario['first_name'] . '.' . $funcionario['paternal_lastname']) . '@amzoma.cl';

            // Generar contraseña: 3 primeras letras del nombre + 3 primeras del apellido
            $password = strtolower(
                substr($funcionario['first_name'], 0, 3) .
                substr($funcionario['paternal_lastname'], 0, 3)
            );

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
                    'rol_id' => $rolPatrullaje->id,
                    'status' => 'activo',
                    'amzoma' => true,
                    'user_id' => $user->id,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            Log::info("Empleado creado: {$name} - {$email} - {$password}");
        }
    }
}

