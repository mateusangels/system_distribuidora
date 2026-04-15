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
        $warranty = $request->string('warranty')->toString(); // '', 'with', 'without'

        $products = Product::with('category:id,name')
            ->search($request->string('q')->toString())
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->when($stock === 'out', fn ($q) => $q->where('stock_qty', '<=', 0))
            ->when($stock === 'low', fn ($q) => $q->whereColumn('stock_qty', '<=', 'min_stock_qty')->where('stock_qty', '>', 0))
            ->when($stock === 'ok', fn ($q) => $q->whereColumn('stock_qty', '>', 'min_stock_qty'))
            ->when($warranty === 'with', fn ($q) => $q->where('warranty_days', '>', 0))
            ->when($warranty === 'without', fn ($q) => $q->where('warranty_days', '<=', 0))
            ->latest('id') // mais novos primeiro
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'q' => $request->string('q')->toString(),
                'category_id' => $request->integer('category_id') ?: null,
                'stock' => $stock ?: null,
                'warranty' => $warranty ?: null,
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
            $query->limit(15)->get([
                'id', 'sku', 'barcode', 'name', 'sale_price', 'stock_qty', 'warranty_days',
            ])
        );
    }

    public function adjustStock(Request $request, Product $product, StockService $stock): RedirectResponse
    {
        $data = $request->validate([
            'qty' => ['required', 'integer'],
            'reason' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:in,out,adjust'],
        ]);

        $stock->move(
            product: $product,
            qty: abs($data['qty']),
            type: $data['type'],
            reason: $data['reason'],
        );

        return back()->with('success', 'Estoque atualizado!');
    }
}
