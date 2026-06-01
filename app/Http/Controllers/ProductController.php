<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Models\Category;
use App\Models\Product;
use App\Services\StockService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $stock = $request->string('stock')->toString();     // '', 'out', 'low', 'ok'

        $products = Product::with('category:id,name')
            ->search($request->string('q')->toString())
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->when($stock === 'out', fn ($q) => $q->where('stock_qty', '<=', 0))
            ->when($stock === 'low', fn ($q) => $q->whereColumn('stock_qty', '<=', 'min_stock_qty')->where('stock_qty', '>', 0))
            ->when($stock === 'ok', fn ($q) => $q->whereColumn('stock_qty', '>', 'min_stock_qty'))
            ->latest('id') // mais novos primeiro
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'q' => $request->string('q')->toString(),
                'category_id' => $request->integer('category_id') ?: null,
                'stock' => $stock ?: null,
            ],
        ]);
    }

    public function create(): RedirectResponse
    {
        // Formulário é um modal na listagem.
        return redirect()->route('products.index', ['new' => 1]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        Product::create($request->validated());
        return redirect()->route('products.index')->with('success', 'Produto cadastrado!');
    }

    public function edit(Product $product): RedirectResponse
    {
        // Edição agora é via modal na listagem.
        return redirect()->route('products.index', ['edit' => $product->id]);
    }

    public function update(StoreProductRequest $request, Product $product): RedirectResponse
    {
        $product->update($request->validated());
        return redirect()->route('products.index')->with('success', 'Produto atualizado!');
    }

    public function destroy(Product $product): RedirectResponse
    {
        if ($product->movements()->exists()) {
            $product->update(['active' => false]);
            return back()->with('success', 'Produto inativado (possui histórico).');
        }
        $product->delete();
        return back()->with('success', 'Produto removido.');
    }

    /** Endpoint AJAX usado pelo PDV pra busca/leitura barcode. */
    public function search(Request $request, StockService $stock)
    {
        $term = $request->string('q')->toString();
        $exact = $request->boolean('exact');

        $query = Product::active();
        if ($exact) {
            // tentativa por barcode/sku exato (bipou)
            $query->where(fn ($q) => $q->where('barcode', $term)->orWhere('sku', $term));
        } else {
            $query->search($term);
        }

        return response()->json(
            $query->limit(15)->get()->map(fn (Product $p) => [
                'id' => $p->id,
                'sku' => $p->sku,
                'barcode' => $p->barcode,
                'name' => $p->name,
                'sale_price' => $p->sale_price,
                'stock_qty' => $p->stock_qty,
                'unit_label' => $p->unit_label ?: 'un',
                'has_pack' => $p->hasPack(),
                'pack_label' => $p->pack_label,
                'pack_size' => $p->unitsPerPack(),
                'pack_price' => $p->effectivePackPrice(),
            ])
        );
    }

    /** Histórico recente de movimentações de um produto (modal de estoque). */
    public function movements(Product $product)
    {
        return response()->json(
            $product->movements()
                ->with('user:id,name')
                ->latest('id')
                ->limit(20)
                ->get(['id', 'type', 'qty', 'balance_after', 'reason', 'user_id', 'created_at'])
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'type' => $m->type,
                    'type_label' => $m->typeLabel(),
                    'qty' => $m->qty,
                    'balance_after' => $m->balance_after,
                    'reason' => $m->reason,
                    'user' => $m->user?->name,
                    'created_at' => $m->created_at?->toDateTimeString(),
                ])
        );
    }

    public function adjustStock(Request $request, Product $product, StockService $stock): RedirectResponse
    {
        $data = $request->validate([
            'qty' => ['required', 'integer', 'min:0'],
            'reason' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:in,out,adjust'],
            'um' => ['nullable', 'in:unit,pack'],
        ]);

        // Converte caixa -> unidades-base quando a movimentação é em embalagem
        $multiplier = ($data['um'] ?? 'unit') === 'pack' && $product->hasPack()
            ? $product->unitsPerPack()
            : 1;
        $baseQty = abs((int) $data['qty']) * $multiplier;

        try {
            $stock->move(
                product: $product,
                qty: $baseQty,
                type: $data['type'],
                reason: $data['reason'],
            );
        } catch (\DomainException $e) {
            return back()->withErrors(['qty' => $e->getMessage()]);
        }

        return back()->with('success', 'Estoque atualizado!');
    }
}
