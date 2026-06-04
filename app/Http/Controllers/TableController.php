<?php

namespace App\Http\Controllers;

use App\Models\RestaurantTable;
use App\Models\Sale;
use App\Models\TableOrder;
use App\Models\TableOrderItem;
use App\Services\TableService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TableController extends Controller
{
    public function __construct(private readonly TableService $service) {}

    public function index(): Response
    {
        $tables = RestaurantTable::query()
            ->with(['currentOrder.customer:id,name', 'currentOrder.items:id,table_order_id,total,qty'])
            ->ordered()
            ->get()
            ->map(function (RestaurantTable $t) {
                $order = $t->currentOrder;
                return [
                    'id' => $t->id,
                    'name' => $t->name,
                    'capacity' => $t->capacity,
                    'status' => $t->status,
                    'notes' => $t->notes,
                    'order' => $order ? [
                        'id' => $order->id,
                        'code' => $order->code,
                        'customer' => $order->customer?->only('id', 'name'),
                        'items_count' => (int) $order->items->sum('qty'),
                        'subtotal' => $order->subtotal(),
                        'opened_at' => $order->opened_at?->toIso8601String(),
                    ] : null,
                ];
            });

        return Inertia::render('Tables/Index', [
            'tables' => $tables,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:40'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:999'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        RestaurantTable::create($data + ['status' => RestaurantTable::STATUS_FREE]);

        return back()->with('success', "Mesa {$data['name']} criada.");
    }

    public function update(Request $request, RestaurantTable $table): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:40'],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:999'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $table->update($data);

        return back()->with('success', 'Mesa atualizada.');
    }

    public function destroy(RestaurantTable $table): RedirectResponse
    {
        if (!$table->isFree()) {
            return back()->withErrors(['table' => 'Não é possível excluir uma mesa ocupada. Feche a comanda primeiro.']);
        }

        $table->delete();

        return back()->with('success', 'Mesa removida.');
    }

    /** Tela da comanda — abre (ou reabre) a comanda da mesa automaticamente. */
    public function show(RestaurantTable $table): Response
    {
        $order = $this->service->openOrder($table);

        return Inertia::render('Tables/Show', [
            'table' => [
                'id' => $table->id,
                'name' => $table->name,
                'capacity' => $table->capacity,
            ],
            'order' => $this->serializeOrder($order),
        ]);
    }

    public function addItem(Request $request, RestaurantTable $table): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'mode' => ['nullable', Rule::in(['unit', 'pack'])],
            'qty' => ['nullable', 'integer', 'min:1'],
        ]);

        $order = $this->service->openOrder($table);

        try {
            $this->service->addItem(
                order: $order,
                productId: (int) $data['product_id'],
                mode: $data['mode'] ?? 'unit',
                qty: (int) ($data['qty'] ?? 1),
            );
        } catch (\DomainException | \InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['order' => $this->serializeOrder($order->fresh())]);
    }

    public function updateItem(Request $request, TableOrderItem $item): JsonResponse
    {
        $data = $request->validate([
            'qty' => ['required', 'integer', 'min:0'],
        ]);

        try {
            $this->service->setItemQty($item, (int) $data['qty']);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['order' => $this->serializeOrder($item->order->fresh())]);
    }

    public function removeItem(TableOrderItem $item): JsonResponse
    {
        $order = $item->order;
        try {
            $this->service->removeItem($item);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['order' => $this->serializeOrder($order->fresh())]);
    }

    public function setCustomer(Request $request, RestaurantTable $table): JsonResponse
    {
        $data = $request->validate([
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'customer_document' => ['nullable', 'string', 'max:32'],
        ]);

        $order = $this->service->openOrder($table);

        try {
            $this->service->setCustomer($order, $data['customer_id'] ?? null, $data['customer_document'] ?? null);
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(['order' => $this->serializeOrder($order->fresh())]);
    }

    public function finalize(Request $request, RestaurantTable $table): JsonResponse
    {
        $data = $request->validate([
            'payment.method' => ['required', Rule::in([
                Sale::PAYMENT_CASH,
                Sale::PAYMENT_PIX,
                Sale::PAYMENT_CREDIT,
                Sale::PAYMENT_DEBIT,
                Sale::PAYMENT_FIADO,
            ])],
            'payment.amount_received' => ['nullable', 'numeric', 'min:0'],
            'payment.discount' => ['nullable', 'numeric', 'min:0'],
            'payment.due_date' => ['nullable', 'date'],
        ]);

        $order = $this->service->openOrder($table);

        try {
            $sale = $this->service->finalize($order, $data['payment']);
        } catch (\DomainException | \InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => ['order' => [$e->getMessage()]],
            ], 422);
        }

        return response()->json([
            'sale' => $sale->load(['items', 'customer', 'user']),
            'redirect' => route('tables.index'),
            'receipt' => route('receipts.show', $sale),
        ]);
    }

    public function cancel(RestaurantTable $table): RedirectResponse
    {
        $order = $table->currentOrder;
        if ($order) {
            $this->service->cancelOrder($order);
        } else {
            $table->update(['status' => RestaurantTable::STATUS_FREE]);
        }

        return redirect()->route('tables.index')->with('success', "Mesa {$table->name} liberada.");
    }

    private function serializeOrder(TableOrder $order): array
    {
        $order->loadMissing(['items.product:id,stock_qty,unit_label', 'customer']);

        return [
            'id' => $order->id,
            'code' => $order->code,
            'status' => $order->status,
            'customer' => $order->customer ? [
                'id' => $order->customer->id,
                'name' => $order->customer->name,
                'document' => $order->customer->document,
                'phone' => $order->customer->phone,
                'whatsapp' => $order->customer->whatsapp,
                'credit_limit' => (float) $order->customer->credit_limit,
                'outstanding' => $order->customer->outstandingBalance(),
                'available_credit' => $order->customer->availableCredit(),
            ] : null,
            'customer_document' => $order->customer_document,
            'opened_at' => $order->opened_at?->toIso8601String(),
            'subtotal' => $order->subtotal(),
            'items' => $order->items->map(fn (TableOrderItem $i) => [
                'id' => $i->id,
                'product_id' => $i->product_id,
                'name' => $i->product_name,
                'sku' => $i->product_sku,
                'sold_as' => $i->sold_as,
                'units_each' => (int) $i->units_each,
                'qty' => (int) $i->qty,
                'unit_price' => (float) $i->unit_price,
                'total' => (float) $i->total,
                'stock_qty' => (int) ($i->product->stock_qty ?? 0),
            ])->values(),
        ];
    }
}
