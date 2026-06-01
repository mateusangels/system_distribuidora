<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Services\AlertService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    private const ALLOWED_PERIODS = ['week', 'month', '3months', 'custom'];

    public function __invoke(Request $request, AlertService $alerts): Response
    {
        $salesToday = Sale::paid()->today()->sum('total');
        $salesTodayCount = Sale::paid()->today()->count();

        [$period, $rangeStart, $rangeEnd] = $this->resolvePeriod($request);

        $revenuePeriod = Sale::paid()
            ->whereBetween('paid_at', [$rangeStart, $rangeEnd])
            ->sum('total');

        $revenuePeriodCount = Sale::paid()
            ->whereBetween('paid_at', [$rangeStart, $rangeEnd])
            ->count();

        $topProducts = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.status', Sale::STATUS_PAID)
            ->where('sales.paid_at', '>=', now()->subDays(30))
            ->selectRaw('sale_items.product_name, sale_items.product_sku, SUM(sale_items.qty) as qty_sold, SUM(sale_items.total) as revenue')
            ->groupBy('sale_items.product_name', 'sale_items.product_sku')
            ->orderByDesc('qty_sold')
            ->limit(5)
            ->get();

        $revenueByDay = $this->buildRevenueByDay($rangeStart, $rangeEnd);
        $salesByCategory = $this->buildSalesByCategory();

        $lowStock = Product::active()->lowStock()
            ->select('id', 'name', 'sku', 'stock_qty', 'min_stock_qty')
            ->orderBy('stock_qty')
            ->limit(10)
            ->get();

        // ---- Fiado / contas a receber ----
        $fiadoOutstanding = (float) Sale::fiadoPending()->sum(DB::raw('total - amount_paid'));
        $fiadoOverdue = (float) Sale::overdue()->sum(DB::raw('total - amount_paid'));

        $topDebtors = DB::table('sales')
            ->join('customers', 'customers.id', '=', 'sales.customer_id')
            ->where('sales.payment_method', Sale::PAYMENT_FIADO)
            ->where('sales.status', Sale::STATUS_PENDING)
            ->selectRaw('customers.id, customers.name, customers.whatsapp, customers.phone, '
                . 'SUM(sales.total - sales.amount_paid) as outstanding, '
                . 'MIN(sales.due_date) as next_due, '
                . 'SUM(CASE WHEN sales.due_date < CURDATE() THEN 1 ELSE 0 END) as overdue_count')
            ->groupBy('customers.id', 'customers.name', 'customers.whatsapp', 'customers.phone')
            ->havingRaw('SUM(sales.total - sales.amount_paid) > 0')
            ->orderByDesc('outstanding')
            ->limit(8)
            ->get()
            ->map(fn ($r) => [
                'id' => (int) $r->id,
                'name' => (string) $r->name,
                'outstanding' => (float) $r->outstanding,
                'next_due' => $r->next_due,
                'overdue_count' => (int) $r->overdue_count,
            ]);

        return Inertia::render('Dashboard', [
            'metrics' => [
                'sales_today' => (float) $salesToday,
                'sales_today_count' => $salesTodayCount,
                'revenue_period' => (float) $revenuePeriod,
                'revenue_period_count' => $revenuePeriodCount,
                'fiado_outstanding' => $fiadoOutstanding,
                'fiado_overdue' => $fiadoOverdue,
            ],
            'filter' => [
                'period' => $period,
                'start' => $rangeStart->toDateString(),
                'end' => $rangeEnd->toDateString(),
            ],
            'topProducts' => $topProducts,
            'revenueByDay' => $revenueByDay,
            'salesByCategory' => $salesByCategory,
            'lowStock' => $lowStock,
            'topDebtors' => $topDebtors,
            'alerts' => $alerts->summary(),
        ]);
    }

    /**
     * @return array<int,array{date:string,label:string,revenue:float,count:int}>
     */
    private function buildRevenueByDay(Carbon $rangeStart, Carbon $rangeEnd): array
    {
        $rows = DB::table('sales')
            ->selectRaw('DATE(paid_at) as day_bucket, SUM(total) as revenue, COUNT(*) as cnt')
            ->where('status', Sale::STATUS_PAID)
            ->whereBetween('paid_at', [$rangeStart, $rangeEnd])
            ->groupBy(DB::raw('DATE(paid_at)'))
            ->get()
            ->keyBy('day_bucket');

        $out = [];
        $cursor = $rangeStart->copy()->startOfDay();
        $end = $rangeEnd->copy()->startOfDay();

        while ($cursor->lessThanOrEqualTo($end)) {
            $key = $cursor->toDateString();
            $row = $rows->get($key);
            $out[] = [
                'date' => $key,
                'label' => $cursor->format('d/m'),
                'revenue' => (float) ($row->revenue ?? 0),
                'count' => (int) ($row->cnt ?? 0),
            ];
            $cursor->addDay();
        }

        return $out;
    }

    /**
     * @return array<int,array{name:string,revenue:float,qty:int}>
     */
    private function buildSalesByCategory(): array
    {
        return DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->where('sales.status', Sale::STATUS_PAID)
            ->where('sales.paid_at', '>=', now()->subDays(30))
            ->selectRaw('categories.name as category_name, SUM(sale_items.total) as revenue, SUM(sale_items.qty) as qty')
            ->groupBy('categories.name')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($r) => [
                'name' => (string) ($r->category_name ?? 'Sem categoria'),
                'revenue' => (float) $r->revenue,
                'qty' => (int) $r->qty,
            ])
            ->all();
    }

    /**
     * @return array{0:string,1:Carbon,2:Carbon}
     */
    private function resolvePeriod(Request $request): array
    {
        $period = $request->query('period', 'month');
        if (! in_array($period, self::ALLOWED_PERIODS, true)) {
            $period = 'month';
        }

        if ($period === 'custom') {
            $start = $this->parseDate($request->query('start'));
            $end = $this->parseDate($request->query('end'));

            if (! $start || ! $end) {
                $period = 'month';
            } elseif ($start->greaterThan($end)) {
                [$start, $end] = [$end, $start];
            }

            if ($period === 'custom') {
                return [$period, $start->startOfDay(), $end->endOfDay()];
            }
        }

        $end = now()->endOfDay();
        $start = match ($period) {
            'week' => now()->subDays(6)->startOfDay(),
            '3months' => now()->subMonthsNoOverflow(3)->startOfDay(),
            default => now()->startOfMonth(),
        };

        return [$period, $start, $end];
    }

    private function parseDate(mixed $value): ?Carbon
    {
        if (! is_string($value) || $value === '') {
            return null;
        }
        try {
            return Carbon::parse($value);
        } catch (\Throwable) {
            return null;
        }
    }
}
