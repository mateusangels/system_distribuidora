<?php

namespace App\Services;

use App\Models\Sale;

/**
 * Gera representações de cupom não-fiscal:
 *  - text(): texto plain (preview / debug / 80mm-friendly)
 *  - escpos(): bytes ESC/POS prontos para enviar pra impressora térmica
 *
 * Fluxo de impressão real:
 *   1. Frontend chama GET /sales/{sale}/receipt?format=escpos
 *   2. Backend retorna octet-stream com bytes
 *   3. Operador roteia pra impressora via daemon local (PrintNode, etc)
 *      ou via "Impressora padrão" do navegador para o HTML (fallback simples)
 */
class ReceiptPrinter
{
    private const WIDTH = 48; // 80mm térmica ≈ 48 colunas (font A)

    public function text(Sale $sale): string
    {
        $sale->loadMissing(['items', 'customer', 'user']);
        $cfg = config('store');

        $lines = [];
        $lines[] = $this->center(strtoupper($cfg['name']));
        $lines[] = $this->center($cfg['tagline']);
        $lines[] = $this->center($cfg['address']);
        $lines[] = $this->center("Tel: {$cfg['phone']}");
        if (!empty($cfg['doc'])) {
            $lines[] = $this->center($cfg['doc']);
        }
        $lines[] = str_repeat('=', self::WIDTH);
        $lines[] = "CUPOM NAO FISCAL";
        $lines[] = "Codigo: {$sale->code}";
        $lines[] = "Data:   " . $sale->paid_at?->format('d/m/Y H:i');
        $lines[] = "Caixa:  " . ($sale->user->name ?? '-');
        if ($sale->customer) {
            $lines[] = "Cliente: " . $this->ascii($sale->customer->name);
        }
        $lines[] = str_repeat('-', self::WIDTH);
        $lines[] = sprintf("%-30s %3s %12s", 'PRODUTO', 'QTD', 'TOTAL');
        $lines[] = str_repeat('-', self::WIDTH);

        foreach ($sale->items as $item) {
            $name = $this->ascii($item->product_name);
            $name = mb_strimwidth($name, 0, 30, '');
            $lines[] = sprintf(
                "%-30s %3d %12s",
                $name,
                $item->qty,
                'R$ ' . number_format((float) $item->total, 2, ',', '.')
            );
            $lines[] = sprintf(
                "  SKU %s @ R$ %s",
                $item->product_sku,
                number_format((float) $item->unit_price, 2, ',', '.')
            );
        }

        $lines[] = str_repeat('-', self::WIDTH);
        $lines[] = $this->kv('Subtotal', $sale->subtotal);
        if ((float) $sale->discount > 0) {
            $lines[] = $this->kv('Desconto', $sale->discount);
        }
        $lines[] = $this->kv('TOTAL', $sale->total);
        $lines[] = "Pagamento: " . $sale->paymentLabel();
        if ($sale->payment_method === Sale::PAYMENT_CASH && $sale->amount_received !== null) {
            $lines[] = $this->kv('Recebido', $sale->amount_received);
            $lines[] = $this->kv('Troco', $sale->change_due ?? 0);
        }
        $lines[] = str_repeat('=', self::WIDTH);
        $lines[] = $this->center($cfg['footer']);
        $lines[] = "";
        $lines[] = "";
        $lines[] = "";

        return implode("\n", $lines);
    }

    /**
     * Retorna bytes ESC/POS. Usa biblioteca mike42/escpos-php se disponível,
     * senão cai num fallback de comandos básicos.
     */
    public function escpos(Sale $sale): string
    {
        $sale->loadMissing(['items', 'customer', 'user']);
        $cfg = config('store');

        // ESC @  inicializa
        // ESC a  alinhamento (0=left,1=center,2=right)
        // GS V   corte
        $ESC = "\x1b";
        $GS = "\x1d";
        $INIT = $ESC . '@';
        $CENTER = $ESC . 'a' . chr(1);
        $LEFT = $ESC . 'a' . chr(0);
        $BOLD_ON = $ESC . 'E' . chr(1);
        $BOLD_OFF = $ESC . 'E' . chr(0);
        $CUT = $GS . 'V' . chr(66) . chr(0);

        $out = $INIT;
        $out .= $CENTER . $BOLD_ON . $this->ascii(strtoupper($cfg['name'])) . "\n" . $BOLD_OFF;
        $out .= $CENTER . $this->ascii($cfg['tagline']) . "\n";
        $out .= $CENTER . $this->ascii($cfg['address']) . "\n";
        $out .= $CENTER . $this->ascii("Tel: {$cfg['phone']}") . "\n";
        if (!empty($cfg['doc'])) {
            $out .= $CENTER . $this->ascii($cfg['doc']) . "\n";
        }
        $out .= $LEFT . str_repeat('=', self::WIDTH) . "\n";
        $out .= $BOLD_ON . "CUPOM NAO FISCAL\n" . $BOLD_OFF;
        $out .= "Codigo: {$sale->code}\n";
        $out .= "Data:   " . $sale->paid_at?->format('d/m/Y H:i') . "\n";
        $out .= "Caixa:  " . $this->ascii($sale->user->name ?? '-') . "\n";
        if ($sale->customer) {
            $out .= "Cliente: " . $this->ascii($sale->customer->name) . "\n";
        }
        $out .= str_repeat('-', self::WIDTH) . "\n";

        foreach ($sale->items as $item) {
            $name = mb_strimwidth($this->ascii($item->product_name), 0, 30, '');
            $out .= sprintf(
                "%-30s %3d %12s\n",
                $name,
                $item->qty,
                'R$ ' . number_format((float) $item->total, 2, ',', '.')
            );
        }

        $out .= str_repeat('-', self::WIDTH) . "\n";
        $out .= $this->kv('Subtotal', $sale->subtotal) . "\n";
        if ((float) $sale->discount > 0) {
            $out .= $this->kv('Desconto', $sale->discount) . "\n";
        }
        $out .= $BOLD_ON . $this->kv('TOTAL', $sale->total) . "\n" . $BOLD_OFF;
        $out .= "Pagamento: " . $this->ascii($sale->paymentLabel()) . "\n";
        if ($sale->payment_method === Sale::PAYMENT_CASH && $sale->amount_received !== null) {
            $out .= $this->kv('Recebido', $sale->amount_received) . "\n";
            $out .= $this->kv('Troco', $sale->change_due ?? 0) . "\n";
        }
        $out .= str_repeat('=', self::WIDTH) . "\n";
        $out .= $CENTER . $this->ascii($cfg['footer']) . "\n\n\n\n";
        $out .= $CUT;

        return $out;
    }

    private function center(string $text, int $width = self::WIDTH): string
    {
        $text = $this->ascii($text);
        $len = mb_strlen($text);
        if ($len >= $width) return $text;
        $pad = (int) floor(($width - $len) / 2);
        return str_repeat(' ', $pad) . $text;
    }

    private function kv(string $label, $value): string
    {
        $right = 'R$ ' . number_format((float) $value, 2, ',', '.');
        $pad = self::WIDTH - mb_strlen($label) - mb_strlen($right);
        return $label . str_repeat(' ', max(1, $pad)) . $right;
    }

    /** Remove acentos pra impressoras térmicas que não suportam UTF-8. */
    private function ascii(string $s): string
    {
        $tr = [
            'á'=>'a','à'=>'a','ã'=>'a','â'=>'a','ä'=>'a',
            'é'=>'e','è'=>'e','ê'=>'e','ë'=>'e',
            'í'=>'i','ì'=>'i','î'=>'i','ï'=>'i',
            'ó'=>'o','ò'=>'o','õ'=>'o','ô'=>'o','ö'=>'o',
            'ú'=>'u','ù'=>'u','û'=>'u','ü'=>'u',
            'ç'=>'c','ñ'=>'n',
            'Á'=>'A','À'=>'A','Ã'=>'A','Â'=>'A','Ä'=>'A',
            'É'=>'E','È'=>'E','Ê'=>'E','Ë'=>'E',
            'Í'=>'I','Ì'=>'I','Î'=>'I','Ï'=>'I',
            'Ó'=>'O','Ò'=>'O','Õ'=>'O','Ô'=>'O','Ö'=>'O',
            'Ú'=>'U','Ù'=>'U','Û'=>'U','Ü'=>'U',
            'Ç'=>'C','Ñ'=>'N',
        ];
        return strtr($s, $tr);
    }
}
