<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Warranty;

class AlertService
{
    public function lowStockCount(): int
    {
        return Product::active()->lowStock()->count();
    }

    public function nearExpiryWarrantyCount(?int $days = null): int
    {
        $days ??= (int) config('store.warranty_near_expiry_days', 7);
        return Warranty::nearExpiry($days)->count();
    }

    public function summary(): array
    {
        return [
            'low_stock' => $this->lowStockCount(),
            'warranties_near_expiry' => $this->nearExpiryWarrantyCount(),
        ];
    }
}
