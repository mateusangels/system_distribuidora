<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleRequest;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function index(Request $request): Response
    {
        $sales = Sale::with(['customer:id,name', 'user:id,name'])
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = $request->string('q')->toString();
                $q->where(function ($q) use ($term) {
                    $q->where('code', 'like', "%$term%")
                      ->orWhereHas('customer', fn ($q) => $q->where('name', 'like', "%$term%"));
                });
            })
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')->toString()))
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
            'filters' => [
                'q' => $request->string('q')->toString(),
                'status' => $request->string('status')->toString() ?: null,
            ],
        ]);
    }

    public function pdv(): Response
    {
        return Inertia::render('Sales/PDV');
    }

    public function show(Sale $sale): Response
    {
        $sale->load(['items', 'customer', 'user', 'warranties.product']);
        return Inertia::render('Sales/Show', ['sale' => $sale]);
    }

    public function store(StoreSaleRequest $request, SaleService $service): JsonResponse|RedirectResponse
    {
        try {
            $sale = $service->createSale(
                items: $request->validated('items'),
                customerId: $request->validated('customer_id'),
                payment: $request->validated('payment'),
            );
        } catch (\DomainException $e) {
            // Inertia retorna como erro de validação
            return back()->withErrors(['sale' => $e->getMessage()])->withInput();
        }

        // Para chamadas AJAX (PDV) retorna JSON; senão redirect
        if ($request->wantsJson()) {
            return response()->json([
                'sale' => $sale->load(['items', 'customer', 'user']),
                'redirect' => route('sales.show', $sale),
            ]);
        }

        return redirect()->route('sales.show', $sale)->with('success', "Venda {$sale->code} registrada!");
    }

    public function cancel(Sale $sale, SaleService $service): RedirectResponse
    {
        $service->cancelSale($sale);
        return back()->with('success', "Venda {$sale->code} cancelada (estoque devolvido).");
    }
}
