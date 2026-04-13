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
    ];

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function warranties(): HasMany
    {
        return $this->hasMany(Warranty::class);
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
