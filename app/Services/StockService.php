<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Registra movimentação e atualiza saldo do produto atomicamente.
     * Use dentro de uma transação se compor com outras escritas.
     */
    public function move(
        Product $product,
        int $qty,
        string $type,
        string $reason,
        ?Sale $sale = null,
        ?User $user = null,
    ): StockMovement {
        if ($qty <= 0) {
            throw new \InvalidArgumentException('Quantidade deve ser positiva.');
        }

        return DB::transaction(function () use ($product, $qty, $type, $reason, $sale, $user) {
            // lock pessimista
            $fresh = Product::whereKey($product->id)->lockForUpdate()->firstOrFail();

            $newQty = match ($type) {
                StockMovement::TYPE_IN => $fresh->stock_qty + $qty,
                StockMovement::TYPE_OUT => $fresh->stock_qty - $qty,
                StockMovement::TYPE_ADJUST => $qty, // ajuste é absoluto
                default => throw new \InvalidArgumentException("Tipo inválido: $type"),
            };

            if ($newQty < 0) {
                throw new \DomainException(
                    "Estoque insuficiente para {$fresh->name}. Disponível: {$fresh->stock_qty}, solicitado: $qty."
                );
            }

            $fresh->stock_qty = $newQty;
            $fresh->save();

            return StockMovement::create([
                'product_id' => $fresh->id,
                'type' => $type,
                'qty' => $type === StockMovement::TYPE_ADJUST
                    ? abs($newQty - ($fresh->getOriginal('stock_qty') ?? 0))
                    : $qty,
                'balance_after' => $newQty,
                'reason' => $reason,
                'sale_id' => $sale?->id,
                'user_id' => $user?->id ?? auth()->id(),
            ]);
        });
    }
}
