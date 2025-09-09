<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Ruta para obtener números de teléfono de destinatarios WhatsApp
Route::middleware(['auth', 'admin'])->get('/whatsapp-recipients', function () {
    $phoneNumbers = [];
    
    // Obtener números de teléfono de empleados por RUT
    $ruts = [
        'julio-sarmiento' => '12282547-7',
        'marianela-huequelef' => '10604235-7',
        'priscila-escobar' => '18522287-K',
        'javier-alvarado' => '18984596-0',
        'eduardo-esparza' => '16948150-4',
        'manuel-verdugo' => '15987971-2',
        'paola-carrasco' => '12389084-1',
        'cesar-soto' => '16533970-3',
        'jorge-waltemath' => '18198426-0',
    ];
    
    foreach ($ruts as $id => $rut) {
        $employee = \App\Models\Employees::where('rut', $rut)->first();
        if ($employee && $employee->phone) {
            $phoneNumbers[$id] = $employee->phone;
        } else {
            $phoneNumbers[$id] = 'No disponible';
        }
    }
    
    // Números fijos
    $phoneNumbers['dayana-chavez'] = '981841759';
    $phoneNumbers['central'] = '964949887';
    $phoneNumbers['cristian-montecinos'] = '975952121';
    $phoneNumbers['informaciones-amzoma'] = '985639782';
    
    return response()->json([
        'success' => true,
        'phoneNumbers' => $phoneNumbers
    ]);
});






