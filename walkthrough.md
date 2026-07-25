# Walkthrough - Hardware Store Sales & Stock System

We have completed the implementation of the **JMA System**—a premium, fully functional Sales and Stock Monitoring web application for your Hardware Store.

---

## What We Accomplished

Here is a summary of the systems and interfaces created:

### 1. System Scaffolding & Config
- Copied and utilized `composer.phar` to initialize the project using Laravel 11.
- Enabled `pdo_mysql` and `mysqli` extensions in the system's `php.ini` file for full MySQL compatibility.
- Scaffolded Laravel Breeze with React + Inertia + Tailwind CSS + TypeScript.
- Set up SQLite as a zero-configuration default for local developer speed while providing full support for MySQL switching.

### 2. Database Design & Models
- Built 6 main tables with foreign key constraints:
  - `categories`: Groups items (e.g. Plumbing, Electrical, Power Tools).
  - `products`: Tracks SKU, pricing (cost & selling), min-reorder alert level, stock counts.
  - `suppliers`: Supplier directory.
  - `stock_logs`: Complete audit history of stock adjustments (in, out, adjustment, sales, returns).
  - `sales`: Sales header details (invoice numbers, discount, tax, payment method, cashier).
  - `sale_items`: Records product state (cost and selling price at purchase time) to calculate profit accurately.
- Seeded the database with 15+ realistic hardware products, categories, suppliers, and default user roles:
  - **Admin**: `admin@jma.com` (password: `password`)
  - **Cashier**: `cashier@jma.com` (password: `password`)

### 3. Backend Controllers & POS Engine
- **DashboardController**: Aggregates today's/monthly sales & profits (selling price minus cost price), active product counts, low stock alerts, 7-day sales trends, and top selling products.
- **ProductController**: Handles listing, searching, pagination, CRUD, and manual stock log adjustment (Stock In/Stock Out).
- **SaleController**: 
  - Manages POS checkout using atomic database transactions (`DB::transaction`) to guarantee data integrity.
  - Validates stock quantities before completing a sale to prevent negative inventory.
  - Manages transaction voiding, which reverses a transaction and restores items back to the product's inventory automatically.

### 4. Interactive Frontend (React + Tailwind CSS + Lucide Icons)
- **POS Screen (`POS/Index.tsx`)**:
  - Interactive split pane: Left catalog grid with search and category filter tabs; Right checkout summary.
  - Quantity increment/decrement buttons, cash discount field, 12% VAT calculations.
  - Payment method selectors (Cash, Card, GCash, PayMaya).
  - Live change calculator when cash is received.
  - Web Audio API synthesizer for interactive audio cues on cart actions, warning alerts, and checkout success.
  - A receipt-style checkout completion modal.
  - **Proceed & Record Sale Action**: Added a clear, responsive "Proceed & Complete Checkout" button at the bottom of the checkout pane. The layout was optimized using `grid-rows-[1fr]` and `min-h-0` on columns to prevent container height overflow, ensuring the checkout button is always visible and interactive across different monitor sizes.
- **Dashboard (`Dashboard.tsx`)**:
  - Four premium metrics cards (Today's Sales, Today's Profit, Monthly Sales, Active Items).
  - A custom responsive SVG Line Chart mapping the 7-day sales trend with smooth hover tooltips.
  - Low-stock warning watchlist with alert badges for items below threshold.
  - Top sellers chart and recent sales logger.
  - **Daily Sales Log**: Added a full-width daily transaction log showing the date, time, customer, cashier, payment details, and inline purchased item lists (with quantities) for all sales completed today.
    - **Edit Details**: Allows users to edit the customer name, payment method, discount, and notes via an interactive modal (recalculating the 12% VAT and grand totals automatically on the backend).
    - **Delete & Revert Stock**: Allows users to delete a transaction log. This performs a database delete, automatically increments the product stock counts back to restore inventory, and records an adjustment log in the system.
- **Inventory (`Products/Index.tsx`)**:
  - Full catalog listing with pagination, search, and status sorting (active, inactive, low stock).
  - Modals to create products, edit details, or apply quick stock adjustments.
- **Other Pages**:
  - **Categories** & **Suppliers** indices with grid cards and CRUD actions.
  - Redesigned **Layout (`AuthenticatedLayout.tsx`)** with a premium dark slate sidebar navigation.

---

## Verification Results

### Automated Tests
We wrote a comprehensive integration test case [SaleTest.php](file:///C:/Users/Personal%20PC/Desktop/JMA%20System/tests/Feature/SaleTest.php) validating that:
1. POS checkout successfully registers the sale.
2. Deducts the correct stock counts from the inventory.
3. Automatically writes audit records into the `stock_logs` database.

We ran all test cases (including Breeze auth tests):
```bash
php artisan test
```
**Results**:
- **Status**: Passed
- **Tests**: 26 / 26
- **Assertions**: 65 / 65
- **Build Status**: Vite compiled successfully in 1.53s!

---

## How to Run locally

Follow these quick commands to start the JMA Hardware Store system:

1. **Start the PHP server**:
   ```bash
   php artisan serve
   ```
2. **Start the Vite asset server**:
   ```bash
   npm run dev
   ```
3. Open your browser to the local URL (usually `http://localhost:8000`).
4. **Log in** using:
   - Email: `admin@jma.com` (or `cashier@jma.com`)
   - Password: `password`
