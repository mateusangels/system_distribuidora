<?php

namespace App\Services;

use App\Models\Product;
use App\Models\RestaurantTable;
use App\Models\Sale;
use App\Models\TableOrder;
use App\Models\TableOrderItem;
use Illuminate\Support\Facades\DB;

class TableService
{
    public function __construct(private readonly SaleService $sales) {}

    /**
     * Devolve a comanda aberta da mesa, criando uma nova (e marcando a mesa
     * como ocupada) se ainda não existir.
     */
    public function openOrder(RestaurantTable $table): TableOrder
    {
        return DB::transaction(function () use ($table) {
            $table = RestaurantTable::lockForUpdate()->findOrFail($table->id);

            $order = $table->orders()
                ->where('status', TableOrder::STATUS_OPEN)
                ->latest('id')
                ->first();

            if ($order) {
                return $order;
            }

            $userId = auth()->id();
            if (!$userId) {
                throw new \RuntimeException('Usuário não autenticado.');
            }

            $order = $table->orders()->create([
                'code' => TableOrder::nextCode(),
                'user_id' => $userId,
                'status' => TableOrder::STATUS_OPEN,
                'opened_at' => now(),
            ]);

            $table->update(['status' => RestaurantTable::STATUS_OCCUPIED]);

            return $order;
        });
    }

    /**
     * Adiciona (ou incrementa) um item na comanda.
     *
     * $mode: 'unit' (avulso) ou 'pack' (caixa/fardo).
     */
    public function addItem(TableOrder $order, int $productId, string $mode = 'unit', int $qty = 1): TableOrderItem
    {
        if ($qty <= 0) {
            throw new \InvalidArgumentException('Quantidade inválida.');
        }

        return DB::transaction(function () use ($order, $productId, $mode, $qty) {
            $this->assertOpen($order);

            /** @var Product $product */
            $product = Product::findOrFail($productId);

            if (!$product->active) {
                throw new \DomainException("Produto {$product->name} está inativo.");
            }

            $isPack = $mode === 'pack' && $product->hasPack();
            $unitsEach = $isPack ? max(1, $product->unitsPerPack()) : 1;
            $soldAs = $isPack
                ? ($product->pack_label ?: 'Caixa')
                : ($product->unit_label ?: 'un');
            $unitPrice = $isPack
                ? round((float) $product->effectivePackPrice(), 2)
                : round((float) $product->sale_price, 2);

            // Mesma linha = mesmo produto + mesmo modo de venda.
            $item = $order->items()
                ->where('product_id', $product->id)
                ->where('units_each', $unitsEach)
                ->first();

            if ($item) {
                $item->qty += $qty;
                $item->total = round($item->unit_price * $item->qty, 2);
                $item->save();
                return $item;
            }

            return $order->items()->create([
                'product_id' => $product->id,
                'product_name' => $product->name,
                'product_sku' => $product->sku,
                'sold_as' => $soldAs,
                'units_each' => $unitsEach,
                'qty' => $qty,
                'unit_price' => $unitPrice,
                'total' => round($unitPrice * $qty, 2),
            ]);
        });
    }

    public function setItemQty(TableOrderItem $item, int $qty): TableOrderItem
    {
        $this->assertOpen($item->order);

        if ($qty <= 0) {
            $item->delete();
            return $item;
        }

        $item->qty = $qty;
        $item->total = round((float) $item->unit_price * $qty, 2);
        $item->save();

        return $item;
    }

    public function removeItem(TableOrderItem $item): void
    {
        $this->assertOpen($item->order);
        $item->delete();
    }

    public function setCustomer(TableOrder $order, ?int $customerId, ?string $document = null): TableOrder
    {
        $this->assertOpen($order);

        $order->update([
            'customer_id' => $customerId,
            'customer_document' => $document ? trim($document) : $order->customer_document,
        ]);

        return $order->fresh();
    }

    /**
     * Fecha a comanda: gera a Sale (que dá baixa no estoque e registra o
     * pagamento, inclusive fiado), vincula à comanda e libera a mesa.
     *
     * $payment: ['method'=>..., 'amount_received'=>?, 'discount'=>?, 'due_date'=>?]
     */
    public function finalize(TableOrder $order, array $payment): Sale
    {
        return DB::transaction(function () use ($order, $payment) {
            $order = TableOrder::lockForUpdate()->findOrFail($order->id);
            $this->assertOpen($order);

            $order->load('items');
            if ($order->items->isEmpty()) {
                throw new \DomainException('A comanda está vazia — adicione itens antes de fechar.');
            }

            $items = $order->items->map(fn (TableOrderItem $i) => [
                'product_id' => $i->product_id,
                'qty' => $i->qty,
                'unit_price' => (float) $i->unit_price,
                'units_each' => $i->units_each,
                'sold_as' => $i->sold_as,
            ])->all();

            $sale = $this->sales->createSale(
                items: $items,
                customerId: $order->customer_id,
                payment: $payment,
                customerDocument: $order->customer_document,
            );

            $order->update([
                'sale_id' => $sale->id,
                'status' => TableOrder::STATUS_CLOSED,
                'closed_at' => now(),
            ]);

            $order->table()->update(['status' => RestaurantTable::STATUS_FREE]);

            return $sale;
        });
    }

    /** Cancela a comanda sem gerar venda e libera a mesa. */
    public function cancelOrder(TableOrder $order): void
    {
        DB::transaction(function () use ($order) {
            $this->assertOpen($order);
            $order->update([
                'status' => TableOrder::STATUS_CANCELLED,
                'closed_at' => now(),
            ]);
            $order->table()->update(['status' => RestaurantTable::STATUS_FREE]);
        });
    }

    private function assertOpen(?TableOrder $order): void
    {
        if (!$order || !$order->isOpen()) {
            throw new \DomainException('Esta comanda não está mais aberta.');
        }
    }
}
