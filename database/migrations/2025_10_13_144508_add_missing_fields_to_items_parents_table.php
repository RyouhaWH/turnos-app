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
        Schema::table('items_parents', function (Blueprint $table) {
            $table->json('variantes')->nullable()->after('atributos_comunes');
            $table->string('codigo')->nullable()->after('variantes');
            $table->text('descripcion')->nullable()->after('codigo');
            $table->string('estado')->nullable()->after('descripcion');
            $table->string('ubicacion')->nullable()->after('estado');
            $table->string('responsable')->nullable()->after('ubicacion');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items_parents', function (Blueprint $table) {
            $table->dropColumn(['variantes', 'codigo', 'descripcion', 'estado', 'ubicacion', 'responsable']);
        });
    }
};
