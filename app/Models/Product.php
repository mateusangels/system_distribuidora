<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'sku',
        'barcode',
        'name',
        'description',
        'category_id',
        'cost_price',
        'sale_price',
        'stock_qty',
        'min_stock_qty',
        'warranty_days',
        'active',
        'unit_label',
        'pack_label',
        'pack_size',
        'pack_price',
    ];

    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'pack_price' => 'decimal:2',
            'stock_qty' => 'integer',
            'min_stock_qty' => 'integer',
            'pack_size' => 'integer',
            'warranty_days' => 'integer',
            'active' => 'boolean',
        ];
    }

    /** Tem embalagem fechada (caixa/fardo) com mais de 1 unidade? */
    public function hasPack(): bool
    {
        return !empty($this->pack_label) && (int) $this->pack_size > 1;
    }

    /** Unidades-base por embalagem (1 se não houver pack). */
    public function unitsPerPack(): int
    {
        return $this->hasPack() ? (int) $this->pack_size : 1;
    }

    /** Preço efetivo da embalagem: manual se definido, senão automático. */
    public function effectivePackPrice(): float
    {
        if (!$this->hasPack()) {
            return (float) $this->sale_price;
        }
        return $this->pack_price !== null
            ? (float) $this->pack_price
            : round((float) $this->sale_price * $this->unitsPerPack(), 2);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function isLowStock(): bool
    {
        return $this->stock_qty <= $this->min_stock_qty;
    }

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('active', true);
    }

    public function scopeLowStock(Builder $q): Builder
    {
        return $q->whereColumn('stock_qty', '<=', 'min_stock_qty');
    }

    public function scopeSearch(Builder $q, ?string $term): Builder
    {
        if (!$term) return $q;
        $term = trim($term);
        return $q->where(function ($q) use ($term) {
            $q->where('name', 'like', "%$term%")
              ->orWhere('sku', 'like', "%$term%")
              ->orWhere('barcode', $term);
        });
    }
}
