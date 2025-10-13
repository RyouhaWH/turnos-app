<?php
// database/migrations/2024_01_01_000006_create_movements_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('movements', function (Blueprint $table) {
            $table->id();

            // Relación con el ítem
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');

            // Tipo de movimiento
            $table->enum('tipo', [
                'Ingreso',
                'Asignación',
                'Devolución',
                'Mantenimiento',
                'Baja'
            ]);

            // Responsables
            $table->string('responsable'); // Usuario que registra el movimiento
            $table->string('asignado_a')->nullable(); // Usuario a quien se asigna (solo para Asignación)

            // Ubicaciones
            $table->string('ubicacion_origen')->nullable();
            $table->string('ubicacion_destino')->nullable();

            // Detalles
            $table->text('observaciones');
            $table->date('fecha');

            // Archivos adjuntos (actas, fotos, documentos)
            $table->json('archivos')->nullable(); // [{id, nombre, tipo, url, fechaSubida, descripcion}]

            $table->timestamps();

            // Índices
            $table->index('item_id');
            $table->index('tipo');
            $table->index('responsable');
            $table->index('asignado_a');
            $table->index('fecha');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('movements');
    }
};
