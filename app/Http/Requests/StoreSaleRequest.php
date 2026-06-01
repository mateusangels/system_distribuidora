<?php

namespace App\Http\Requests;

use App\Models\Sale;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'customer_document' => ['nullable', 'string', 'max:32'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.qty' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'payment.method' => ['required', Rule::in([
                Sale::PAYMENT_CASH,
                Sale::PAYMENT_PIX,
                Sale::PAYMENT_CREDIT,
                Sale::PAYMENT_DEBIT,
                Sale::PAYMENT_FIADO,
            ])],
            'payment.amount_received' => ['nullable', 'numeric', 'min:0'],
            'payment.discount' => ['nullable', 'numeric', 'min:0'],
            'payment.due_date' => ['nullable', 'date'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if ($this->input('payment.method') === Sale::PAYMENT_FIADO && !$this->filled('customer_id')) {
                $validator->errors()->add('customer_id', 'Venda no fiado exige um cliente cadastrado.');
            }
        });
    }
}
