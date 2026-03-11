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
        Schema::create('api_keys', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Nombre descriptivo (ej: "Sistema Externo 1")
            $table->string('key')->unique()->index(); // La API key en sí
            $table->text('description')->nullable(); // Descripción del uso
            $table->timestamp('last_used_at')->nullable(); // Última vez que fue usada
            $table->boolean('is_active')->default(true); // Si está activa o no
            $table->dateTime('expired_at')->nullable(); // Fecha de expiración opcional
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_keys');
    }
};
