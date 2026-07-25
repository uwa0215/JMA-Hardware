<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();

        // 1. Core Metrics (excluding voided sales)
        $todaySales = Sale::where('status', 'completed')
            ->whereDate('created_at', $today)
            ->sum('grand_total');

        $monthlySales = Sale::where('status', 'completed')
            ->where('created_at', '>=', $startOfMonth)
            ->sum('grand_total');

        $activeProductsCount = Product::where('is_active', true)->count();
        
        $lowStockCount = Product::where('is_active', true)
            ->whereRaw('stock_quantity <= reorder_level')
            ->count();

        // 2. Profit Calculations
        // Gross Profit = Sum of (selling_price - cost_price) * quantity for all sale items
        $todayProfit = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.status', 'completed')
            ->whereDate('sales.created_at', $today)
            ->selectRaw('SUM((sale_items.selling_price - sale_items.cost_price) * sale_items.quantity) as profit')
            ->first()->profit ?? 0;

        $monthlyProfit = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->where('sales.status', 'completed')
            ->where('sales.created_at', '>=', $startOfMonth)
            ->selectRaw('SUM((sale_items.selling_price - sale_items.cost_price) * sale_items.quantity) as profit')
            ->first()->profit ?? 0;

        // 3. Low Stock Products list
        $lowStockProducts = Product::where('is_active', true)
            ->whereRaw('stock_quantity <= reorder_level')
            ->with('category')
            ->orderBy('stock_quantity')
            ->take(5)
            ->get();

        // 4. Best Selling Products (top 5)
        $bestSellers = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.status', 'completed')
            ->select('products.name', 'products.unit', DB::raw('SUM(sale_items.quantity) as total_qty'), DB::raw('SUM(sale_items.total_price) as total_sales'))
            ->groupBy('products.id', 'products.name', 'products.unit')
            ->orderByDesc('total_qty')
            ->take(5)
            ->get();

        // 5. Sales Trend (last 7 days)
        $salesTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $total = Sale::where('status', 'completed')
                ->whereDate('created_at', $date->toDateString())
                ->sum('grand_total');
            
            $salesTrend[] = [
                'day' => $date->format('D'),
                'date' => $date->format('M d'),
                'total' => (float)$total,
            ];
        }

        // 6. Recent Sales
        $recentSales = Sale::with('user')
            ->latest()
            ->take(5)
            ->get();

        // 7. Daily Sales List (all sales made today)
        $todaySalesList = Sale::with(['user', 'items.product'])
            ->whereDate('created_at', $today)
            ->latest()
            ->get();
 
        return Inertia::render('Dashboard', [
            'metrics' => [
                'todaySales' => (float)$todaySales,
                'monthlySales' => (float)$monthlySales,
                'todayProfit' => (float)$todayProfit,
                'monthlyProfit' => (float)$monthlyProfit,
                'activeProductsCount' => $activeProductsCount,
                'lowStockCount' => $lowStockCount,
            ],
            'lowStockProducts' => $lowStockProducts,
            'bestSellers' => $bestSellers,
            'salesTrend' => $salesTrend,
            'recentSales' => $recentSales,
            'todaySalesList' => $todaySalesList,
        ]);
    }
}
