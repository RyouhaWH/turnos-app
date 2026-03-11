<?php

// Script para crear una API Key de prueba
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Http\Kernel');

// Crear API Key
try {
    $apiKey = \App\Models\ApiKey::create([
        'name' => 'Testing - Demo',
        'key' => \App\Models\ApiKey::generateKey(),
        'description' => 'API Key de demostración para pruebas',
        'is_active' => true,
        'expired_at' => null
    ]);

    echo "=========================================\n";
    echo "✓ API Key creada exitosamente!\n";
    echo "=========================================\n";
    echo "ID: " . $apiKey->id . "\n";
    echo "Nombre: " . $apiKey->name . "\n";
    echo "API Key: " . $apiKey->key . "\n";
    echo "Activa: " . ($apiKey->is_active ? 'Sí' : 'No') . "\n";
    echo "Creada: " . $apiKey->created_at->format('Y-m-d H:i:s') . "\n";
    echo "=========================================\n";
    echo "\nPuedes usar esta API Key para hacer pruebas:\n";
    echo "\ncurl -H \"X-API-Key: " . $apiKey->key . "\" \\\n";
    echo "  http://localhost:8000/api/v1/employee-status-external\n\n";
} catch (\Exception $e) {
    echo "✗ Error: " . $e->getMessage() . "\n";
    exit(1);
}
