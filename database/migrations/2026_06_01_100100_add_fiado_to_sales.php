<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Adiciona 'fiado' como forma de pagamento e 'pending' como status (venda em aberto no fiado).
        // Enum alterado via SQL cru para não depender de doctrine/dbal.
        DB::statement("ALTER TABLE sales MODIFY COLUMN payment_method ENUM('cash','pix','credit','debit','fiado') NOT NULL DEFAULT 'cash'");
        DB::statement("ALTER TABLE sales MODIFY COLUMN status ENUM('open','paid','cancelled','pending') NOT NULL DEFAULT 'open'");

        Schema::table('sales', function (Blueprint $table) {
            // Vencimento do fiado (null para vendas à vista)
            $table->date('due_date')->nullable()->after('paid_at');
            // Quanto já foi abatido via recebimentos (para fiado parcial)
            $table->decimal('amount_paid', 12, 2)->default(0)->after('due_date');
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropColumn(['due_date', 'amount_paid']);
        });

        DB::statement("ALTER TABLE sales MODIFY COLUMN payment_method ENUM('cash','pix','credit','debit') NOT NULL DEFAULT 'cash'");
        DB::statement("ALTER TABLE sales MODIFY COLUMN status ENUM('open','paid','cancelled') NOT NULL DEFAULT 'open'");
    }
};
