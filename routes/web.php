<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SaleController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/setup-database', function () {
    $log = [];
    
    // Step 1: Check current schema state
    try {
        $schemas = \DB::select("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'public'");
        $log[] = 'Step 1 - Public schema exists: ' . (count($schemas) > 0 ? 'YES' : 'NO');
    } catch (\Exception $e) {
        $log[] = 'Step 1 FAILED: ' . $e->getMessage();
    }
    
    // Step 2: Ensure public schema exists with proper permissions
    try {
        $pdo = \DB::connection()->getPdo();
        $pdo->exec('CREATE SCHEMA IF NOT EXISTS public');
        $log[] = 'Step 2 - Create schema: OK';
    } catch (\Exception $e) {
        $log[] = 'Step 2 FAILED: ' . $e->getMessage();
    }
    
    // Step 3: Test basic table creation
    try {
        $pdo = \DB::connection()->getPdo();
        $pdo->exec('DROP TABLE IF EXISTS _test_connectivity');
        $pdo->exec('CREATE TABLE _test_connectivity (id serial primary key, name text)');
        $pdo->exec('DROP TABLE _test_connectivity');
        $log[] = 'Step 3 - Table creation test: OK';
    } catch (\Exception $e) {
        $log[] = 'Step 3 FAILED: ' . $e->getMessage();
    }
    
    // Step 4: Drop all existing tables
    try {
        $tables = \DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
        $log[] = 'Step 4 - Found ' . count($tables) . ' existing tables';
        foreach ($tables as $table) {
            \DB::connection()->getPdo()->exec("DROP TABLE IF EXISTS \"{$table->tablename}\" CASCADE");
        }
        $log[] = 'Step 4 - All tables dropped: OK';
    } catch (\Exception $e) {
        $log[] = 'Step 4 FAILED: ' . $e->getMessage();
    }
    
    // Step 5: Reconnect to clear connection state
    try {
        \DB::reconnect();
        $log[] = 'Step 5 - Reconnect: OK';
    } catch (\Exception $e) {
        $log[] = 'Step 5 FAILED: ' . $e->getMessage();
    }
    
    // Step 6: Run migrations
    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
        $log[] = 'Step 6 - Migrations: OK';
        $log[] = \Illuminate\Support\Facades\Artisan::output();
    } catch (\Exception $e) {
        $log[] = 'Step 6 FAILED: ' . $e->getMessage();
    }
    
    // Step 7: Seed database
    try {
        \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
        $log[] = 'Step 7 - Seeding: OK';
        $log[] = \Illuminate\Support\Facades\Artisan::output();
    } catch (\Exception $e) {
        $log[] = 'Step 7 FAILED: ' . $e->getMessage();
    }
    
    return '<pre>' . implode("\n", $log) . '</pre>';
});

Route::get('/debug-db', function () {
    $pgsql = config('database.connections.pgsql');
    return [
        'DB_CONNECTION' => config('database.default'),
        'DATABASE_URL_SET' => env('DATABASE_URL') ? 'YES' : 'NO',
        'POSTGRES_URL_SET' => env('POSTGRES_URL') ? 'YES' : 'NO',
        'DB_URL_SET' => env('DB_URL') ? 'YES' : 'NO',
        'RESOLVED_HOST' => $pgsql['host'] ?? 'not set',
        'RESOLVED_PORT' => $pgsql['port'] ?? 'not set',
        'RESOLVED_DATABASE' => $pgsql['database'] ?? 'not set',
        'RESOLVED_USERNAME' => $pgsql['username'] ?? 'not set',
        'RESOLVED_SSLMODE' => $pgsql['sslmode'] ?? 'not set',
        'PGOPTIONS' => getenv('PGOPTIONS') ?: 'not set',
    ];
});

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Products
    Route::get('/products', [ProductController::class, 'index'])->name('products.index');
    Route::post('/products', [ProductController::class, 'store'])->name('products.store');
    Route::patch('/products/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');
    Route::post('/products/{product}/adjust-stock', [ProductController::class, 'adjustStock'])->name('products.adjust-stock');

    // Categories
    Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::patch('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    // Suppliers
    Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
    Route::post('/suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
    Route::patch('/suppliers/{supplier}', [SupplierController::class, 'update'])->name('suppliers.update');
    Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');

    // Sales & POS
    Route::get('/pos', [SaleController::class, 'pos'])->name('pos.index');
    Route::get('/sales', [SaleController::class, 'index'])->name('sales.index');
    Route::post('/sales', [SaleController::class, 'store'])->name('sales.store');
    Route::patch('/sales/{sale}', [SaleController::class, 'update'])->name('sales.update');
    Route::delete('/sales/bulk', [SaleController::class, 'bulkDestroy'])->name('sales.bulk-destroy');
    Route::delete('/sales/{sale}', [SaleController::class, 'destroy'])->name('sales.destroy');
    Route::post('/sales/{sale}/void', [SaleController::class, 'void'])->name('sales.void');
    Route::get('/debts', [SaleController::class, 'debts'])->name('debts.index');
    Route::post('/sales/{sale}/pay-debt', [SaleController::class, 'payDebt'])->name('sales.pay-debt');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
