<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TestWhatsAppCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'whatsapp:test 
                            {--number= : Número de teléfono para enviar la prueba (sin +56)}
                            {--message= : Mensaje personalizado para enviar}
                            {--list-recipients : Listar todos los destinatarios configurados}
                            {--dry-run : Solo mostrar qué se enviaría sin enviar realmente}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Probar el sistema de WhatsApp sin enviar mensajes reales';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🧪 Sistema de Pruebas WhatsApp');
        $this->newLine();

        // Listar destinatarios si se solicita
        if ($this->option('list-recipients')) {
            $this->listRecipients();
            return;
        }

        // Obtener número de prueba
        $testNumber = $this->option('number') ?? env('WHATSAPP_TEST_NUMBER', '951004035');
        $customMessage = $this->option('message');
        $dryRun = $this->option('dry-run');

        // Mensaje de prueba por defecto
        $message = $customMessage ?? $this->getDefaultTestMessage();

        $this->info("📱 Número de destino: +56{$testNumber}");
        $this->info("📝 Mensaje:");
        $this->line($message);
        $this->newLine();

        if ($dryRun) {
            $this->warn('🔍 MODO DRY-RUN: No se enviará ningún mensaje');
            $this->info('✅ Simulación completada');
            return;
        }

        // Confirmar envío
        if (!$this->confirm('¿Enviar mensaje de prueba?')) {
            $this->info('❌ Envío cancelado');
            return;
        }

        try {
            $this->info('📤 Enviando mensaje...');
            
            $response = Http::timeout(10)->post('http://localhost:3001/send-message', [
                'mensaje' => $message,
                'numero'  => "56" . $testNumber,
            ]);

            if ($response->successful()) {
                $this->info('✅ Mensaje enviado exitosamente');
                $this->info("📊 Respuesta: {$response->body()}");
            } else {
                $this->error('❌ Error al enviar mensaje');
                $this->error("📊 Código: {$response->status()}");
                $this->error("📊 Respuesta: {$response->body()}");
            }

        } catch (\Exception $e) {
            $this->error('💥 Error de conexión: ' . $e->getMessage());
            $this->error('🔧 Verifica que el servicio WhatsApp esté ejecutándose en localhost:3001');
        }

        $this->newLine();
        $this->info('💡 Tip: Usa --dry-run para simular sin enviar');
        $this->info('💡 Tip: Usa --list-recipients para ver todos los destinatarios');
    }

    /**
     * Get default test message
     */
    private function getDefaultTestMessage(): string
    {
        return "🧪 MODO PRUEBA - WhatsApp\n\n" .
               "📋 Este es un mensaje de prueba del sistema de turnos\n\n" .
               "📱 Destinatarios que recibirían el mensaje:\n" .
               "• 964949887 (Central)\n" .
               "• 981841759 (Dayana Chavez)\n" .
               "• 975952121 (Cristian Montecinos)\n" .
               "• 985639782 (Informaciones Amzoma)\n\n" .
               "📱 Mensaje original:\n" .
               "Se *Autoriza* el turno de: *Juan Pérez* _siendo modificado_ los días:\n" .
               "• *15/01/2025* de \"*Mañana*\" a \"*Tarde*\"\n" .
               "• *16/01/2025* de \"*Franco*\" a \"*Noche*\"";
    }

    /**
     * List all configured recipients
     */
    private function listRecipients(): void
    {
        $this->info('📋 Destinatarios configurados:');
        $this->newLine();

        $recipients = [
            'julio-sarmiento' => 'Julio Sarmiento (Supervisor)',
            'marianela-huequelef' => 'Marianela Huequelef (Supervisor)',
            'priscila-escobar' => 'Priscila Escobar (Supervisor)',
            'javier-alvarado' => 'Javier Alvarado (Supervisor)',
            'eduardo-esparza' => 'Eduardo Esparza (Supervisor)',
            'dayana-chavez' => 'Dayana Chavez (Supervisor) - 981841759',
            'central' => 'Central - 964949887',
            'manuel-verdugo' => 'Manuel Verdugo (Supervisor)',
            'paola-carrasco' => 'Paola Carrasco (Supervisor)',
            'cesar-soto' => 'Cesar Soto (Supervisor)',
            'cristian-montecinos' => 'Cristian Montecinos (Supervisor) - 975952121',
            'informaciones-amzoma' => 'Informaciones Amzoma (Central) - 985639782',
            'jorge-waltemath' => 'Jorge Waltemath (Supervisor)',
        ];

        foreach ($recipients as $id => $name) {
            $this->line("• {$name}");
        }

        $this->newLine();
        $this->info('💡 Los números marcados se obtienen de la base de datos');
        $this->info('💡 Los números sin marca están hardcodeados');
    }
}
