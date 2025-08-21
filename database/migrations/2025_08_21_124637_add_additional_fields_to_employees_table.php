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
        Schema::table('employees', function (Blueprint $table) {
            // Campos de nombre separados
            $table->string('first_name')->nullable()->after('name');
            $table->string('paternal_lastname')->nullable()->after('first_name');
            $table->string('maternal_lastname')->nullable()->after('paternal_lastname');

            // Campos adicionales
            $table->string('email')->nullable()->after('phone');
            $table->text('address')->nullable()->after('email');
            $table->string('position')->nullable()->after('address');
            $table->string('department')->nullable()->after('position');
            $table->date('start_date')->nullable()->after('department');
            $table->enum('status', ['activo', 'inactivo', 'vacaciones', 'licencia'])->default('activo')->after('start_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'first_name',
                'paternal_lastname',
                'maternal_lastname',
                'email',
                'address',
                'position',
                'department',
                'start_date',
                'status'
            ]);
        });
    }
};
