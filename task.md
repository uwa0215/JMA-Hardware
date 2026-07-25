# Task List - Hardware Store Sales and Stock System

- [x] 1. Project Initialization & System Config
  - [x] Copy `composer.phar` from `Lemon-restaurant-main` to workspace
  - [x] Enable `pdo_mysql` and `mysqli` extensions in `php.ini`
  - [x] Initialize Laravel project: `php composer.phar create-project laravel/laravel .`
  - [x] Install Laravel Breeze: `php composer.phar require laravel/breeze --dev`
  - [x] Run Breeze React install: `php artisan breeze:install react`
  - [/] Add custom CSS keyframes and classes for animations in app.css
  - [ ] Add state variables and handlers in POS/Index.tsx

- [x] 2. Database & Models Setup
  - [x] Create Migrations (Categories, Products, Suppliers, Sales, SaleItems, StockLogs)
  - [x] Create Models with Relationships
  - [x] Setup Seeders with realistic hardware items (screws, hammers, pipes, wire, paints)
  - [x] Verify migration using SQLite or MySQL configuration

- [x] 3. Backend Controllers & Routes
  - [x] Create `CategoryController`
  - [x] Create `ProductController` (with stock adjustment logic)
  - [x] Create `SupplierController`
  - [x] Create `SaleController` (atomic transaction logic for checkouts and voiding)
  - [x] Create `DashboardController` (reports and metrics)
  - [x] Register routes in `routes/web.php`

- [x] 4. Frontend React Views (Inertia.js)
  - [x] Main Layout & Navigation updates
  - [x] Dashboard View (with charts and stock alerts)
  - [x] Product Inventory View (with add/edit and stock-in modals)
  - [x] POS Checkout View (interactive cart, cash-change calculator, search)
  - [x] Sales History View (invoice detail, void button)
  - [x] Suppliers Management View

- [x] 5. Testing & Verification
  - [x] Create test case for POS checkout stock deduction
  - [x] Run tests
  - [x] Start server and run Vite to verify all pages manually

- [x] 6. Performance Optimization
  - [x] Add regions configuration to vercel.json
  - [x] Optimize DashboardController queries

