<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Services\ReceiptPrinter;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ReceiptController extends Controller
{
    public function show(Request $request, Sale $sale, ReceiptPrinter $printer): Response
    {
        $sale->load(['items', 'customer', 'user']);

        $format = $request->string('format')->toString();

        if ($format === 'escpos') {
            return response($printer->escpos($sale), 200, [
                'Content-Type' => 'application/octet-stream',
                'Content-Disposition' => 'attachment; filename="cupom-' . $sale->code . '.bin"',
            ]);
        }

        if ($format === 'txt') {
            return response($printer->text($sale), 200, [
                'Content-Type' => 'text/plain; charset=utf-8',
            ]);
        }

        // HTML imprimível padrão (Blade)
        return response()->view('receipts.show', [
            'sale' => $sale,
            'store' => config('store'),
        ]);
    }
}
