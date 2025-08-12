<?php
namespace Database\Seeders;

use App\Models\Rol;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EmployeesAmzomaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        Rol::firstOrCreate(['nombre' => 'Administrativo']);
        Rol::firstOrCreate(['nombre' => 'Dron']);
        Rol::firstOrCreate(['nombre' => 'Ciclopatrullaje']);
        Rol::firstOrCreate(['nombre' => 'Personal de Servicio']);
        Rol::firstOrCreate(['nombre' => 'Despachadores']);

        $employees = [
            ['name' => 'Natalia Elizabeth Canario Peñapiel', 'rut' => '18719741-4', 'phone' => '974375592', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Oscar Patricio Arias Rubio', 'rut' => '10754865-3', 'phone' => '963720856', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Alonso Waldemar Barrientos Coliñanco', 'rut' => '11689436-K', 'phone' => '989331402', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Clancy Macarena Henriquez San Martin', 'rut' => '13112799-5', 'phone' => '983381398', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Luis Ricardo Illesca Montre', 'rut' => '8687908-5', 'phone' => '987723178', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Eliseo Valdemar Montupil Moreno', 'rut' => '9717227-7', 'phone' => '961113412', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Alfredo Ernesto Lopez Pujol', 'rut' => '22648174-5', 'phone' => '974704144', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Jorge Armando Yañez Yañez', 'rut' => '13955699-2', 'phone' => '936397422', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Luis Patricio Ortega Marin', 'rut' => '14482550-0', 'phone' => '990309162', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Michael Segundo Mellado Yañez', 'rut' => '13733160-8', 'phone' => '945745983', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Cesar Mauricio Vasquez Barrera', 'rut' => '12710338-0', 'phone' => '926180409', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Emilio Alfonso Acuña Lizama', 'rut' => '12927681-9', 'phone' => '997444047', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Juan Armando Rojas Urra', 'rut' => '11889479-0', 'phone' => '949839331', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Eugenio Antonio Espinoza Yañez', 'rut' => '8377214-K', 'phone' => '996390934', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Javier Nicolas Fernández Cofré', 'rut' => '18727219-K', 'phone' => '996584763', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Baltasar Segundo Mercado Maldonado', 'rut' => '7739553-9', 'phone' => '996584747', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Jaime Cristian Ramirez Troncoso', 'rut' => '10631223-0', 'phone' => '942164415', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Jorge Patricio Delgado Mena', 'rut' => '10106407-7', 'phone' => '968503630', 'amzoma' => true, 'rol_id' => 1],
            ['name' => 'Andres Lot Painen Juanico', 'rut' => '15654558-9', 'phone' => '959737075', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Juan Carlos Becerra Reyes', 'rut' => '17584016-8', 'phone' => '995578774', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'German Medina Lara', 'rut' => '9515022-5', 'phone' => '993970377', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Paola Andrea Carrasco Martinez', 'rut' => '12389084-1', 'phone' => '926860458', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Fabiola Del Pilar Novoa Silva', 'rut' => '8567916-3', 'phone' => '944745771', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Victor Gerardo Silva Catalan', 'rut' => '13757293-1', 'phone' => '935762282', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Alvaro Cristian Neira Beltran', 'rut' => '18872604-6', 'phone' => '950387711', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Eduardo Max Olivares Faundez', 'rut' => '8272625-K', 'phone' => '930032537', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Jonatan Aaron Torres Vargas', 'rut' => '19037003-8', 'phone' => '931181813', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Natalia Stephanie Ñanco Masana', 'rut' => '16239222-0', 'phone' => '951222810', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Elias Fuentes Carrillo', 'rut' => '12191901-K', 'phone' => '954214618', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Robinson Yamil Oyarzun Figueroa', 'rut' => '10867717-1', 'phone' => '962833137', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Matias Alberto Caniulef Bahamondes', 'rut' => '17871708-1', 'phone' => '954153058', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Paola Alexandra Mora Alarcon', 'rut' => '17583311-0', 'phone' => '968757387', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Kevin Patricio Vizcarra Muñoz', 'rut' => '19195394-0', 'phone' => '996584606', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Omar Henry Leal Garrido', 'rut' => '12381065-1', 'phone' => '996584755', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Manuel Ernesto Verdugo Mella', 'rut' => '15987971-2', 'phone' => '996584770', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Raul Felipe Huaiquinao Traipe', 'rut' => '18874334-K', 'phone' => '930297932', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Daniel Octavio Obreque Gonzalez', 'rut' => '11811429-9', 'phone' => '986693568', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Uriel Raul Toro Toro', 'rut' => '9285352-7', 'phone' => '984990497', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Raul Campos Ortega', 'rut' => '19936416-2', 'phone' => '931305895', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Gaston Esteban Salazar Espinoza', 'rut' => '17631804-K', 'phone' => '966884142', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Wilson Alejandro Vidal Paredes', 'rut' => '13583757-1', 'phone' => '966738821', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Bernardo Rosalino Tropa Lefimar', 'rut' => '12331788-2', 'phone' => '945526050', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Rodrigo Antonio Ponce Saa', 'rut' => '17210786-9', 'phone' => '991233646', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Sara Andrea Paredes Ruiz', 'rut' => '13804067-4', 'phone' => '940354205', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Danny Daniel Choquechambe Colque', 'rut' => '15001288-0', 'phone' => '940003874', 'amzoma' => true, 'rol_id' => 2],
            ['name' => 'Leonardo Andres Sanhueza Palma', 'rut' => '19076297-1', 'phone' => '926315725', 'amzoma' => true, 'rol_id' => 3],
            ['name' => 'Christopher Alexander Gonzalez Troncoso', 'rut' => '18924703-6', 'phone' => '948952098', 'amzoma' => true, 'rol_id' => 3],
            ['name' => 'Freddy Bastian Gonzalez Henriquez', 'rut' => '18995225-2', 'phone' => '948653562', 'amzoma' => true, 'rol_id' => 3],
            ['name' => 'Fernando Alejandro Maturana Salazar', 'rut' => '9526543-K', 'phone' => '993590919', 'amzoma' => true, 'rol_id' => 3],
            ['name' => 'Joan Antonio Ramirez Espinoza', 'rut' => '18093657-2', 'phone' => '965651214', 'amzoma' => true, 'rol_id' => 3],
            ['name' => 'Pablo Hernan Riquelme Pereira', 'rut' => '19197258-9', 'phone' => '971865740', 'amzoma' => true, 'rol_id' => 3],
            ['name' => 'Cesar Enrique Soto Vidal', 'rut' => '16533970-3', 'phone' => '968026115', 'amzoma' => true, 'rol_id' => 3],
            ['name' => 'Roman Marcelo Lepin Colipe', 'rut' => '19763336-0', 'phone' => '973918433', 'amzoma' => true, 'rol_id' => 3],
            ['name' => 'Raul Eduardo Carvajal Rodriguez', 'rut' => '12076624-4', 'phone' => '945115088', 'amzoma' => true, 'rol_id' => 3],
            ['name' => 'Nicolas Armando Correa Montoya', 'rut' => '18587171-1', 'phone' => '950099882', 'amzoma' => true, 'rol_id' => 3],
            ['name' => 'Julio Fernando Sarmiento Quezada', 'rut' => '12282547-7', 'phone' => '961542579', 'amzoma' => true, 'rol_id' => 4],
            ['name' => 'Marianela Huequelef Carrera', 'rut' => '10604235-7', 'phone' => '961533651', 'amzoma' => true, 'rol_id' => 4],
            ['name' => 'Priscila Escobar Fernandez', 'rut' => '18522287-K', 'phone' => '999490996', 'amzoma' => true, 'rol_id' => 4],
            ['name' => 'Eduardo Esparza Leal', 'rut' => '16948150-4', 'phone' => '926364949', 'amzoma' => true, 'rol_id' => 4],
            ['name' => 'Javier Ivor Urbistondo Solis', 'rut' => '16345199-9', 'phone' => '996585046', 'amzoma' => true, 'rol_id' => 4],
            ['name' => 'Javier Alexis Alvarado Guerrero', 'rut' => '18984596-0', 'phone' => '976183593', 'amzoma' => true, 'rol_id' => 4],
            ['name' => 'Daniela Paz Sanzana Cartes', 'rut' => '17261290-3', 'phone' => '996800474', 'amzoma' => true, 'rol_id' => 4],
            ['name' => 'Javiera Constanza Davila Poblete', 'rut' => '19763595-9', 'phone' => '949675029', 'amzoma' => true, 'rol_id' => 4],
            ['name' => 'Jorge Alexis Waltemath Hernandez', 'rut' => '18198426-0', 'phone' => '951004035', 'amzoma' => true, 'rol_id' => 4],
            ['name' => 'Nicolas Ignacio Escobar Martinez', 'rut' => '20079799-K', 'phone' => '984929336', 'amzoma' => true, 'rol_id' => 5],
            ['name' => 'Nelson Antonio Toro Cuminao', 'rut' => '20356397-3', 'phone' => '935782274', 'amzoma' => true, 'rol_id' => 5],
            ['name' => 'Richar Abner Guzman Bachmman', 'rut' => '15276320-4', 'phone' => '995389623', 'amzoma' => true, 'rol_id' => 6],
            ['name' => 'David Esteban Llaupi Cayul', 'rut' => '19197511-1', 'phone' => '944121895', 'amzoma' => true, 'rol_id' => 6],
            ['name' => 'Ever Guillermo Mella Mendez', 'rut' => '13730700-6', 'phone' => '997666790', 'amzoma' => true, 'rol_id' => 6],
            ['name' => 'Matias Jorge Sebastian Miranda Leiva', 'rut' => '20939062-0', 'phone' => '996584679', 'amzoma' => true, 'rol_id' => 6],
            ['name' => 'Jeremias Jarack Perez Cayuqueo', 'rut' => '20357600-5', 'phone' => '968177935', 'amzoma' => true, 'rol_id' => 6],
            ['name' => 'Maria Eugenia Pinto Chiguay', 'rut' => '14257845-K', 'phone' => '990070926', 'amzoma' => true, 'rol_id' => 7],
            ['name' => 'Sofanor Segundo Zurita Zapata', 'rut' => '6355945-8', 'phone' => '984286851', 'amzoma' => true, 'rol_id' => 7],
            ['name' => 'Susana Evelyn Vilca Cortes', 'rut' => '14107193-9', 'phone' => '962686196', 'amzoma' => true, 'rol_id' => 7],
            ['name' => 'Luis Alberto Vejar Fernandez', 'rut' => '9056065-4', 'phone' => '953912366', 'amzoma' => true, 'rol_id' => 8],
            ['name' => 'Claudio Sofanor Zurita Avendaño', 'rut' => '13960876-3', 'phone' => '930143050', 'amzoma' => true, 'rol_id' => 8],
            ['name' => 'Pamela Andrea Moya Soto', 'rut' => '15500688-9', 'phone' => '974896307', 'amzoma' => true, 'rol_id' => 8],
            ['name' => 'Emmanuel Jacob Calfuquir Caceres', 'rut' => '19260115-0', 'phone' => '997564405', 'amzoma' => true, 'rol_id' => 8],
        ];

        // Insertar los empleados en la base de datos
        foreach ($employees as $employee) {
            DB::table('employees')->updateOrInsert(
                ['name' => $employee['name']], // Condición de búsqueda
                [
                    'rut' => $employee['rut'],
                    'phone' => $employee['phone'],
                    'amzoma' => $employee['amzoma'],
                    'rol_id' => $employee['rol_id'],
                    'updated_at' => now(),
                ]
            );
        }
    }
}
