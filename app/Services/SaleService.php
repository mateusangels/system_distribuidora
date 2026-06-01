<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SaleService
{
    public function __construct(private readonly StockService $stock) {}

    /**
     * Cria uma venda completa em uma única transação:
     *  - valida estoque
     *  - cria sale + sale_items
     *  - debita estoque (stock_movements)
     *  - se fiado: deixa pendente com vencimento e checa limite de crédito
     *
     * $items: [['product_id'=>int, 'qty'=>int, 'unit_price'=>?float], ...]
     * $payment: ['method'=>cash|pix|credit|debit|fiado, 'amount_received'=>?float, 'discount'=>?float, 'due_date'=>?string]
     */
    public function createSale(array $items, ?int $customerId, array $payment, ?string $customerDocument = null): Sale
    {
        if (empty($items)) {
            throw new \InvalidArgumentException('Venda precisa de pelo menos 1 item.');
        }

        $isFiado = ($payment['method'] ?? null) === Sale::PAYMENT_FIADO;
        if ($isFiado && !$customerId) {
            throw new \DomainException('Venda no fiado exige um cliente cadastrado.');
        }

        return DB::transaction(function () use ($items, $customerId, $payment, $customerDocument, $isFiado) {
            $userId = auth()->id();
            if (!$userId) {
                throw new \RuntimeException('Usuário não autenticado.');
            }

            $sale = Sale::create([
                'code' => Sale::nextCode(),
                'user_id' => $userId,
                'customer_id' => $customerId,
                'customer_document' => $customerDocument ? trim($customerDocument) : null,
                'subtotal' => 0,
                'discount' => round((float) ($payment['discount'] ?? 0), 2),
                'total' => 0,
                'payment_method' => $payment['method'] ?? Sale::PAYMENT_CASH,
                'status' => Sale::STATUS_OPEN,
            ]);

            $subtotal = 0.0;

            foreach ($items as $row) {
                $productId = (int) $row['product_id'];
                $qty = (int) $row['qty'];
                if ($qty <= 0) {
                    throw new \InvalidArgumentException('Quantidade inválida.');
                }

                /** @var Product $product */
                $product = Product::lockForUpdate()->findOrFail($productId);

                if (!$product->active) {
                    throw new \DomainException("Produto {$product->name} está inativo.");
                }

                // Unidade vendida: avulsa (units_each=1) ou caixa/fardo (units_each=pack_size)
                $unitsEach = max(1, (int) ($row['units_each'] ?? 1));
                $soldAs = isset($row['sold_as']) && $row['sold_as'] !== ''
                    ? (string) $row['sold_as']
                    : ($product->unit_label ?: 'un');
                $baseUnits = $qty * $unitsEach;

                if ($product->stock_qty < $baseUnits) {
                    throw new \DomainException(
                        "Estoque insuficiente para {$product->name}. Disponível: {$product->stock_qty} un, solicitado: {$baseUnits} un."
                    );
                }

                $unit = isset($row['unit_price'])
                    ? round((float) $row['unit_price'], 2)
                    : (float) $product->sale_price;
                $lineTotal = round($unit * $qty, 2);
                $subtotal += $lineTotal;

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'sold_as' => $soldAs,
                    'units_each' => $unitsEach,
                    'qty' => $qty,
                    'unit_price' => $unit,
                    'total' => $lineTotal,
                    'warranty_days' => $product->warranty_days,
                ]);

                // débito estoque (sempre em unidades-base)
                $this->stock->move(
                    product: $product,
                    qty: $baseUnits,
                    type: StockMovement::TYPE_OUT,
                    reason: "Venda {$sale->code}",
                    sale: $sale,
                );
            }

            $discount = (float) $sale->discount;
            $total = max(0, round($subtotal - $discount, 2));

            if ($isFiado) {
                // Venda no fiado: fica pendente, sem recebimento imediato.
                $this->assertCreditAvailable($customerId, $total);

                $dueDate = isset($payment['due_date']) && $payment['due_date']
                    ? Carbon::parse($payment['due_date'])->startOfDay()
                    : today()->addDays((int) config('store.fiado_due_days_default', 30));

                $sale->update([
                    'subtotal' => round($subtotal, 2),
                    'total' => $total,
                    'amount_received' => null,
                    'change_due' => null,
                    'amount_paid' => 0,
                    'status' => Sale::STATUS_PENDING,
                    'paid_at' => null,
                    'due_date' => $dueDate,
                ]);

                return $sale->fresh(['items.product', 'customer', 'user']);
            }

            // Venda à vista (dinheiro/pix/cartão): quitada na hora.
            $amountReceived = isset($payment['amount_received'])
                ? round((float) $payment['amount_received'], 2)
                : $total;

            if ($sale->payment_method === Sale::PAYMENT_CASH && $amountReceived < $total) {
                throw new \DomainException('Valor recebido é menor que o total da venda.');
            }

            $changeDue = $sale->payment_method === Sale::PAYMENT_CASH
                ? max(0, round($amountReceived - $total, 2))
                : null;

            $sale->update([
                'subtotal' => round($subtotal, 2),
                'total' => $total,
                'amount_received' => $amountReceived,
                'change_due' => $changeDue,
                'amount_paid' => $total,
                'status' => Sale::STATUS_PAID,
                'paid_at' => now(),
            ]);

            return $sale->fresh(['items.product', 'customer', 'user']);
        });
    }

    /**
     * Garante que o cliente tem crédito disponível para uma nova venda no fiado.
     */
    private function assertCreditAvailable(int $customerId, float $total): void
    {
        $customer = Customer::lockForUpdate()->findOrFail($customerId);
        $available = $customer->availableCredit();

        if ($available !== null && $total > $available) {
            throw new \DomainException(sprintf(
                'Limite de crédito insuficiente para %s. Disponível: R$ %s (limite R$ %s).',
                $customer->name,
                number_format(max(0, $available), 2, ',', '.'),
                number_format((float) $customer->credit_limit, 2, ',', '.'),
            ));
        }
    }

    public function cancelSale(Sale $sale): Sale
    {
        if ($sale->status === Sale::STATUS_CANCELLED) {
            return $sale;
        }

        return DB::transaction(function () use ($sale) {
            // devolve estoque
            foreach ($sale->items as $item) {
                $product = Product::lockForUpdate()->find($item->product_id);
                if ($product) {
                    $this->stock->move(
                        product: $product,
                        qty: $item->qty,
                        type: StockMovement::TYPE_IN,
                        reason: "Estorno venda {$sale->code}",
                        sale: $sale,
                    );
                }
            }

            $sale->update(['status' => Sale::STATUS_CANCELLED]);

            return $sale->fresh();
        });
    }
}
