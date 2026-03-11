<?php

namespace App\Console\Commands;

use App\Models\ApiKey;
use Illuminate\Console\Command;

class CreateApiKey extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'api-key:create {--name=} {--description=} {--expire-in=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crear una nueva API Key para acceso a endpoints externos';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        // Obtener o preguntar por el nombre
        $name = $this->option('name') ?? $this->ask('¿Nombre de la API Key?', 'Sistema Externo');

        // Obtener o preguntar por la descripción
        $description = $this->option('description') ?? $this->ask('¿Descripción? (opcional)', '');

        // Generar la API Key
        $key = ApiKey::generateKey();

        // Calcular expiración
        $expireIn = $this->option('expire-in');
        $expiredAt = null;

        if ($expireIn) {
            $expiredAt = now()->addDays((int) $expireIn);
            $this->info("API Key expirará en: {$expiredAt->format('Y-m-d H:i:s')}");
        }

        // Crear la API Key en la base de datos
        $apiKey = ApiKey::create([
            'name' => $name,
            'key' => $key,
            'description' => $description,
            'is_active' => true,
            'expired_at' => $expiredAt
        ]);

        // Mostrar información
        $this->line('');
        $this->info('✓ API Key creada exitosamente!');
        $this->line('');
        $this->table(
            ['Propiedad', 'Valor'],
            [
                ['ID', $apiKey->id],
                ['Nombre', $apiKey->name],
                ['API Key', $apiKey->key],
                ['Descripción', $apiKey->description ?? '-'],
                ['Activa', $apiKey->is_active ? 'Sí' : 'No'],
                ['Expira', $apiKey->expired_at ? $apiKey->expired_at->format('Y-m-d H:i:s') : 'Nunca'],
                ['Creada', $apiKey->created_at->format('Y-m-d H:i:s')]
            ]
        );

        $this->line('');
        $this->warn('⚠️  Guarda esta API Key en un lugar seguro. No podrás verla de nuevo.');
        $this->line('');

        // Instrucciones de uso
        $this->info('Uso en headers:');
        $this->line("curl -H \"X-API-Key: {$apiKey->key}\" https://tudominio.com/api/v1/employee-status-external");
        $this->line('');

        $this->info('Uso con parámetro query:');
        $this->line("https://tudominio.com/api/v1/employee-status-external?api_key={$apiKey->key}");
        $this->line('');
    }
}
