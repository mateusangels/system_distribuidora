<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    public const TYPE_IN = 'in';
    public const TYPE_OUT = 'out';
    public const TYPE_ADJUST = 'adjust';

    protected $fillable = [
        'product_id',
        'type',
        'qty',
        'balance_after',
        'reason',
        'sale_id',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'qty' => 'integer',
            'balance_after' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function typeLabel(): string
    {
        return match ($this->type) {
            self::TYPE_IN => 'Entrada',
            self::TYPE_OUT => 'Saída',
            self::TYPE_ADJUST => 'Ajuste',
            default => $this->type,
        };
    }
}
