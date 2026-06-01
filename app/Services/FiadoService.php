<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Payment;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FiadoService
{
    /**
     * Registra um recebimento do cliente abatendo o saldo do fiado.
     * O valor é alocado FIFO nas vendas pendentes mais antigas (por vencimento).
     *
     * @param  string  $method  cash|pix|credit|debit|other
     */
    public function registerPayment(
        Customer $customer,
        float $amount,
        string $method = Payment::METHOD_CASH,
        ?string $notes = null,
        ?Carbon $paidAt = null,
    ): Payment {
        $amount = round($amount, 2);
        if ($amount <= 0) {
            throw new \InvalidArgumentException('O valor do recebimento deve ser maior que zero.');
        }

        return DB::transaction(function () use ($customer, $amount, $method, $notes, $paidAt) {
            $userId = auth()->id();
            if (!$userId) {
                throw new \RuntimeException('Usuário não autenticado.');
            }

            // Vendas no fiado pendentes, da mais antiga p/ mais nova.
            $pendingSales = Sale::where('customer_id', $customer->id)
                ->fiadoPending()
                ->orderByRaw('COALESCE(due_date, created_at) asc')
                ->orderBy('id')
                ->lockForUpdate()
                ->get();

            $outstanding = round((float) $pendingSales->sum(fn (Sale $s) => $s->remaining()), 2);
            if ($outstanding <= 0) {
                throw new \DomainException("{$customer->name} não possui saldo devedor no fiado.");
            }
            if ($amount > $outstanding) {
                throw new \DomainException(sprintf(
                    'Valor (R$ %s) maior que o saldo devedor (R$ %s).',
                    number_format($amount, 2, ',', '.'),
                    number_format($outstanding, 2, ',', '.'),
                ));
            }

            $paidAt ??= now();
            $leftover = $amount;
            $firstSaleId = null;

            foreach ($pendingSales as $sale) {
                if ($leftover <= 0) {
                    break;
                }
                $remaining = $sale->remaining();
                if ($remaining <= 0) {
                    continue;
                }

                $applied = min($remaining, $leftover);
                $newPaid = round((float) $sale->amount_paid + $applied, 2);
                $fullyPaid = $newPaid >= (float) $sale->total;

                $sale->update([
                    'amount_paid' => $newPaid,
                    'status' => $fullyPaid ? Sale::STATUS_PAID : Sale::STATUS_PENDING,
                    'paid_at' => $fullyPaid ? $paidAt : null,
                ]);

                $firstSaleId ??= $sale->id;
                $leftover = round($leftover - $applied, 2);
            }

            return Payment::create([
                'code' => Payment::nextCode(),
                'customer_id' => $customer->id,
                'sale_id' => $firstSaleId,
                'user_id' => $userId,
                'amount' => $amount,
                'method' => $method,
                'paid_at' => $paidAt,
                'notes' => $notes,
            ]);
        });
    }
}
