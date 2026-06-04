<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Itens consumidos na comanda. O estoque só é debitado no fechamento
        // (quando vira Sale), então aqui guardamos apenas o que foi pedido.
        Schema::create('table_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('table_order_id')->constrained('table_orders')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->string('product_name');
            $table->string('product_sku', 60)->nullable();
            $table->string('sold_as', 30)->default('un'); // "un", "Caixa", "Fardo"…
            $table->unsignedInteger('units_each')->default(1); // unidades-base por unidade de venda
            $table->unsignedInteger('qty')->default(1);
            $table->decimal('unit_price', 12, 2);
            $table->decimal('total', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('table_order_items');
    }
};
