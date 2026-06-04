<?php

namespace Database\Seeders;

use App\Models\RestaurantTable;
use Illuminate\Database\Seeder;

class TablesSeeder extends Seeder
{
    public function run(): void
    {
        for ($i = 1; $i <= 8; $i++) {
            RestaurantTable::firstOrCreate(
                ['name' => "Mesa $i"],
                ['capacity' => 4, 'status' => RestaurantTable::STATUS_FREE]
            );
        }
    }
}
