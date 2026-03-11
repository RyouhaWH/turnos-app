<?php

use App\Models\ApiKey;
use App\Models\Employees;
use App\Models\EmployeeShifts;
use Carbon\Carbon;


beforeEach(function () {
    // migrations will run thanks to RefreshDatabase trait
});

it('returns 401 if no api key provided', function () {
    $this->getJson('/api/v1/employee-status-external')
         ->assertStatus(401)
         ->assertJson(['success' => false])
         ->assertJson(['message' => 'API Key no proporcionada']);
});

it('accepts a valid api key and returns employee status data', function () {
    // generate an active API key
    $apiKey = ApiKey::create([
        'name' => 'test-key',
        'key' => ApiKey::generateKey(),
        'is_active' => true,
        'expired_at' => null,
    ]);

    // create an employee with a shift today
    $employee = Employees::create([
        'name' => 'Prueba',
        'amzoma' => false,
    ]);

    EmployeeShifts::create([
        'employee_id' => $employee->id,
        'date' => Carbon::today(),
        'shift' => 'M',
    ]);

    $response = $this->withHeaders([
        'X-API-Key' => $apiKey->key,
    ])->getJson('/api/v1/employee-status-external');

    $response->assertStatus(200)
             ->assertJson(['success' => true])
             ->assertJsonStructure([
                 'data' => [
                     'status' => [
                         'trabajando',
                         'descanso',
                         'ausente',
                         'sinTurno'
                     ],
                 ],
             ]);
});
