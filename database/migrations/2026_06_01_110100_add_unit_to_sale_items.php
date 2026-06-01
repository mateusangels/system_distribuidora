<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            // Como foi vendido: rótulo (ex: "Caixa" ou "un")
            $table->string('sold_as', 30)->default('un')->after('product_sku');
            // Quantas unidades-base cada item vendido representa (1 = avulso, 50 = caixa)
            $table->unsignedInteger('units_each')->default(1)->after('sold_as');
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn(['sold_as', 'units_each']);
        });
    }
};
