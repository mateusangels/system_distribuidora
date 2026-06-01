<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Sale;

/**
 * Geração de cobrança via WhatsApp.
 *
 * Estratégia atual: link "click-to-chat" (wa.me) com a mensagem pré-preenchida —
 * o operador só clica e envia. Não há custo nem dependência externa.
 *
 * Para evoluir p/ envio automático (Evolution API / WhatsApp Cloud API), basta
 * adicionar um método send(Customer, string) aqui e plugar o cliente HTTP —
 * o formato da mensagem (buildChargeMessage) é reaproveitado.
 */
class WhatsappService
{
    /**
     * Monta a cobrança do saldo devedor de um cliente.
     *
     * @return array{phone:?string, text:string, url:?string, has_phone:bool}
     */
    public function buildCharge(Customer $customer): array
    {
        $text = $this->buildChargeMessage($customer);
        $phone = $this->normalizePhone($customer->whatsapp ?: $customer->phone);

        return [
            'phone' => $phone,
            'text' => $text,
            'url' => $phone ? "https://wa.me/{$phone}?text=" . rawurlencode($text) : null,
            'has_phone' => $phone !== null,
        ];
    }

    /**
     * Texto da mensagem de cobrança.
     */
    public function buildChargeMessage(Customer $customer): string
    {
        $store = (string) config('store.name', 'Distribuidora');
        $outstanding = $customer->outstandingBalance();

        $pending = Sale::where('customer_id', $customer->id)
            ->fiadoPending()
            ->orderByRaw('COALESCE(due_date, created_at) asc')
            ->get();

        $lines = [];
        $lines[] = "Olá, {$customer->name}! 👋";
        $lines[] = '';
        $lines[] = "Passando para lembrar do seu saldo em aberto na *{$store}*:";
        $lines[] = '';

        foreach ($pending as $sale) {
            $due = $sale->due_date ? $sale->due_date->format('d/m/Y') : 'sem data';
            $venc = $sale->isOverdue() ? ' (vencido)' : '';
            $lines[] = sprintf(
                '• Venda %s — R$ %s — venc. %s%s',
                $sale->code,
                number_format($sale->remaining(), 2, ',', '.'),
                $due,
                $venc,
            );
        }

        $lines[] = '';
        $lines[] = '*Total: R$ ' . number_format($outstanding, 2, ',', '.') . '*';
        $lines[] = '';
        $lines[] = 'Qualquer dúvida estamos à disposição. Obrigado! 🍺';

        return implode("\n", $lines);
    }

    /**
     * Normaliza para o formato exigido pelo wa.me: somente dígitos, com DDI 55.
     * Retorna null se não houver número utilizável.
     */
    public function normalizePhone(?string $raw): ?string
    {
        if (!$raw) {
            return null;
        }

        $digits = preg_replace('/\D/', '', $raw) ?? '';
        if (strlen($digits) < 10) {
            return null;
        }

        // Já tem DDI 55?
        if (str_starts_with($digits, '55') && strlen($digits) >= 12) {
            return $digits;
        }

        return '55' . $digits;
    }
}
