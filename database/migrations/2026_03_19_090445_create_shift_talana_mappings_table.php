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
        Schema::create('shift_talana_mappings', function (Blueprint $table) {
            $table->id();
            $table->string('shift_code')->unique()->comment('Código del turno (M, T, N, 1, 2, etc.)');
            $table->integer('talana_id')->comment('ID correspondiente en Talana');
            $table->string('description')->nullable()->comment('Descripción opcional');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_talana_mappings');
    }
};
