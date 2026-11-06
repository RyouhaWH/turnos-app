<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Planificación con borrador:
 * - shift_drafts: cambios en elaboración que aún no ven los funcionarios (se superponen a employee_shifts).
 * - shift_publications: registro de cada publicación (quién, cuándo, cuántos cambios).
 * - rols.planning_settings: mínimos de cobertura por turno de cada facción.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shift_drafts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rol_id')->nullable()->constrained('rols')->nullOnDelete();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('date');
            $table->string('shift', 10)->nullable(); // null = quitar el turno publicado
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['employee_id', 'date']);
            $table->index(['rol_id', 'date']);
        });

        Schema::create('shift_publications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rol_id')->nullable()->constrained('rols')->nullOnDelete();
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month');
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('changes_count')->default(0);
            $table->unsignedInteger('employees_count')->default(0);
            $table->boolean('notified')->default(false);
            $table->timestamps();

            $table->index(['rol_id', 'year', 'month']);
        });

        Schema::table('rols', function (Blueprint $table) {
            $table->json('planning_settings')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('rols', function (Blueprint $table) {
            $table->dropColumn('planning_settings');
        });
        Schema::dropIfExists('shift_publications');
        Schema::dropIfExists('shift_drafts');
    }
};
