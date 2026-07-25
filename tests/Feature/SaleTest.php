<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Models\Sale;
use App\Models\StockLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleTest extends TestCase
{
    use RefreshDatabase;

    public function test_checkout_saves_transaction_and_deducts_stock(): void
    {
        // 1. Arrange: Create user, category, and product
        $user = User::create([
            'name' => 'Cashier User',
            'email' => 'cashier@test.com',
            'password' => bcrypt('password'),
        ]);

        $category = Category::create([
            'name' => 'Plumbing',
            'description' => 'PVC Pipes and fittings',
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'sku' => 'PL-PVC-001',
            'name' => 'PVC Pipe 1/2"',
            'description' => '10ft blue PVC pipe',
            'cost_price' => 50.00,
            'selling_price' => 80.00,
            'stock_quantity' => 10,
            'reorder_level' => 2,
            'unit' => 'pcs',
            'is_active' => true,
        ]);

        // 2. Act: Send authenticated checkout request
        $response = $this->actingAs($user)
            ->post('/sales', [
                'customer_name' => 'Test Customer',
                'discount' => 10,
                'tax' => 12,
                'payment_method' => 'Cash',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 3,
                    ]
                ]
            ]);

        // 3. Assert: Verify redirections / database records
        $response->assertSessionHasNoErrors();
        
        $this->assertDatabaseHas('sales', [
            'customer_name' => 'Test Customer',
            'total_amount' => 240.00, // 80.00 * 3
            'discount' => 10.00,
            'grand_total' => 257.60, // (240 - 10) * 1.12 = 257.60
            'payment_method' => 'Cash',
            'status' => 'completed',
        ]);

        // Verify product stock decremented from 10 to 7
        $this->assertEquals(7, $product->fresh()->stock_quantity);

        // Verify stock log was created with negative quantity
        $this->assertDatabaseHas('stock_logs', [
            'product_id' => $product->id,
            'type' => 'sale',
            'quantity' => -3,
        ]);
    }

    public function test_sale_can_be_updated_recalculates_totals(): void
    {
        $user = User::create([
            'name' => 'Cashier User',
            'email' => 'cashier@test.com',
            'password' => bcrypt('password'),
        ]);

        $category = Category::create(['name' => 'Plumbing']);
        $product = Product::create([
            'category_id' => $category->id,
            'sku' => 'PL-PVC-001',
            'name' => 'PVC Pipe 1/2"',
            'cost_price' => 50.00,
            'selling_price' => 80.00,
            'stock_quantity' => 10,
            'reorder_level' => 2,
            'unit' => 'pcs',
            'is_active' => true,
        ]);

        // Create a completed sale first via API
        $this->actingAs($user)->post('/sales', [
            'customer_name' => 'Original Customer',
            'discount' => 10,
            'tax' => 12,
            'payment_method' => 'Cash',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2]
            ]
        ]);

        $sale = Sale::first();

        // Update the sale
        $response = $this->actingAs($user)->patch("/sales/{$sale->id}", [
            'customer_name' => 'Updated Customer',
            'payment_method' => 'GCash',
            'discount' => 20,
            'notes' => 'Some update notes',
        ]);

        $response->assertSessionHasNoErrors();
        
        // Assert updated values
        // Original selling_price = 80 * 2 = 160. New discount = 20. Tax = (160 - 20) * 12% = 16.8. Grand total = 140 + 16.8 = 156.8
        $this->assertDatabaseHas('sales', [
            'id' => $sale->id,
            'customer_name' => 'Updated Customer',
            'payment_method' => 'GCash',
            'discount' => 20.00,
            'tax' => 16.80,
            'grand_total' => 156.80,
            'notes' => 'Some update notes',
        ]);
    }

    public function test_sale_can_be_deleted_restores_stock_and_creates_log(): void
    {
        $user = User::create([
            'name' => 'Cashier User',
            'email' => 'cashier@test.com',
            'password' => bcrypt('password'),
        ]);

        $category = Category::create(['name' => 'Plumbing']);
        $product = Product::create([
            'category_id' => $category->id,
            'sku' => 'PL-PVC-001',
            'name' => 'PVC Pipe 1/2"',
            'cost_price' => 50.00,
            'selling_price' => 80.00,
            'stock_quantity' => 10,
            'reorder_level' => 2,
            'unit' => 'pcs',
            'is_active' => true,
        ]);

        // Create a completed sale first via API (stock will decrement from 10 to 8)
        $this->actingAs($user)->post('/sales', [
            'customer_name' => 'Original Customer',
            'discount' => 10,
            'tax' => 12,
            'payment_method' => 'Cash',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2]
            ]
        ]);

        $this->assertEquals(8, $product->fresh()->stock_quantity);
        $sale = Sale::first();

        // Delete the sale
        $response = $this->actingAs($user)->delete("/sales/{$sale->id}");

        $response->assertSessionHasNoErrors();

        // Assert sale and items are deleted
        $this->assertDatabaseMissing('sales', ['id' => $sale->id]);
        $this->assertDatabaseMissing('sale_items', ['sale_id' => $sale->id]);

        // Verify product stock is restored back to 10
        $this->assertEquals(10, $product->fresh()->stock_quantity);

        // Verify stock restoration log was created
        $this->assertDatabaseHas('stock_logs', [
            'product_id' => $product->id,
            'type' => 'adjustment',
            'quantity' => 2,
        ]);
    }

    public function test_sales_can_be_bulk_deleted_restores_stock_and_creates_logs(): void
    {
        $user = User::create([
            'name' => 'Cashier User',
            'email' => 'cashier@test.com',
            'password' => bcrypt('password'),
        ]);

        $category = Category::create(['name' => 'Plumbing']);
        $product = Product::create([
            'category_id' => $category->id,
            'sku' => 'PL-PVC-001',
            'name' => 'PVC Pipe 1/2"',
            'cost_price' => 50.00,
            'selling_price' => 80.00,
            'stock_quantity' => 10,
            'reorder_level' => 2,
            'unit' => 'pcs',
            'is_active' => true,
        ]);

        // Create 2 sales
        $this->actingAs($user)->post('/sales', [
            'customer_name' => 'Customer A',
            'discount' => 0,
            'tax' => 12,
            'payment_method' => 'Cash',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2]
            ]
        ]);

        $this->actingAs($user)->post('/sales', [
            'customer_name' => 'Customer B',
            'discount' => 0,
            'tax' => 12,
            'payment_method' => 'GCash',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 3]
            ]
        ]);

        // Stock should be 10 - 2 - 3 = 5
        $this->assertEquals(5, $product->fresh()->stock_quantity);

        $sales = Sale::all();
        $this->assertCount(2, $sales);

        // Bulk delete both sales
        $response = $this->actingAs($user)->delete('/sales/bulk', [
            'ids' => $sales->pluck('id')->toArray()
        ]);

        $response->assertSessionHasNoErrors();

        // Assert sales are deleted
        $this->assertCount(0, Sale::all());
        $this->assertDatabaseMissing('sales', ['customer_name' => 'Customer A']);
        $this->assertDatabaseMissing('sales', ['customer_name' => 'Customer B']);

        // Verify product stock is restored back to 10
        $this->assertEquals(10, $product->fresh()->stock_quantity);

        // Verify stock restoration logs were created for both
        $this->assertDatabaseHas('stock_logs', [
            'product_id' => $product->id,
            'type' => 'adjustment',
            'quantity' => 2,
        ]);
        $this->assertDatabaseHas('stock_logs', [
            'product_id' => $product->id,
            'type' => 'adjustment',
            'quantity' => 3,
        ]);
    }

    public function test_checkout_debt_saves_unpaid_transaction_and_requires_customer_name(): void
    {
        $user = User::create([
            'name' => 'Cashier User',
            'email' => 'cashier@test.com',
            'password' => bcrypt('password'),
        ]);

        $category = Category::create(['name' => 'Plumbing']);
        $product = Product::create([
            'category_id' => $category->id,
            'sku' => 'PL-PVC-001',
            'name' => 'PVC Pipe 1/2"',
            'cost_price' => 50.00,
            'selling_price' => 80.00,
            'stock_quantity' => 10,
            'reorder_level' => 2,
            'unit' => 'pcs',
            'is_active' => true,
        ]);

        // Act 1: Checkout debt with customer name
        $response = $this->actingAs($user)
            ->post('/sales', [
                'customer_name' => 'Uncle John',
                'discount' => 0,
                'tax' => 12,
                'payment_method' => 'Debt',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 2,
                    ]
                ]
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('sales', [
            'customer_name' => 'Uncle John',
            'payment_method' => 'Debt',
            'status' => 'unpaid',
        ]);

        // Act 2: Attempt checkout debt with default Walk-in name
        $response2 = $this->actingAs($user)
            ->post('/sales', [
                'customer_name' => 'Walk-in',
                'discount' => 0,
                'tax' => 12,
                'payment_method' => 'Debt',
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 2,
                    ]
                ]
            ]);

        $response2->assertSessionHasErrors(['error']);
    }

    public function test_settle_debt_updates_status_and_payment_method(): void
    {
        $user = User::create([
            'name' => 'Cashier User',
            'email' => 'cashier@test.com',
            'password' => bcrypt('password'),
        ]);

        $category = Category::create(['name' => 'Plumbing']);
        $product = Product::create([
            'category_id' => $category->id,
            'sku' => 'PL-PVC-001',
            'name' => 'PVC Pipe 1/2"',
            'cost_price' => 50.00,
            'selling_price' => 80.00,
            'stock_quantity' => 10,
            'reorder_level' => 2,
            'unit' => 'pcs',
            'is_active' => true,
        ]);

        // Create an unpaid debt
        $sale = Sale::create([
            'invoice_number' => 'JMA-TEST-DEBT',
            'user_id' => $user->id,
            'customer_name' => 'Uncle John',
            'total_amount' => 160.00,
            'discount' => 0,
            'tax' => 19.20,
            'grand_total' => 179.20,
            'payment_method' => 'Debt',
            'status' => 'unpaid',
        ]);

        // Settle the debt
        $response = $this->actingAs($user)
            ->post("/sales/{$sale->id}/pay-debt", [
                'payment_method' => 'GCash',
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('sales', [
            'id' => $sale->id,
            'payment_method' => 'GCash',
            'status' => 'completed',
        ]);
    }

    public function test_debts_merge_for_same_customer(): void
    {
        $user = User::create([
            'name' => 'Cashier User',
            'email' => 'cashier@test.com',
            'password' => bcrypt('password'),
        ]);

        $category = Category::create(['name' => 'Plumbing']);
        $product = Product::create([
            'category_id' => $category->id,
            'sku' => 'PL-PVC-001',
            'name' => 'PVC Pipe 1/2"',
            'cost_price' => 50.00,
            'selling_price' => 80.00,
            'stock_quantity' => 10,
            'reorder_level' => 2,
            'unit' => 'pcs',
            'is_active' => true,
        ]);

        // 1. Act: checkout first debt for Uncle John (quantity 2, grand total 179.20)
        $this->actingAs($user)->post('/sales', [
            'customer_name' => 'Uncle John',
            'discount' => 0,
            'tax' => 12,
            'payment_method' => 'Debt',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 2]
            ]
        ]);

        $this->assertDatabaseCount('sales', 1);
        $this->assertDatabaseHas('sales', [
            'customer_name' => 'Uncle John',
            'grand_total' => 179.20,
            'status' => 'unpaid',
        ]);

        // 2. Act: checkout second debt for Uncle John (quantity 1, grand total 89.60)
        $this->actingAs($user)->post('/sales', [
            'customer_name' => 'Uncle John',
            'discount' => 0,
            'tax' => 12,
            'payment_method' => 'Debt',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1]
            ]
        ]);

        // 3. Assert: Verify that NO new sale was created, but the existing one was updated
        $this->assertDatabaseCount('sales', 1);
        $this->assertDatabaseHas('sales', [
            'customer_name' => 'Uncle John',
            'total_amount' => 240.00, // (2 + 1) * 80
            'grand_total' => 268.80,  // 240 * 1.12 = 268.80
            'status' => 'unpaid',
        ]);

        // Verify the sale item quantity was aggregated
        $sale = Sale::first();
        $this->assertCount(1, $sale->items);
        $this->assertEquals(3, $sale->items->first()->quantity);

        // Verify stock log was created for both sales
        $this->assertEquals(7, $product->fresh()->stock_quantity); // 10 - 2 - 1 = 7
    }
}
