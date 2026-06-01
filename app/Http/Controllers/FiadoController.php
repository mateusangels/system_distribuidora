<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Payment;
use App\Models\Sale;
use App\Services\FiadoService;
use App\Services\WhatsappService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class FiadoController extends Controller
{
    /**
     * Painel do fiado: clientes com saldo devedor + totais.
     */
    public function index(Request $request, WhatsappService $whatsapp): Response
    {
        $term = $request->string('q')->toString();

        // Saldo devedor por cliente (apenas fiado pendente).
        $balances = Sale::fiadoPending()
            ->selectRaw('customer_id, SUM(total - amount_paid) as outstanding, COUNT(*) as open_sales, MIN(due_date) as next_due')
            ->whereNotNull('customer_id')
            ->groupBy('customer_id')
            ->havingRaw('SUM(total - amount_paid) > 0')
            ->pluck('outstanding', 'customer_id');

        $debtors = collect();
        if ($balances->isNotEmpty()) {
            $debtors = Customer::whereIn('id', $balances->keys())
                ->when($term !== '', fn ($q) => $q->search($term))
                ->orderBy('name')
                ->get()
                ->map(function (Customer $c) use ($whatsapp) {
                    $pending = $c->sales()->fiadoPending()
                        ->orderByRaw('COALESCE(due_date, created_at) asc')->get();
                    $overdue = $pending->filter(fn (Sale $s) => $s->isOverdue());

                    return [
                        'id' => $c->id,
                        'name' => $c->name,
                        'phone' => $c->phone,
                        'whatsapp' => $c->whatsapp,
                        'credit_limit' => (float) $c->credit_limit,
                        'outstanding' => round((float) $pending->sum(fn (Sale $s) => $s->remaining()), 2),
                        'open_sales' => $pending->count(),
                        'overdue_count' => $overdue->count(),
                        'next_due' => $pending->first()?->due_date?->toDateString(),
                        'has_overdue' => $overdue->isNotEmpty(),
                        'whatsapp_url' => $whatsapp->buildCharge($c)['url'],
                    ];
                })
                ->sortByDesc('outstanding')
                ->values();
        }

        $totalOutstanding = round((float) Sale::fiadoPending()->sum(DB::raw('total - amount_paid')), 2);
        $overdueAmount = round((float) Sale::overdue()->sum(DB::raw('total - amount_paid')), 2);

        // Últimos recebimentos
        $recentPayments = Payment::with(['customer:id,name', 'user:id,name'])
            ->latest('paid_at')
            ->limit(15)
            ->get();

        return Inertia::render('Fiado/Index', [
            'debtors' => $debtors,
            'metrics' => [
                'total_outstanding' => $totalOutstanding,
                'overdue_amount' => $overdueAmount,
                'debtors_count' => $balances->count(),
            ],
            'recentPayments' => $recentPayments,
            'filters' => ['q' => $term],
        ]);
    }

    /**
     * Registra um recebimento do cliente abatendo o fiado (alocação FIFO no serviço).
     */
    public function storePayment(Request $request, Customer $customer, FiadoService $fiado): RedirectResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', Rule::in([
                Payment::METHOD_CASH,
                Payment::METHOD_PIX,
                Payment::METHOD_CREDIT,
                Payment::METHOD_DEBIT,
                Payment::METHOD_OTHER,
            ])],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $payment = $fiado->registerPayment(
                customer: $customer,
                amount: (float) $data['amount'],
                method: $data['method'],
                notes: $data['notes'] ?? null,
            );
        } catch (\DomainException | \InvalidArgumentException $e) {
            return back()->withErrors(['amount' => $e->getMessage()])->withInput();
        }

        return back()->with('success', "Recebimento {$payment->code} de R$ "
            . number_format((float) $payment->amount, 2, ',', '.') . " registrado!");
    }
}
