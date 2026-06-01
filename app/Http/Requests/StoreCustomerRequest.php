<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    /**
     * Garante que credit_limit nunca chegue null no insert (coluna NOT NULL).
     * O middleware ConvertEmptyStringsToNull transforma "" em null antes daqui.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'credit_limit' => ($this->credit_limit === null || $this->credit_limit === '')
                ? 0
                : $this->credit_limit,
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'document' => ['nullable', 'string', 'max:32'],
            'phone' => ['nullable', 'string', 'max:32'],
            'whatsapp' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
