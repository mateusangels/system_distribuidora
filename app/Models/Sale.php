<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use HasFactory;

    public const PAYMENT_CASH = 'cash';
    public const PAYMENT_PIX = 'pix';
    public const PAYMENT_CREDIT = 'credit';
    public const PAYMENT_DEBIT = 'debit';

    public const STATUS_OPEN = 'open';
    public const STATUS_PAID = 'paid';
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'code',
        'user_id',
        'customer_id',
        'subtotal',
        'discount',
        'total',
        'payment_method',
        'amount_received',
        'change_due',
        'status',
        'paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'total' => 'decimal:2',
            'amount_received' => 'decimal:2',
            'change_due' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function warranties(): HasMany
    {
        return $this->hasMany(Warranty::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    public function scopePaid(Builder $q): Builder
    {
        return $q->where('status', self::STATUS_PAID);
    }

    public function scopeToday(Builder $q): Builder
    {
        return $q->whereDate('paid_at', today());
    }

    public function paymentLabel(): string
    {
        return match ($this->payment_method) {
            self::PAYMENT_CASH => 'Dinheiro',
            self::PAYMENT_PIX => 'PIX',
            self::PAYMENT_CREDIT => 'Cartão Crédito',
            self::PAYMENT_DEBIT => 'Cartão Débito',
            default => $this->payment_method,
        };
    }

    public static function nextCode(): string
    {
        $last = static::orderByDesc('id')->value('code');
        $num = $last ? (int) preg_replace('/\D/', '', $last) : 0;
        return 'V' . str_pad((string) ($num + 1), 5, '0', STR_PAD_LEFT);
    }
}
