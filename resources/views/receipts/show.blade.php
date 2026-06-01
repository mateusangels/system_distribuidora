<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Cupom {{ $sale->code }}</title>
<style>
    /* ---------- Impressão (impressora térmica 58/80mm) ---------- */
    @page {
        size: 80mm 200mm;
        margin: 0;
    }

    * { box-sizing: border-box; }

    html, body { margin: 0; padding: 0; }

    body {
        background: #e8e8e8;
        font-family: 'Courier New', monospace;
        color: #000;
        padding: 20px 12px 80px;
    }

    /* O "papelzinho" térmico visível na tela e também impresso */
    .receipt {
        width: 80mm;
        max-width: 80mm;
        margin: 0 auto;
        padding: 6mm 4mm;
        background: #fff;
        color: #000;
        font-size: 12px;
        line-height: 1.35;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        border-radius: 2px;
    }

    .center { text-align: center; }
    .right  { text-align: right; }
    .b      { font-weight: bold; }
    .lg     { font-size: 16px; }
    .sep    { border-top: 1px dashed #000; margin: 6px 0; }
    .row    { display: flex; justify-content: space-between; gap: 6px; }
    table   { width: 100%; border-collapse: collapse; }
    th, td  { padding: 1px 0; vertical-align: top; }
    th      { border-bottom: 1px dashed #000; text-align: left; }
    .qty    { width: 28px; text-align: center; }
    .total  { width: 72px; text-align: right; }

    /* ---------- Barra de ações (só na tela) ---------- */
    .actions {
        position: fixed;
        left: 50%;
        bottom: 16px;
        transform: translateX(-50%);
        display: flex;
        gap: 8px;
        padding: 10px 12px;
        background: #11141c;
        border-radius: 10px;
        box-shadow: 0 10px 24px rgba(0,0,0,0.4);
        z-index: 10;
    }
    .actions button, .actions a {
        font: 600 13px 'Inter', system-ui, sans-serif;
        padding: 9px 14px;
        background: #ed1212;
        color: #fff;
        border: 0;
        border-radius: 6px;
        text-decoration: none;
        cursor: pointer;
    }
    .actions a.ghost {
        background: transparent;
        border: 1px solid rgba(255,255,255,0.25);
    }

    .hint {
        position: fixed;
        left: 50%;
        top: 8px;
        transform: translateX(-50%);
        font: 500 11px 'Inter', system-ui, sans-serif;
        color: #555;
        background: #fff;
        padding: 4px 10px;
        border-radius: 999px;
        border: 1px solid #ddd;
        z-index: 10;
    }

    /* ---------- Impressão: esconde tudo exceto o cupom ---------- */
    @media print {
        body { background: #fff; padding: 0; }
        .receipt {
            box-shadow: none;
            border-radius: 0;
            margin: 0;
            padding: 2mm;
            width: 80mm;
        }
        .actions, .hint { display: none !important; }
    }
</style>
</head>
<body>

<div class="hint">
    Prévia em tamanho real (80 mm) · ao imprimir, selecione a impressora térmica
</div>

<div class="receipt">

    <div class="center b lg">{{ strtoupper($store['name']) }}</div>
    <div class="center">{{ $store['tagline'] }}</div>
    <div class="center">{{ $store['address'] }}</div>
    <div class="center">Tel: {{ $store['phone'] }}</div>
    @if(!empty($store['doc']))
        <div class="center">{{ $store['doc'] }}</div>
    @endif

    <div class="sep"></div>
    <div class="b center">CUPOM NÃO FISCAL</div>
    <div class="row"><span>Código:</span><span>{{ $sale->code }}</span></div>
    <div class="row"><span>Data:</span><span>{{ $sale->paid_at?->format('d/m/Y H:i') }}</span></div>
    <div class="row"><span>Caixa:</span><span>{{ $sale->user->name }}</span></div>
    @if($sale->customer)
        <div class="row"><span>Cliente:</span><span>{{ $sale->customer->name }}</span></div>
    @endif
    @if($sale->customer_document)
        <div class="row"><span>CPF/CNPJ:</span><span>{{ $sale->customer_document }}</span></div>
    @elseif($sale->customer && $sale->customer->document)
        <div class="row"><span>CPF/CNPJ:</span><span>{{ $sale->customer->document }}</span></div>
    @endif

    <div class="sep"></div>
    <table>
        <thead>
            <tr><th>Produto</th><th class="qty">Qtd</th><th class="total">Total</th></tr>
        </thead>
        <tbody>
        @foreach($sale->items as $item)
            <tr>
                <td>{{ $item->product_name }}<br><small>@if((int)$item->units_each > 1){{ $item->qty }} {{ $item->sold_as }} ({{ $item->units_each }} un) @ R$ {{ number_format((float)$item->unit_price,2,',','.') }}@else SKU {{ $item->product_sku }} @ R$ {{ number_format((float)$item->unit_price,2,',','.') }}@endif</small></td>
                <td class="qty">{{ $item->qty }}</td>
                <td class="total">R$ {{ number_format((float)$item->total,2,',','.') }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <div class="sep"></div>
    <div class="row"><span>Subtotal:</span><span>R$ {{ number_format((float)$sale->subtotal,2,',','.') }}</span></div>
    @if((float)$sale->discount > 0)
        <div class="row"><span>Desconto:</span><span>R$ {{ number_format((float)$sale->discount,2,',','.') }}</span></div>
    @endif
    <div class="row b lg"><span>TOTAL:</span><span>R$ {{ number_format((float)$sale->total,2,',','.') }}</span></div>
    <div class="row"><span>Pagamento:</span><span>{{ $sale->paymentLabel() }}</span></div>
    @if($sale->payment_method === 'cash' && $sale->amount_received !== null)
        <div class="row"><span>Recebido:</span><span>R$ {{ number_format((float)$sale->amount_received,2,',','.') }}</span></div>
        <div class="row b"><span>Troco:</span><span>R$ {{ number_format((float)($sale->change_due ?? 0),2,',','.') }}</span></div>
    @endif

    <div class="sep"></div>
    <div class="center">{{ $store['footer'] }}</div>
    <div class="center" style="margin-top:6px;font-size:10px;">
        Documento sem valor fiscal — apenas comprovante de venda.
    </div>
</div>

<div class="actions">
    <button onclick="window.print()">Imprimir</button>
    <a href="{{ route('receipts.show', ['sale' => $sale->id, 'format' => 'escpos']) }}" class="ghost">Baixar ESC/POS</a>
    <a href="{{ url()->previous() }}" class="ghost">Voltar</a>
</div>

<script>
    // auto-print quando vem do PDV (?print=1)
    if (new URLSearchParams(window.location.search).get('print') === '1') {
        setTimeout(() => window.print(), 250);
    }
</script>

</body>
</html>
