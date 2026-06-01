<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /** Normaliza embalagem: sem pack_label, zera os campos de caixa. */
    protected function prepareForValidation(): void
    {
        $hasPack = filled($this->pack_label);
        $this->merge([
            'unit_label' => filled($this->unit_label) ? $this->unit_label : 'un',
            'pack_label' => $hasPack ? $this->pack_label : null,
            'pack_size' => $hasPack && filled($this->pack_size) ? $this->pack_size : null,
            // pack_price vazio = automático (null)
            'pack_price' => $hasPack && filled($this->pack_price) ? $this->pack_price : null,
        ]);
    }

    public function rules(): array
    {
        $productId = $this->route('product')?->id;

        return [
            'sku' => ['required', 'string', 'max:64', Rule::unique('products', 'sku')->ignore($productId)],
            'barcode' => ['nullable', 'string', 'max:64'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0'],
            'stock_qty' => ['required', 'integer', 'min:0'],
            'min_stock_qty' => ['required', 'integer', 'min:0'],
            'warranty_days' => ['nullable', 'integer', 'min:0'],
            'active' => ['boolean'],
            'unit_label' => ['nullable', 'string', 'max:20'],
            'pack_label' => ['nullable', 'string', 'max:30'],
            'pack_size' => ['nullable', 'integer', 'min:2'],
            'pack_price' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
