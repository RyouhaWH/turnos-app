<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Spatie\Permission\Models\Role;

class CheckUserRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:user-roles';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check users and their roles';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Usuarios y sus roles:');
        $this->newLine();

        $users = User::with('roles')->get();

        if ($users->isEmpty()) {
            $this->warn('No hay usuarios en el sistema.');
            return;
        }

        foreach ($users as $user) {
            $roles = $user->roles->pluck('name')->implode(', ');
            $roles = $roles ?: 'Sin roles';

            $this->line("• {$user->name} ({$user->email}) - Roles: {$roles}");
        }

        $this->newLine();
        $this->info('Roles disponibles en el sistema:');
        $this->newLine();

        $roles = Role::all();
        foreach ($roles as $role) {
            $this->line("• {$role->name}");
        }
    }
}
