<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Cupom {{ $sale->code }}</title>
<style>
    @page { size: 80mm auto; margin: 4mm; }
    * { box-sizing: border-box; }
    body {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        max-width: 80mm;
        margin: 0 auto;
        padding: 8px;
        color: #000;
        background: #fff;
    }
    .center { text-align: center; }
    .right  { text-align: right; }
    .b      { font-weight: bold; }
    .lg     { font-size: 16px; }
    .sep    { border-top: 1px dashed #000; margin: 6px 0; }
    .row    { display: flex; justify-content: space-between; }
    table   { width: 100%; border-collapse: collapse; }
    th, td  { padding: 1px 0; vertical-align: top; }
    th      { border-bottom: 1px dashed #000; text-align: left; }
    .qty    { width: 28px; text-align: center; }
    .total  { width: 70px; text-align: right; }
    .actions {
        max-width: 80mm;
        margin: 12px auto 0;
        display: flex;
        gap: 8px;
        justify-content: center;
    }
    .actions button, .actions a {
        font: 600 12px sans-serif;
        padding: 8px 14px;
        background: #ed1212;
        color: #fff;
        border: 0;
        border-radius: 4px;
        text-decoration: none;
        cursor: pointer;
    }
    .actions a.ghost {
        background: #11141c;
    }
    @media print {
        .actions { display: none; }
        body { padding: 0; }
    }
</style>
</head>
<body>

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

<div class="sep"></div>
<table>
    <thead>
        <tr><th>Produto</th><th class="qty">Qtd</th><th class="total">Total</th></tr>
    </thead>
    <tbody>
    @foreach($sale->items as $item)
        <tr>
            <td>{{ $item->product_name }}<br><small>SKU {{ $item->product_sku }} @ R$ {{ number_format((float)$item->unit_price,2,',','.') }}</small></td>
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
