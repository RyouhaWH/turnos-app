<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendWhatsAppMessage implements ShouldQueue
{
    use Queueable;

    public string $mensaje;
    public string $numero;
    public bool $testingMode;
    public ?string $numeroOriginal;

    /**
     * Create a new job instance.
     */
    public function __construct(string $mensaje, string $numero, bool $testingMode = false, ?string $numeroOriginal = null)
    {
        $this->mensaje = $mensaje;
        $this->numero = $numero;
        $this->testingMode = $testingMode;
        $this->numeroOriginal = $numeroOriginal;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('🚀 Iniciando envío asíncrono de mensaje WhatsApp', [
                'numero' => $this->numero,
                'numero_original' => $this->numeroOriginal,
                'testing_mode' => $this->testingMode,
                'mensaje_length' => strlen($this->mensaje)
            ]);

            $response = Http::timeout(30)->post('http://localhost:3003/send-message', [
                'mensaje' => $this->mensaje,
                'numero'  => "56" . $this->numero,
            ]);

            if ($response->successful()) {
                Log::info('✅ Mensaje WhatsApp enviado exitosamente (asíncrono)', [
                    'numero' => $this->numero,
                    'numero_original' => $this->numeroOriginal,
                    'testing_mode' => $this->testingMode,
                    'response_status' => $response->status()
                ]);
            } else {
                Log::error('❌ Error en respuesta del servicio WhatsApp (asíncrono)', [
                    'numero' => $this->numero,
                    'numero_original' => $this->numeroOriginal,
                    'testing_mode' => $this->testingMode,
                    'response_status' => $response->status(),
                    'response_body' => $response->body()
                ]);
            }

        } catch (\Exception $e) {
            Log::error('❌ Error enviando mensaje WhatsApp (asíncrono)', [
                'numero' => $this->numero,
                'numero_original' => $this->numeroOriginal,
                'testing_mode' => $this->testingMode,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Re-lanzar la excepción para que Laravel maneje el reintento
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('💥 Job SendWhatsAppMessage falló definitivamente', [
            'numero' => $this->numero,
            'numero_original' => $this->numeroOriginal,
            'testing_mode' => $this->testingMode,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);
    }
}
