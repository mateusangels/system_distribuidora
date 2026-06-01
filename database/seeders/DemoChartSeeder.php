<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Popula o dashboard com vendas PAGAS espalhadas pelo mês corrente,
 * só pra deixar os gráficos bonitos (faturamento diário, categorias, top produtos).
 *
 * Uso:  php artisan db:seed --class=DemoChartSeeder
 *
 * Inserção direta (não passa pelo SaleService) — não mexe em estoque de propósito,
 * pra não zerar produtos nem disparar alertas. É dado de vitrine.
 */
class DemoChartSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::orderBy('id')->first();
        if (!$admin) {
            $this->command->error('Nenhum usuário encontrado. Rode o DatabaseSeeder antes.');
            return;
        }

        $products = Product::where('active', true)->get(['id', 'name', 'sku', 'sale_price'])->all();
        if (count($products) === 0) {
            $this->command->error('Nenhum produto. Rode o DatabaseSeeder antes.');
            return;
        }

        $customerIds = Customer::pluck('id')->all();
        $methods = [Sale::PAYMENT_CASH, Sale::PAYMENT_PIX, Sale::PAYMENT_CREDIT, Sale::PAYMENT_DEBIT];

        // Idempotente: remove a leva anterior deste seeder (marcada em notes).
        $oldIds = Sale::where('notes', 'demo-chart')->pluck('id');
        if ($oldIds->isNotEmpty()) {
            SaleItem::whereIn('sale_id', $oldIds)->delete();
            Sale::whereIn('id', $oldIds)->delete();
            $this->command->info("Removidas {$oldIds->count()} vendas demo anteriores.");
        }

        // Últimos 45 dias (deixa Semana / Mês / 3 meses preenchidos).
        $start = Carbon::now()->subDays(44)->startOfDay();
        $today = Carbon::now();

        $created = 0;
        $revenue = 0.0;

        for ($day = $start->copy(); $day->lte($today); $day->addDay()) {
            // Fim de semana vende mais; varia o movimento por dia.
            $isWeekend = in_array($day->dayOfWeek, [Carbon::FRIDAY, Carbon::SATURDAY, Carbon::SUNDAY], true);
            $salesCount = $isWeekend ? random_int(6, 14) : random_int(2, 8);

            for ($s = 0; $s < $salesCount; $s++) {
                $paidAt = $day->copy()->setTime(random_int(9, 22), random_int(0, 59), random_int(0, 59));
                if ($paidAt->gt($today)) {
                    continue; // não cria venda no futuro do dia de hoje
                }

                DB::transaction(function () use ($products, $customerIds, $methods, $paidAt, $admin, &$created, &$revenue) {
                    $itemsQty = random_int(1, 4);
                    $picked = collect($products)->random(min($itemsQty, count($products)));

                    $method = $methods[array_rand($methods)];
                    $sale = Sale::create([
                        'code' => Sale::nextCode(),
                        'user_id' => $admin->id,
                        'customer_id' => empty($customerIds) || random_int(0, 2) === 0 ? null : $customerIds[array_rand($customerIds)],
                        'subtotal' => 0,
                        'discount' => 0,
                        'total' => 0,
                        'payment_method' => $method,
                        'status' => Sale::STATUS_PAID,
                        'paid_at' => $paidAt,
                        'created_at' => $paidAt,
                        'updated_at' => $paidAt,
                        'notes' => 'demo-chart',
                    ]);

                    $subtotal = 0.0;
                    foreach ($picked as $p) {
                        $qty = random_int(1, 12);
                        $unit = (float) $p->sale_price;
                        $lineTotal = round($unit * $qty, 2);
                        $subtotal += $lineTotal;

                        SaleItem::create([
                            'sale_id' => $sale->id,
                            'product_id' => $p->id,
                            'product_name' => $p->name,
                            'product_sku' => $p->sku,
                            'qty' => $qty,
                            'unit_price' => $unit,
                            'total' => $lineTotal,
                            'warranty_days' => 0,
                        ]);
                    }

                    $subtotal = round($subtotal, 2);
                    $sale->update([
                        'subtotal' => $subtotal,
                        'total' => $subtotal,
                        'amount_paid' => $subtotal,
                        'amount_received' => $method === Sale::PAYMENT_CASH ? $subtotal : null,
                    ]);

                    $created++;
                    $revenue += $subtotal;
                });
            }
        }

        $this->command->info("Geradas {$created} vendas demo no mês — faturamento R$ " . number_format($revenue, 2, ',', '.'));
    }
}
