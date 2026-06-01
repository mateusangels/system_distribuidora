<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerRequest;
use App\Models\Customer;
use App\Models\Sale;
use App\Services\WhatsappService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $customers = Customer::search($request->string('q')->toString())
            ->latest('id') // mais novos primeiro
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'filters' => ['q' => $request->string('q')->toString()],
        ]);
    }

    public function create(): RedirectResponse
    {
        // Formulário é um modal na listagem — redireciona com flag pra abrir automaticamente.
        return redirect()->route('customers.index', ['new' => 1]);
    }

    public function store(StoreCustomerRequest $request): RedirectResponse
    {
        Customer::create($request->validated());
        return redirect()->route('customers.index')->with('success', 'Cliente cadastrado!');
    }

    public function show(Customer $customer, WhatsappService $whatsapp): Response
    {
        $customer->load([
            'sales' => fn ($q) => $q->latest('id')->limit(20),
            'sales.items',
            'payments' => fn ($q) => $q->latest('paid_at')->limit(20),
            'payments.user:id,name',
        ]);

        $pendingSales = $customer->sales()
            ->fiadoPending()
            ->orderByRaw('COALESCE(due_date, created_at) asc')
            ->get();

        return Inertia::render('Customers/Show', [
            'customer' => $customer,
            'fiado' => [
                'outstanding' => $customer->outstandingBalance(),
                'available_credit' => $customer->availableCredit(),
                'pending_sales' => $pendingSales->map(fn (Sale $s) => [
                    'id' => $s->id,
                    'code' => $s->code,
                    'total' => (float) $s->total,
                    'amount_paid' => (float) $s->amount_paid,
                    'remaining' => $s->remaining(),
                    'due_date' => $s->due_date?->toDateString(),
                    'overdue' => $s->isOverdue(),
                    'created_at' => $s->created_at?->toDateString(),
                ]),
                'whatsapp' => $whatsapp->buildCharge($customer),
            ],
        ]);
    }

    public function edit(Customer $customer): RedirectResponse
    {
        // Edição agora é via modal na listagem.
        return redirect()->route('customers.index', ['edit' => $customer->id]);
    }

    public function update(StoreCustomerRequest $request, Customer $customer): RedirectResponse
    {
        $customer->update($request->validated());
        return redirect()->route('customers.index')->with('success', 'Cliente atualizado!');
    }

    public function destroy(Customer $customer): RedirectResponse
    {
        $customer->delete();
        return back()->with('success', 'Cliente removido.');
    }

    /** AJAX para autocomplete no PDV. Inclui saldo/limite p/ vendas no fiado. */
    public function search(Request $request)
    {
        $customers = Customer::search($request->string('q')->toString())
            ->limit(10)
            ->get(['id', 'name', 'document', 'phone', 'whatsapp', 'credit_limit']);

        return response()->json(
            $customers->map(fn (Customer $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'document' => $c->document,
                'phone' => $c->phone,
                'whatsapp' => $c->whatsapp,
                'credit_limit' => (float) $c->credit_limit,
                'outstanding' => $c->outstandingBalance(),
                'available_credit' => $c->availableCredit(),
            ])
        );
    }
}
