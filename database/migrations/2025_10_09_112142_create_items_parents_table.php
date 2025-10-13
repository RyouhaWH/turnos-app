<?php
// database/migrations/2024_01_01_000004_create_items_parents_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items_parents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->nullable()->constrained('purchases')->onDelete('set null');
            $table->string('nombre'); // "Lote de Poleras - 50 unidades"
            $table->string('categoria');
            $table->integer('cantidad'); // Total de items en el lote
            $table->string('unidad')->default('Unidad'); // 'Unidad', 'Caja', 'Pack', etc.
            $table->decimal('valor_unitario', 10, 2)->default(0);
            $table->decimal('valor_total', 12, 2)->default(0);
            $table->json('atributos_comunes')->nullable(); // {marca: 'Nike', color: 'Azul'}
            $table->date('fecha_ingreso')->default(now());
            $table->json('totales')->nullable(); // {cantidad, asignados, disponibles, baja}
            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index('purchase_id');
            $table->index('categoria');
            $table->index('fecha_ingreso');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items_parents');
    }
};
