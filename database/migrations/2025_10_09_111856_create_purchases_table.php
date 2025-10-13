<?php
// database/migrations/2024_01_01_000003_create_purchases_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proveedor_id')->constrained('providers')->onDelete('restrict');
            $table->string('proveedor_nombre'); // Denormalizado para rendimiento
            $table->date('fecha_compra');
            $table->enum('tipo_documento', ['Factura', 'Boleta', 'Guía', 'Orden de Compra'])
                  ->default('Factura');
            $table->string('numero_documento')->unique();
            $table->string('tipo_compra')->nullable(); // 'directa', 'licitación', etc.
            $table->string('responsable')->nullable(); // Usuario que registra
            $table->string('ubicacion_destino')->nullable();
            $table->decimal('monto_total', 12, 2)->default(0);
            $table->text('observaciones')->nullable();
            $table->json('documentos')->nullable(); // [{nombre, tipo, url, fechaSubida}]
            $table->json('lotes')->nullable(); // Array de IDs de items_parents
            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index('proveedor_id');
            $table->index('fecha_compra');
            $table->index('numero_documento');
            $table->index('tipo_documento');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
