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
        Schema::create('providers', function (Blueprint $table) {
            $table->id();

            $table->string('nombre');
            $table->string('email')->unique();
            $table->string('telefono');
            $table->text('direccion');
            $table->string('contacto'); // Nombre de la persona de contacto
            $table->json('historial_compras')->nullable(); // Array de IDs de purchases
            $table->date('fecha_registro')->default(now());
            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index('nombre');
            $table->index('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('providers');
    }
};
