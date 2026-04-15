<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('name');                           // e.g. "Móvil 01"
            $table->string('plate_number')->nullable();       // license plate
            $table->enum('type', [
                'patrol',       // Patrullaje
                'motorcycle',   // Motorizado
                'bicycle',      // Ciclopatrullaje
                'drone',        // Dron
                'van',          // Furgón
                'other',
            ])->default('patrol');
            $table->enum('status', [
                'available',    // Disponible
                'in_use',       // En uso
                'maintenance',  // En mantención
                'inactive',     // Dado de baja
            ])->default('available');
            $table->string('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicles');
    }
};
