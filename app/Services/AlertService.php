<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Sale;

class AlertService
{
    public function lowStockCount(): int
    {
        return Product::active()->lowStock()->count();
    }

    /** Vendas no fiado pendentes já vencidas. */
    public function fiadoOverdueCount(): int
    {
        return Sale::overdue()->count();
    }

    public function summary(): array
    {
        return [
            'low_stock' => $this->lowStockCount(),
            'fiado_overdue' => $this->fiadoOverdueCount(),
        ];
    }
}
