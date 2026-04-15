<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Seeder de PRODUÇÃO — cria APENAS o usuário administrador.
 *
 * Uso:
 *   php artisan db:seed --class=ProductionSeeder --force
 *
 * Variáveis de ambiente (opcionais):
 *   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
 * Se não definidas, usa os defaults abaixo — TROQUE A SENHA APÓS O PRIMEIRO LOGIN.
 */
class ProductionSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('ADMIN_EMAIL', 'admin@duasrodas.local');

        $admin = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => env('ADMIN_NAME', 'Administrador'),
                'password' => env('ADMIN_PASSWORD', 'admin123'),
                'role' => User::ROLE_ADMIN,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info("Admin OK: {$admin->email}");
        $this->command->warn('Troque a senha após o primeiro login!');
    }
}
