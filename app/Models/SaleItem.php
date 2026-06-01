<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class SaleItem extends Model
{
    protected $fillable = [
        'sale_id',
        'product_id',
        'product_name',
        'product_sku',
        'sold_as',
        'units_each',
        'qty',
        'unit_price',
        'total',
        'warranty_days',
    ];

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'units_each' => 'integer',
            'unit_price' => 'decimal:2',
            'total' => 'decimal:2',
            'warranty_days' => 'integer',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function warranty(): HasOne
    {
        return $this->hasOne(Warranty::class);
    }
}
