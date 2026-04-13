<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\Warranty;
use App\Services\AlertService;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(AlertService $alerts): Response
    {
        $today = today();
        $monthStart = now()->startOfMonth();

        $salesToday = Sale::paid()->today()->sum('total');
        $salesTodayCount = Sale::paid()->today()->count();
        $salesMonth = Sale::paid()->where('paid_at', '>=', $monthStart)->sum('total');

        $topProducts = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.status', Sale::STATUS_PAID)
            ->where('sales.paid_at', '>=', now()->subDays(30))
            ->selectRaw('sale_items.product_name, sale_items.product_sku, SUM(sale_items.qty) as qty_sold, SUM(sale_items.total) as revenue')
            ->groupBy('sale_items.product_name', 'sale_items.product_sku')
            ->orderByDesc('qty_sold')
            ->limit(5)
            ->get();

        $lowStock = Product::active()->lowStock()
            ->select('id', 'name', 'sku', 'stock_qty', 'min_stock_qty')
            ->orderBy('stock_qty')
            ->limit(10)
            ->get();

        $expiringWarranties = Warranty::nearExpiry()
            ->with(['product:id,name', 'customer:id,name,phone,whatsapp'])
            ->orderBy('ends_at')
            ->limit(10)
            ->get();

        return Inertia::render('Dashboard', [
            'metrics' => [
                'sales_today' => (float) $salesToday,
                'sales_today_count' => $salesTodayCount,
                'sales_month' => (float) $salesMonth,
            ],
            'topProducts' => $topProducts,
            'lowStock' => $lowStock,
            'expiringWarranties' => $expiringWarranties,
            'alerts' => $alerts->summary(),
        ]);
    }
}
