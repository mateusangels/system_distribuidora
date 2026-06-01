<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'document',
        'phone',
        'whatsapp',
        'email',
        'address',
        'notes',
        'credit_limit',
    ];

    protected function casts(): array
    {
        return [
            'credit_limit' => 'decimal:2',
        ];
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /** Total ainda devido no fiado (soma de total - amount_paid das vendas pendentes). */
    public function outstandingBalance(): float
    {
        return (float) $this->sales()
            ->fiadoPending()
            ->sum(\Illuminate\Support\Facades\DB::raw('total - amount_paid'));
    }

    /** Crédito disponível considerando o limite. Null = sem limite definido. */
    public function availableCredit(): ?float
    {
        $limit = (float) $this->credit_limit;
        if ($limit <= 0) {
            return null;
        }
        return round($limit - $this->outstandingBalance(), 2);
    }

    public function scopeSearch(Builder $q, ?string $term): Builder
    {
        if (!$term) return $q;
        $term = trim($term);
        return $q->where(function ($q) use ($term) {
            $q->where('name', 'like', "%$term%")
              ->orWhere('document', 'like', "%$term%")
              ->orWhere('phone', 'like', "%$term%")
              ->orWhere('whatsapp', 'like', "%$term%");
        });
    }
}
