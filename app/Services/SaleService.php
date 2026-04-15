<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\Warranty;
use Illuminate\Support\Facades\DB;

class SaleService
{
    public function __construct(private readonly StockService $stock) {}

    /**
     * Cria uma venda completa em uma única transação:
     *  - valida estoque
     *  - cria sale + sale_items
     *  - debita estoque (stock_movements)
     *  - cria warranties para itens elegíveis
     *
     * $items: [['product_id'=>int, 'qty'=>int, 'unit_price'=>?float], ...]
     * $payment: ['method'=>cash|pix|credit|debit, 'amount_received'=>?float, 'discount'=>?float]
     */
    public function createSale(array $items, ?int $customerId, array $payment, ?string $customerDocument = null): Sale
    {
        if (empty($items)) {
            throw new \InvalidArgumentException('Venda precisa de pelo menos 1 item.');
        }

        return DB::transaction(function () use ($items, $customerId, $payment, $customerDocument) {
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
                if ($product->stock_qty < $qty) {
                    throw new \DomainException(
                        "Estoque insuficiente para {$product->name}. Disponível: {$product->stock_qty}."
                    );
                }

                $unit = isset($row['unit_price'])
                    ? round((float) $row['unit_price'], 2)
                    : (float) $product->sale_price;
                $lineTotal = round($unit * $qty, 2);
                $subtotal += $lineTotal;

                $item = SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'qty' => $qty,
                    'unit_price' => $unit,
                    'total' => $lineTotal,
                    'warranty_days' => $product->warranty_days,
                ]);

                // débito estoque
                $this->stock->move(
                    product: $product,
                    qty: $qty,
                    type: StockMovement::TYPE_OUT,
                    reason: "Venda {$sale->code}",
                    sale: $sale,
                );

                // garantia (se elegível)
                if ($product->warranty_days > 0) {
                    Warranty::create([
                        'sale_item_id' => $item->id,
                        'sale_id' => $sale->id,
                        'product_id' => $product->id,
                        'customer_id' => $customerId,
                        'starts_at' => today(),
                        'ends_at' => today()->addDays($product->warranty_days),
                        'status' => Warranty::STATUS_ACTIVE,
                    ]);
                }
            }

            $discount = (float) $sale->discount;
            $total = max(0, round($subtotal - $discount, 2));

            $amountReceived = isset($payment['amount_received'])
                ? round((float) $payment['amount_received'], 2)
                : $total;

            $changeDue = $sale->payment_method === Sale::PAYMENT_CASH
                ? max(0, round($amountReceived - $total, 2))
                : null;

            $sale->update([
                'subtotal' => round($subtotal, 2),
                'total' => $total,
                'amount_received' => $amountReceived,
                'change_due' => $changeDue,
                'status' => Sale::STATUS_PAID,
                'paid_at' => now(),
            ]);

            return $sale->fresh(['items.product', 'customer', 'user', 'warranties']);
        });
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

            // expira garantias
            $sale->warranties()->update(['status' => Warranty::STATUS_EXPIRED]);
            $sale->update(['status' => Sale::STATUS_CANCELLED]);

            return $sale->fresh();
        });
    }
}
