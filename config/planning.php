<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Reglas por defecto de la planilla de turnos
    |--------------------------------------------------------------------------
    | Cada supervisor puede ajustarlas en su navegador; estos son los valores iniciales.
    | weekly_max: jornada máxima legal (Ley 21.561: 42 h desde el 26-04-2026, 40 h desde el 26-04-2028).
    */
    'rules' => [
        'weekly_target' => (int) env('PLANNING_WEEKLY_TARGET', 40),
        'weekly_max' => (int) env('PLANNING_WEEKLY_MAX', 42),
        'min_rest_hours' => (int) env('PLANNING_MIN_REST', 12),
        'max_consecutive_days' => (int) env('PLANNING_MAX_CONSECUTIVE', 6),
    ],

    /*
    |--------------------------------------------------------------------------
    | Feriados nacionales (Chile)
    |--------------------------------------------------------------------------
    | Verificar cada año contra el calendario oficial antes de planificar.
    */
    'holidays' => [
        '2026-01-01' => 'Año Nuevo',
        '2026-04-03' => 'Viernes Santo',
        '2026-04-04' => 'Sábado Santo',
        '2026-05-01' => 'Día del Trabajo',
        '2026-05-21' => 'Glorias Navales',
        '2026-06-21' => 'Día de los Pueblos Indígenas',
        '2026-06-29' => 'San Pedro y San Pablo',
        '2026-07-16' => 'Virgen del Carmen',
        '2026-08-15' => 'Asunción de la Virgen',
        '2026-09-18' => 'Independencia Nacional',
        '2026-09-19' => 'Glorias del Ejército',
        '2026-10-12' => 'Encuentro de Dos Mundos',
        '2026-10-31' => 'Iglesias Evangélicas y Protestantes',
        '2026-11-01' => 'Todos los Santos',
        '2026-12-08' => 'Inmaculada Concepción',
        '2026-12-25' => 'Navidad',
        '2027-01-01' => 'Año Nuevo',
        '2027-03-26' => 'Viernes Santo',
        '2027-03-27' => 'Sábado Santo',
        '2027-05-01' => 'Día del Trabajo',
        '2027-05-21' => 'Glorias Navales',
    ],

];
