<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // Rótulo da unidade avulsa (ex: un, garrafa, lata)
            $table->string('unit_label', 20)->default('un')->after('name');
            // Embalagem fechada (ex: Caixa, Fardo). null = vendido só avulso.
            $table->string('pack_label', 30)->nullable()->after('unit_label');
            // Quantas unidades vêm numa embalagem (ex: 50)
            $table->unsignedInteger('pack_size')->nullable()->after('pack_label');
            // Preço da embalagem. null = automático (pack_size * sale_price).
            $table->decimal('pack_price', 12, 2)->nullable()->after('sale_price');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['unit_label', 'pack_label', 'pack_size', 'pack_price']);
        });
    }
};
