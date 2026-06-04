<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RestaurantTable extends Model
{
    public const STATUS_FREE = 'free';
    public const STATUS_OCCUPIED = 'occupied';

    protected $fillable = [
        'name',
        'capacity',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(TableOrder::class);
    }

    /** Comanda aberta atual da mesa (no máximo uma). */
    public function currentOrder(): HasOne
    {
        return $this->hasOne(TableOrder::class)
            ->where('status', TableOrder::STATUS_OPEN)
            ->latestOfMany();
    }

    public function isFree(): bool
    {
        return $this->status === self::STATUS_FREE;
    }

    public function scopeOrdered(Builder $q): Builder
    {
        return $q->orderBy('name');
    }
}
