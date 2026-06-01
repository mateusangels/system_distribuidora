<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

    public const METHOD_CASH = 'cash';
    public const METHOD_PIX = 'pix';
    public const METHOD_CREDIT = 'credit';
    public const METHOD_DEBIT = 'debit';
    public const METHOD_OTHER = 'other';

    protected $fillable = [
        'code',
        'customer_id',
        'sale_id',
        'user_id',
        'amount',
        'method',
        'paid_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function methodLabel(): string
    {
        return match ($this->method) {
            self::METHOD_CASH => 'Dinheiro',
            self::METHOD_PIX => 'PIX',
            self::METHOD_CREDIT => 'Cartão Crédito',
            self::METHOD_DEBIT => 'Cartão Débito',
            self::METHOD_OTHER => 'Outro',
            default => $this->method,
        };
    }

    public static function nextCode(): string
    {
        $last = static::orderByDesc('id')->value('code');
        $num = $last ? (int) preg_replace('/\D/', '', $last) : 0;
        return 'R' . str_pad((string) ($num + 1), 5, '0', STR_PAD_LEFT);
    }
}
