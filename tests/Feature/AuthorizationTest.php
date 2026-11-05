<?php

use App\Models\User;
use App\Models\WhatsAppRecipient;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    foreach (['Administrador', 'Supervisor', 'Usuario'] as $name) {
        Role::firstOrCreate(['name' => $name]);
    }
});

function userWithRole(?string $role = null): User
{
    $user = User::factory()->create();
    if ($role) {
        $user->assignRole($role);
    }

    return $user;
}

// --- Gestión de usuarios: solo Administrador ---------------------------------

it('impide que un usuario común cree usuarios', function () {
    $this->actingAs(userWithRole('Usuario'))
        ->postJson('/admin/users', [
            'name' => 'Intruso',
            'email' => 'intruso@example.com',
            'password' => 'password-segura-123',
            'password_confirmation' => 'password-segura-123',
            'role' => Role::where('name', 'Administrador')->first()->id,
        ])
        ->assertForbidden();

    expect(User::where('email', 'intruso@example.com')->exists())->toBeFalse();
});

it('impide que un usuario común se asigne el rol de administrador', function () {
    $user = userWithRole('Usuario');

    $this->actingAs($user)
        ->patchJson("/admin/users/{$user->id}/role", [
            'roles' => [Role::where('name', 'Administrador')->first()->id],
        ])
        ->assertForbidden();

    expect($user->fresh()->hasRole('Administrador'))->toBeFalse();
});

it('impide que un supervisor elimine usuarios', function () {
    $victim = userWithRole('Usuario');

    $this->actingAs(userWithRole('Supervisor'))
        ->deleteJson("/admin/users/{$victim->id}")
        ->assertForbidden();

    expect(User::find($victim->id))->not->toBeNull();
});

it('permite que un administrador cree usuarios', function () {
    $this->actingAs(userWithRole('Administrador'))
        ->post('/admin/users', [
            'name' => 'Nuevo',
            'email' => 'nuevo@example.com',
            'password' => 'password-segura-123',
            'password_confirmation' => 'password-segura-123',
            'role' => Role::where('name', 'Usuario')->first()->id,
        ])
        ->assertRedirect();

    expect(User::where('email', 'nuevo@example.com')->first()?->hasRole('Usuario'))->toBeTrue();
});

// --- Roles operativos: solo Administrador ------------------------------------

it('impide que un usuario común modifique roles operativos', function () {
    $this->actingAs(userWithRole('Usuario'))
        ->patchJson('/api/roles/update-multiple', ['roles' => []])
        ->assertForbidden();

    $this->actingAs(userWithRole('Usuario'))
        ->patchJson('/api/roles/1/operational-status', ['is_operational' => false])
        ->assertForbidden();
});

// --- Destinatarios WhatsApp: solo Administrador ------------------------------

it('impide que un supervisor gestione destinatarios de WhatsApp', function () {
    $this->actingAs(userWithRole('Supervisor'))
        ->postJson('/admin/whatsapp-recipients', [
            'name' => 'X',
            'phone' => '912345678',
            'identifier_id' => 'x',
        ])
        ->assertForbidden();

    expect(WhatsAppRecipient::count())->toBe(0);
});

// --- Mapeos Talana: Supervisor o Administrador -------------------------------

it('impide que un usuario común modifique mapeos de Talana', function () {
    $this->actingAs(userWithRole('Usuario'))
        ->postJson('/admin/talana-mappings', ['shift_code' => 'M', 'talana_id' => 1])
        ->assertForbidden();
});

it('permite que un supervisor cree mapeos de Talana', function () {
    $this->actingAs(userWithRole('Supervisor'))
        ->post('/admin/talana-mappings', ['shift_code' => 'M', 'talana_id' => 1])
        ->assertRedirect();

    $this->assertDatabaseHas('shift_talana_mappings', ['shift_code' => 'M', 'talana_id' => 1]);
});

// --- Rutas de debug eliminadas -----------------------------------------------

it('ya no expone rutas de prueba', function (string $uri) {
    $this->actingAs(userWithRole('Usuario'))->get($uri)->assertNotFound();
})->with(['/test', '/test-public', '/import-from-storage']);
