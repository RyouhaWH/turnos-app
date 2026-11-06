<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Catálogo de turnos: única fuente de verdad para códigos, nombres, horarios y colores.
 * Los horarios iniciales son supuestos y se corrigen desde Planificación → Catálogo de turnos.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shift_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name');
            $table->string('category', 10); // work | off | absence
            $table->string('starts_at', 5)->nullable(); // HH:MM
            $table->string('ends_at', 5)->nullable();   // HH:MM (si es menor que el inicio, termina al día siguiente)
            $table->decimal('hours', 4, 1)->default(0);
            $table->string('base_code', 10)->nullable(); // para extras: a qué turno suma en la cobertura
            $table->boolean('is_extra')->default(false);
            $table->string('color', 20)->default('gray');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $now = now();
        $rows = [
            ['M', 'Mañana', 'work', '07:00', '15:00', 8, null, false, 'amber'],
            ['T', 'Tarde', 'work', '15:00', '23:00', 8, null, false, 'teal'],
            ['N', 'Noche', 'work', '23:00', '07:00', 8, null, false, 'indigo'],
            ['1', 'Primer turno', 'work', '08:00', '16:00', 8, null, false, 'sky'],
            ['2', 'Segundo turno', 'work', '16:00', '00:00', 8, null, false, 'cyan'],
            ['3', 'Tercer turno', 'work', '00:00', '08:00', 8, null, false, 'violet'],
            ['ME', 'Mañana extra', 'work', '07:00', '15:00', 8, 'M', true, 'pink'],
            ['TE', 'Tarde extra', 'work', '15:00', '23:00', 8, 'T', true, 'pink'],
            ['NE', 'Noche extra', 'work', '23:00', '07:00', 8, 'N', true, 'pink'],
            ['1E', 'Primer turno extra', 'work', '08:00', '16:00', 8, '1', true, 'pink'],
            ['2E', 'Segundo turno extra', 'work', '16:00', '00:00', 8, '2', true, 'pink'],
            ['3E', 'Tercer turno extra', 'work', '00:00', '08:00', 8, '3', true, 'pink'],
            ['E', 'Extra', 'work', null, null, 8, null, true, 'pink'],
            ['PE', 'Patrulla escolar', 'work', null, null, 8, null, false, 'orange'],
            ['L', 'Libre', 'off', null, null, 0, null, false, 'gray'],
            ['F', 'Franco', 'off', null, null, 0, null, false, 'gray'],
            ['V', 'Vacaciones', 'absence', null, null, 0, null, false, 'green'],
            ['LM', 'Licencia médica', 'absence', null, null, 0, null, false, 'red'],
            ['A', 'Administrativo', 'absence', null, null, 0, null, false, 'slate'],
            ['PG', 'Permiso por día compensado', 'absence', null, null, 0, null, false, 'slate'],
            ['P', 'Permiso o cumpleaños', 'absence', null, null, 0, null, false, 'slate'],
            ['S', 'Día sindical', 'absence', null, null, 0, null, false, 'slate'],
        ];

        DB::table('shift_types')->insert(array_map(fn ($r, $i) => [
            'code' => $r[0], 'name' => $r[1], 'category' => $r[2], 'starts_at' => $r[3], 'ends_at' => $r[4],
            'hours' => $r[5], 'base_code' => $r[6], 'is_extra' => $r[7], 'color' => $r[8],
            'sort_order' => $i, 'is_active' => true, 'created_at' => $now, 'updated_at' => $now,
        ], $rows, array_keys($rows)));
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_types');
    }
};
