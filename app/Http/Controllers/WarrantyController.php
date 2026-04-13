<?php

namespace App\Http\Controllers;

use App\Models\Warranty;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WarrantyController extends Controller
{
    public function index(Request $request): Response
    {
        $warranties = Warranty::with(['product:id,name', 'customer:id,name,phone,whatsapp', 'sale:id,code'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = $request->string('q')->toString();
                $q->whereHas('product', fn ($q) => $q->where('name', 'like', "%$term%"))
                  ->orWhereHas('customer', fn ($q) => $q->where('name', 'like', "%$term%"))
                  ->orWhereHas('sale', fn ($q) => $q->where('code', 'like', "%$term%"));
            })
            ->orderBy('ends_at')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Warranties/Index', [
            'warranties' => $warranties,
            'filters' => [
                'q' => $request->string('q')->toString(),
                'status' => $request->string('status')->toString() ?: null,
            ],
            'nearExpiryDays' => (int) config('store.warranty_near_expiry_days'),
        ]);
    }

    public function markUsed(Warranty $warranty): RedirectResponse
    {
        $warranty->update(['status' => Warranty::STATUS_USED]);
        return back()->with('success', 'Garantia marcada como usada.');
    }

    /** Simulação WhatsApp — só registra notes. */
    public function notify(Warranty $warranty): RedirectResponse
    {
        $msg = sprintf(
            "[SIMULAÇÃO WhatsApp para %s — %s] Olá! Sua garantia do produto %s vence em %s. Qualquer dúvida, estamos à disposição. - %s",
            $warranty->customer?->name ?? '(sem cliente)',
            $warranty->customer?->whatsapp ?? $warranty->customer?->phone ?? 'sem contato',
            $warranty->product->name,
            $warranty->ends_at?->format('d/m/Y'),
            config('store.name'),
        );
        $warranty->update([
            'notes' => trim(($warranty->notes ?? '') . "\n" . now()->format('d/m/Y H:i') . " — " . $msg),
        ]);
        return back()->with('success', 'Cliente notificado (simulação).');
    }
}
