<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SaleController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $query = Sale::with(['user', 'items.product'])->latest();

        if ($search) {
            $query->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%");
        }

        return Inertia::render('Sales/Index', [
            'sales' => $query->paginate(15)->withQueryString(),
            'filters' => $request->only(['search']),
        ]);
    }

    public function pos()
    {
        // Load all active products with categories for checkout
        $products = Product::where('is_active', true)
            ->with('category')
            ->orderBy('name')
            ->get();

        $categories = Category::orderBy('name')->get();

        return Inertia::render('POS/Index', [
            'products' => $products,
            'categories' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_name' => 'nullable|string|max:255',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'payment_method' => 'required|string|in:Cash,GCash,PayMaya,Debt',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $customerName = $request->input('customer_name') ?? 'Walk-in';
        $discountInput = $request->input('discount') ?? 0;
        $taxRate = $request->input('tax') ?? 0; // percentage, e.g. 12 for 12% VAT
        $paymentMethod = $request->input('payment_method');
        $itemsInput = $request->input('items');

        if ($paymentMethod === 'Debt') {
            $cleanName = trim($customerName);
            if (!$cleanName || strtolower($cleanName) === 'walk-in' || strtolower($cleanName) === 'walk-in customer') {
                return redirect()->back()->withErrors(['error' => 'A valid Customer Name is required to record this debt.']);
            }
        }

        try {
            $sale = DB::transaction(function () use ($request, $customerName, $discountInput, $taxRate, $paymentMethod, $itemsInput) {
                // Check if there is an existing unpaid debt for the same customer (case insensitive)
                $existingSale = null;
                if ($paymentMethod === 'Debt') {
                    $existingSale = Sale::where('payment_method', 'Debt')
                        ->where('status', 'unpaid')
                        ->whereRaw('LOWER(customer_name) = ?', [strtolower(trim($customerName))])
                        ->first();
                }

                $invoiceNumber = $existingSale 
                    ? $existingSale->invoice_number 
                    : 'JMA-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));

                $totalAmount = 0;
                $saleItemsData = [];

                // 1. Process each item and verify stock
                foreach ($itemsInput as $cartItem) {
                    $product = Product::lockForUpdate()->find($cartItem['product_id']);

                    if (!$product->is_active) {
                        throw new \Exception("Product {$product->name} is no longer active.");
                    }

                    if ($product->stock_quantity < $cartItem['quantity']) {
                        throw new \Exception("Insufficient stock for product {$product->name}. Available: {$product->stock_quantity}, Requested: {$cartItem['quantity']}.");
                    }

                    // Deduct stock
                    $product->decrement('stock_quantity', $cartItem['quantity']);

                    $itemTotal = $product->selling_price * $cartItem['quantity'];
                    $totalAmount += $itemTotal;

                    // Prepare sale item data
                    $saleItemsData[] = [
                        'product_id' => $product->id,
                        'quantity' => $cartItem['quantity'],
                        'cost_price' => $product->cost_price,
                        'selling_price' => $product->selling_price,
                        'total_price' => $itemTotal,
                    ];
                }

                // 2. Calculations
                $taxAmount = ($totalAmount - $discountInput) * ($taxRate / 100);
                if ($taxAmount < 0) $taxAmount = 0;
                
                $grandTotal = $totalAmount - $discountInput + $taxAmount;

                if ($existingSale) {
                    // Update existing sale
                    $existingSale->update([
                        'total_amount' => $existingSale->total_amount + $totalAmount,
                        'discount' => $existingSale->discount + $discountInput,
                        'tax' => $existingSale->tax + $taxAmount,
                        'grand_total' => $existingSale->grand_total + $grandTotal,
                        'notes' => ($existingSale->notes ? $existingSale->notes . "\n" : "") . 
                                   "[Added Debt on " . date('Y-m-d H:i:s') . ": " . 
                                   $request->input('notes') . "]",
                    ]);
                    $sale = $existingSale;
                } else {
                    // 3. Create Sale Record
                    $sale = Sale::create([
                        'invoice_number' => $invoiceNumber,
                        'user_id' => $request->user()->id,
                        'customer_name' => $customerName,
                        'total_amount' => $totalAmount,
                        'discount' => $discountInput,
                        'tax' => $taxAmount,
                        'grand_total' => $grandTotal,
                        'payment_method' => $paymentMethod,
                        'status' => $paymentMethod === 'Debt' ? 'unpaid' : 'completed',
                        'notes' => $request->input('notes'),
                    ]);
                }

                // 4. Create/Update Sale Items and Stock Logs
                foreach ($saleItemsData as $itemData) {
                    if ($existingSale) {
                        // Check if this product already exists in the existing sale items
                        $existingItem = SaleItem::where('sale_id', $existingSale->id)
                            ->where('product_id', $itemData['product_id'])
                            ->first();

                        if ($existingItem) {
                            $existingItem->update([
                                'quantity' => $existingItem->quantity + $itemData['quantity'],
                                'total_price' => $existingItem->total_price + $itemData['total_price'],
                            ]);
                        } else {
                            $itemData['sale_id'] = $existingSale->id;
                            SaleItem::create($itemData);
                        }
                    } else {
                        $itemData['sale_id'] = $sale->id;
                        SaleItem::create($itemData);
                    }

                    StockLog::create([
                        'product_id' => $itemData['product_id'],
                        'user_id' => $request->user()->id,
                        'type' => 'sale',
                        'quantity' => -$itemData['quantity'],
                        'reason' => $existingSale 
                            ? "Additional debt (Invoice: {$invoiceNumber})"
                            : "Sale checkout (Invoice: {$invoiceNumber})",
                    ]);
                }

                return $sale;
            });

            return redirect()->back()->with([
                'success' => 'Transaction completed successfully.',
                'invoice' => $sale->load(['items.product', 'user'])
            ]);

        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function void(Request $request, Sale $sale)
    {
        if ($sale->status === 'voided') {
            return redirect()->back()->withErrors(['error' => 'This sale is already voided.']);
        }

        try {
            DB::transaction(function () use ($sale, $request) {
                // Update sale status
                $sale->update(['status' => 'voided']);

                // Restore stock for all products and create logs
                foreach ($sale->items as $item) {
                    $product = Product::find($item->product_id);
                    if ($product) {
                        $product->increment('stock_quantity', $item->quantity);

                        StockLog::create([
                            'product_id' => $product->id,
                            'user_id' => $request->user()->id,
                            'type' => 'return',
                            'quantity' => $item->quantity,
                            'reason' => "Restored stock from voided invoice: {$sale->invoice_number}",
                        ]);
                    }
                }
            });

            return redirect()->back()->with('success', 'Sale voided and stock restored successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function update(Request $request, Sale $sale)
    {
        $request->validate([
            'customer_name' => 'nullable|string|max:255',
            'payment_method' => 'required|string|in:Cash,Card,GCash,PayMaya',
            'discount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        try {
            DB::transaction(function () use ($sale, $request) {
                $customerName = $request->input('customer_name') ?? 'Walk-in';
                $paymentMethod = $request->input('payment_method');
                $discount = $request->input('discount') ?? 0;
                $notes = $request->input('notes');

                $totalAmount = $sale->total_amount;
                
                // Retrieve the original tax rate
                $taxRate = 12; // Default to 12%
                $denominator = $totalAmount - $sale->discount;
                if ($denominator > 0) {
                    $taxRate = ($sale->tax / $denominator) * 100;
                }

                $newTax = ($totalAmount - $discount) * ($taxRate / 100);
                if ($newTax < 0) $newTax = 0;

                $newGrandTotal = $totalAmount - $discount + $newTax;

                $sale->update([
                    'customer_name' => $customerName,
                    'payment_method' => $paymentMethod,
                    'discount' => $discount,
                    'tax' => $newTax,
                    'grand_total' => $newGrandTotal,
                    'notes' => $notes,
                ]);
            });

            return redirect()->back()->with('success', 'Sale updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:sales,id',
        ]);

        $ids = $request->input('ids');

        try {
            DB::transaction(function () use ($ids, $request) {
                $sales = Sale::whereIn('id', $ids)->with('items')->get();

                foreach ($sales as $sale) {
                    // Restore stock if the sale was completed
                    if ($sale->status === 'completed') {
                        foreach ($sale->items as $item) {
                            $product = Product::find($item->product_id);
                            if ($product) {
                                $product->increment('stock_quantity', $item->quantity);
                                
                                // Log the stock restoration
                                StockLog::create([
                                    'product_id' => $product->id,
                                    'user_id' => $request->user()->id,
                                    'type' => 'adjustment',
                                    'quantity' => $item->quantity,
                                    'reason' => "Deleted invoice (bulk): {$sale->invoice_number} (Stock restored)",
                                ]);
                            }
                        }
                    }
                    
                    // Delete sale items first
                    $sale->items()->delete();
                    // Delete the sale record
                    $sale->delete();
                }
            });

            return redirect()->back()->with('success', 'Selected sales deleted and stock restored successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy(Request $request, Sale $sale)
    {
        try {
            DB::transaction(function () use ($sale, $request) {
                // Restore stock if the sale was completed
                if ($sale->status === 'completed') {
                    foreach ($sale->items as $item) {
                        $product = Product::find($item->product_id);
                        if ($product) {
                            $product->increment('stock_quantity', $item->quantity);
                            
                            // Log the stock restoration
                            StockLog::create([
                                'product_id' => $product->id,
                                'user_id' => $request->user()->id,
                                'type' => 'adjustment',
                                'quantity' => $item->quantity,
                                'reason' => "Deleted invoice: {$sale->invoice_number} (Stock restored)",
                            ]);
                        }
                    }
                }
                
                // Delete sale items first
                $sale->items()->delete();
                // Delete the sale record
                $sale->delete();
            });

            return redirect()->back()->with('success', 'Sale deleted and stock restored successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function debts(Request $request)
    {
        $search = $request->input('search');
        $query = Sale::with(['user', 'items.product'])
            ->where('payment_method', 'Debt')
            ->where('status', 'unpaid')
            ->latest();

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhere('customer_name', 'like', "%{$search}%");
            });
        }

        $totalOutstanding = Sale::where('payment_method', 'Debt')->where('status', 'unpaid')->sum('grand_total');
        $debtorsCount = Sale::where('payment_method', 'Debt')->where('status', 'unpaid')->distinct('customer_name')->count('customer_name');
        $oldestDebt = Sale::where('payment_method', 'Debt')->where('status', 'unpaid')->oldest()->first();
        $oldestDebtDate = $oldestDebt ? $oldestDebt->created_at : null;

        return Inertia::render('Debts/Index', [
            'debts' => $query->paginate(15)->withQueryString(),
            'filters' => $request->only(['search']),
            'metrics' => [
                'total_outstanding' => floatval($totalOutstanding),
                'debtors_count' => intval($debtorsCount),
                'oldest_debt_date' => $oldestDebtDate ? $oldestDebtDate->toIso8601String() : null,
            ]
        ]);
    }

    public function payDebt(Request $request, Sale $sale)
    {
        if ($sale->payment_method !== 'Debt') {
            return redirect()->back()->withErrors(['error' => 'This sale is not registered as a debt.']);
        }

        if ($sale->status !== 'unpaid') {
            return redirect()->back()->withErrors(['error' => 'This debt is already paid.']);
        }

        $request->validate([
            'payment_method' => 'required|string|in:Cash,GCash,PayMaya',
        ]);

        try {
            DB::transaction(function () use ($sale, $request) {
                $sale->update([
                    'status' => 'completed',
                    'payment_method' => $request->input('payment_method'),
                    'notes' => ($sale->notes ? $sale->notes . "\n" : "") . "[Paid on " . date('Y-m-d H:i:s') . ' via ' . $request->input('payment_method') . ']',
                ]);
            });

            return redirect()->back()->with('success', 'Debt has been successfully marked as paid.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
