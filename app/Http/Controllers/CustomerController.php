<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCustomerRequest;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerController extends Controller
{
    public function index(Request $request): Response
    {
        $customers = Customer::search($request->string('q')->toString())
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Customers/Index', [
            'customers' => $customers,
            'filters' => ['q' => $request->string('q')->toString()],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Customers/Form', ['customer' => null]);
    }

    public function store(StoreCustomerRequest $request): RedirectResponse
    {
        Customer::create($request->validated());
        return redirect()->route('customers.index')->with('success', 'Cliente cadastrado!');
    }

    public function show(Customer $customer): Response
    {
        $customer->load([
            'sales' => fn ($q) => $q->latest('paid_at')->limit(20),
            'sales.items',
            'warranties.product',
        ]);

        return Inertia::render('Customers/Show', ['customer' => $customer]);
    }

    public function edit(Customer $customer): Response
    {
        return Inertia::render('Customers/Form', ['customer' => $customer]);
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

    /** AJAX para autocomplete no PDV. */
    public function search(Request $request)
    {
        return response()->json(
            Customer::search($request->string('q')->toString())
                ->limit(10)
                ->get(['id', 'name', 'document', 'phone', 'whatsapp'])
        );
    }
}
