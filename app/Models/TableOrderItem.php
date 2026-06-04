<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TableOrderItem extends Model
{
    protected $fillable = [
        'table_order_id',
        'product_id',
        'product_name',
        'product_sku',
        'sold_as',
        'units_each',
        'qty',
        'unit_price',
        'total',
    ];

    protected function casts(): array
    {
        return [
            'units_each' => 'integer',
            'qty' => 'integer',
            'unit_price' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(TableOrder::class, 'table_order_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
