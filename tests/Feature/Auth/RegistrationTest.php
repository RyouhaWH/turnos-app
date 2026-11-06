<?php

use App\Models\User;
use Spatie\Permission\Models\Role;

// En esta app no hay registro público: solo un Administrador puede usar /register.

test('guests cannot access registration', function () {
    $this->get('/register')->assertRedirect('/login');

    $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertRedirect('/login');

    $this->assertGuest();
    expect(User::where('email', 'test@example.com')->exists())->toBeFalse();
});

test('non-admin users cannot register new accounts', function () {
    Role::firstOrCreate(['name' => 'Usuario']);
    $user = User::factory()->create();
    $user->assignRole('Usuario');

    $this->actingAs($user)->postJson('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertForbidden();

    expect(User::where('email', 'test@example.com')->exists())->toBeFalse();
});

test('admins can open the registration screen', function () {
    Role::firstOrCreate(['name' => 'Administrador']);
    $admin = User::factory()->create();
    $admin->assignRole('Administrador');

    $this->actingAs($admin)->get('/register')->assertStatus(200);
});
