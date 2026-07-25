<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\StockLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $categoryId = $request->input('category_id');
        $status = $request->input('status'); // 'all', 'active', 'inactive', 'low_stock'

        $query = Product::with('category')->latest();

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        } elseif ($status === 'low_stock') {
            $query->where('is_active', true)
                  ->whereRaw('stock_quantity <= reorder_level');
        }

        return Inertia::render('Products/Index', [
            'products' => $query->paginate(15)->withQueryString(),
            'categories' => Category::orderBy('name')->get(),
            'suppliers' => Supplier::orderBy('name')->get(),
            'filters' => $request->only(['search', 'category_id', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'sku' => 'required|string|max:255|unique:products,sku',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'reorder_level' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'supplier_id' => 'nullable|exists:suppliers,id', // Optional supplier for initial stock log
        ]);

        DB::transaction(function () use ($validated, $request) {
            $product = Product::create($validated);

            if ($product->stock_quantity > 0) {
                StockLog::create([
                    'product_id' => $product->id,
                    'user_id' => $request->user()->id,
                    'supplier_id' => $validated['supplier_id'] ?? null,
                    'type' => 'stock-in',
                    'quantity' => $product->stock_quantity,
                    'reason' => 'Initial stock on product creation',
                ]);
            }
        });

        return redirect()->back()->with('success', 'Product created successfully.');
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'sku' => 'required|string|max:255|unique:products,sku,' . $product->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'reorder_level' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'is_active' => 'required|boolean',
        ]);

        $product->update($validated);

        return redirect()->back()->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->back()->with('success', 'Product deleted successfully.');
    }

    public function adjustStock(Request $request, Product $product)
    {
        $validated = $request->validate([
            'type' => 'required|in:stock-in,stock-out,adjustment',
            'quantity' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:255',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        DB::transaction(function () use ($validated, $product, $request) {
            $qtyChange = $validated['quantity'];
            $type = $validated['type'];

            if ($type === 'stock-out') {
                $product->decrement('stock_quantity', $qtyChange);
                $logQty = -$qtyChange;
            } else if ($type === 'stock-in') {
                $product->increment('stock_quantity', $qtyChange);
                $logQty = $qtyChange;
            } else {
                // General adjustment - reason will explain it. Can be positive or negative
                // We'll treat it as stock-in or stock-out depending on user input. For simplicity,
                // we have a separate field to specify adjustment value: if adjustment is positive, increment; if negative, decrement.
                // But the form sends positive quantity. We will ask if it is adding or subtracting.
                // Let's assume adjustment increments stock. If they need to decrement, they select stock-out.
                $product->increment('stock_quantity', $qtyChange);
                $logQty = $qtyChange;
            }

            StockLog::create([
                'product_id' => $product->id,
                'user_id' => $request->user()->id,
                'supplier_id' => $validated['supplier_id'] ?? null,
                'type' => $type,
                'quantity' => $logQty,
                'reason' => $validated['reason'] ?? 'Manual stock adjustment',
            ]);
        });

        return redirect()->back()->with('success', 'Stock adjusted successfully.');
    }
}
