<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TableOrder extends Model
{
    public const STATUS_OPEN = 'open';
    public const STATUS_CLOSED = 'closed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'code',
        'restaurant_table_id',
        'customer_id',
        'user_id',
        'sale_id',
        'customer_document',
        'status',
        'notes',
        'opened_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(RestaurantTable::class, 'restaurant_table_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(TableOrderItem::class);
    }

    /** Soma dos itens da comanda (sem desconto). */
    public function subtotal(): float
    {
        return round((float) $this->items->sum('total'), 2);
    }

    public function isOpen(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }

    public static function nextCode(): string
    {
        $last = static::orderByDesc('id')->value('code');
        $num = $last ? (int) preg_replace('/\D/', '', $last) : 0;
        return 'C' . str_pad((string) ($num + 1), 5, '0', STR_PAD_LEFT);
    }
}
