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
    public const PAYMENT_FIADO = 'fiado';

    public const STATUS_OPEN = 'open';
    public const STATUS_PAID = 'paid';
    public const STATUS_PENDING = 'pending'; // fiado em aberto
    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'code',
        'user_id',
        'customer_id',
        'customer_document',
        'subtotal',
        'discount',
        'total',
        'payment_method',
        'amount_received',
        'change_due',
        'status',
        'paid_at',
        'due_date',
        'amount_paid',
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
            'amount_paid' => 'decimal:2',
            'paid_at' => 'datetime',
            'due_date' => 'date',
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

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
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

    /** Vendas no fiado ainda em aberto (saldo devedor > 0). */
    public function scopeFiadoPending(Builder $q): Builder
    {
        return $q->where('payment_method', self::PAYMENT_FIADO)
                 ->where('status', self::STATUS_PENDING);
    }

    /** Fiado pendente já vencido. */
    public function scopeOverdue(Builder $q): Builder
    {
        return $q->fiadoPending()->whereDate('due_date', '<', today());
    }

    /** Saldo ainda devido nesta venda. */
    public function remaining(): float
    {
        return max(0, round((float) $this->total - (float) $this->amount_paid, 2));
    }

    public function isFiado(): bool
    {
        return $this->payment_method === self::PAYMENT_FIADO;
    }

    public function isOverdue(): bool
    {
        return $this->status === self::STATUS_PENDING
            && $this->due_date
            && $this->due_date->isPast();
    }

    public function paymentLabel(): string
    {
        return match ($this->payment_method) {
            self::PAYMENT_CASH => 'Dinheiro',
            self::PAYMENT_PIX => 'PIX',
            self::PAYMENT_CREDIT => 'Cartão Crédito',
            self::PAYMENT_DEBIT => 'Cartão Débito',
            self::PAYMENT_FIADO => 'Fiado',
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
