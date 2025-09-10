<?php

require_once __DIR__ . '/vendor/autoload.php';

// Simular el mensaje de prueba que se envía
$phoneToNameMapping = [
    '961542579' => 'Julio Sarmiento',
    '961533651' => 'Marianela Huequelef',
    '999490996' => 'Priscila Escobar',
    '976183593' => 'Javier Alvarado',
    '926364949' => 'Eduardo Esparza',
    '981841759' => 'Dayana Chávez',
    '964949887' => 'Central',
    '996584770' => 'Manuel Verdugo',
    '926860458' => 'Paola Carrasco',
    '968026115' => 'César Soto',
    '975952121' => 'Cristian Montecinos',
    '985639782' => 'Informaciones Amzoma',
    '951004035' => 'Jorge Waltemath',
];

$numerosAReportarCambios = [
    '961542579', '961533651', '999490996', '976183593', '926364949',
    '981841759', '964949887', '996584770', '926860458', '968026115',
    '975952121', '985639782', '951004035'
];

$datosFuncionario = [
    'telefono' => '997564405',
    'nombre' => 'Emmanuel Jacob Calfuquir Caceres'
];

$mensajePrueba = "🧪 MODO PRUEBA - WhatsApp\n\n";
$mensajePrueba .= "📋 Destinatarios que recibirían el mensaje:\n";

// Listar todos los destinatarios que recibirían el mensaje con sus nombres
foreach ($numerosAReportarCambios as $numero) {
    $nombre = $phoneToNameMapping[$numero] ?? 'Desconocido';
    $mensajePrueba .= "• {$numero} ({$nombre})\n";
}

if ($datosFuncionario['telefono']) {
    $mensajePrueba .= "• {$datosFuncionario['telefono']} ({$datosFuncionario['nombre']} - empleado)\n";
}

$mensaje = "Se *Autoriza* el turno de: *Emmanuel Jacob* _siendo modificado_ los días:\n• *01/10/2025* de \"*Sin Turno*\" a \"*Primer Turno*\"\n";
$mensajePrueba .= "\n📱 Mensaje original:\n{$mensaje}";

echo "Mensaje de prueba que debería enviarse:\n\n";
echo $mensajePrueba;
echo "\n\n";