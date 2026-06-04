<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Mesas físicas do estabelecimento. Cada mesa pode ter no máximo
        // uma comanda (table_order) aberta por vez.
        Schema::create('restaurant_tables', function (Blueprint $table) {
            $table->id();
            $table->string('name', 40);
            $table->unsignedSmallInteger('capacity')->nullable();
            $table->enum('status', ['free', 'occupied'])->default('free')->index();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_tables');
    }
};
