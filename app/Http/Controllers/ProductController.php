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
        $products = Product::with('category:id,name')
            ->search($request->string('q')->toString())
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'q' => $request->string('q')->toString(),
                'category_id' => $request->integer('category_id') ?: null,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Products/Form', [
            'product' => null,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        Product::create($request->validated());
        return redirect()->route('products.index')->with('success', 'Produto cadastrado!');
    }

    public function edit(Product $product): Response
    {
        return Inertia::render('Products/Form', [
            'product' => $product,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
        ]);
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
