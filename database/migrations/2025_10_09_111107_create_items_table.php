<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();

            // Relaciones
            $table->foreignId('parent_id')->nullable()->constrained('items_parents')->onDelete('set null');
            $table->unsignedBigInteger('parent_batch_id')->nullable(); // Alias de parent_id
            $table->unsignedBigInteger('purchase_id')->nullable();

            // Información básica
            $table->string('nombre'); // "Polera #1", "Laptop Dell #001"
            $table->string('categoria'); // "Ropa", "Tecnología", "Mobiliario"
            $table->string('sku')->unique(); // SKU único generado
            $table->string('codigo')->nullable(); // Código de barras o interno adicional

            // Estado y ubicación
            $table->enum('estado', [
                'Disponible',
                'Asignado',
                'En uso',
                'En mantenimiento',
                'Mantenimiento', // Alias de 'En mantenimiento'
                'Dado de baja'
            ])->default('Disponible');
            $table->string('ubicacion'); // "Almacén Central", "Oficina 201"
            $table->string('responsable')->nullable(); // Nombre de la persona asignada

            // Información adicional
            $table->string('unidad')->nullable(); // 'Unidad', 'Caja', etc.
            $table->decimal('valor_unitario', 10, 2)->nullable();
            $table->json('atributos')->nullable(); // {marca, modelo, color, talla, etc}
            $table->json('historial')->nullable(); // [{fecha, evento, responsable, detalles}]

            // Fechas
            $table->date('fecha_ingreso')->nullable();
            $table->date('fecha_ultimo_movimiento')->nullable();

            // Proveedor (denormalizado)
            $table->unsignedBigInteger('proveedor_id')->nullable();
            $table->string('proveedor_nombre')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Índices para búsquedas rápidas
            $table->index('parent_id');
            $table->index('parent_batch_id');
            $table->index('purchase_id');
            $table->index('categoria');
            $table->index('estado');
            $table->index('ubicacion');
            $table->index('responsable');
            $table->index('sku');
            $table->index('fecha_ingreso');
            $table->index('proveedor_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
