<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            [
                'nombre' => 'Tecnología',
                'descripcion' => 'Equipos de cómputo, dispositivos electrónicos y accesorios tecnológicos'
            ],
            [
                'nombre' => 'Mobiliario',
                'descripcion' => 'Escritorios, sillas, estanterías y muebles de oficina'
            ],
            [
                'nombre' => 'Ropa',
                'descripcion' => 'Uniformes, ropa de trabajo y vestimenta corporativa'
            ],
            [
                'nombre' => 'Herramientas',
                'descripcion' => 'Herramientas de trabajo, equipos de mantenimiento y utensilios'
            ],
            [
                'nombre' => 'Equipos Médicos',
                'descripcion' => 'Instrumentos médicos, equipos de salud y suministros sanitarios'
            ],
            [
                'nombre' => 'Material de Oficina',
                'descripcion' => 'Papelería, suministros de oficina y materiales de escritorio'
            ],
            [
                'nombre' => 'Equipos de Seguridad',
                'descripcion' => 'Equipos de protección personal, sistemas de seguridad y señalización'
            ],
            [
                'nombre' => 'Equipos de Comunicación',
                'descripcion' => 'Teléfonos, radios, equipos de telecomunicaciones y accesorios'
            ],
            [
                'nombre' => 'Suministros de Limpieza',
                'descripcion' => 'Productos de limpieza, equipos de aseo y materiales de higiene'
            ],
            [
                'nombre' => 'Equipos de Cocina',
                'descripcion' => 'Utensilios de cocina, electrodomésticos y equipos gastronómicos'
            ],
            [
                'nombre' => 'Materiales de Construcción',
                'descripcion' => 'Materiales de construcción, herramientas de obra y suministros'
            ],
            [
                'nombre' => 'Otros',
                'descripcion' => 'Categoría general para ítems que no encajan en las categorías específicas'
            ]
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(
                ['nombre' => $category['nombre']],
                $category
            );
        }
    }
}




