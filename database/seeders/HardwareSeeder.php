<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use App\Models\StockLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class HardwareSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@jma.com',
            'password' => Hash::make('Admin123'),
        ]);

        $cashier = User::create([
            'name' => 'JMA Cashier',
            'email' => 'cashier@jma.com',
            'password' => Hash::make('password'),
        ]);

        // 2. Seed Suppliers
        $suppliers = [
            [
                'name' => 'Pioneer Construction Supplies',
                'contact_name' => 'John Doe',
                'phone' => '0917-123-4567',
                'email' => 'pioneer@supplies.com',
                'address' => '123 Industrial Ave, Manila'
            ],
            [
                'name' => 'Metro Electrical Wholesalers',
                'contact_name' => 'Jane Smith',
                'phone' => '0918-987-6543',
                'email' => 'metro@electrical.com',
                'address' => '456 Power St, Quezon City'
            ],
            [
                'name' => 'Global Paints Corp',
                'contact_name' => 'Bob Johnson',
                'phone' => '0920-555-1234',
                'email' => 'global@paints.com',
                'address' => '789 Color Way, Pasig'
            ],
            [
                'name' => 'Apex Fasteners Ltd',
                'contact_name' => 'Alice Williams',
                'phone' => '0932-111-2222',
                'email' => 'apex@fasteners.com',
                'address' => '101 Screw Blvd, Valenzuela'
            ]
        ];

        $supplierModels = [];
        foreach ($suppliers as $supplier) {
            $supplierModels[] = Supplier::create($supplier);
        }

        // 3. Seed Categories
        $categories = [
            ['name' => 'Power & Hand Tools', 'description' => 'Drills, hammers, saws, and other manual or motorized tools'],
            ['name' => 'Plumbing', 'description' => 'Pipes, fittings, faucets, and water fixtures'],
            ['name' => 'Electrical', 'description' => 'Wires, switches, outlets, bulbs, and circuit breakers'],
            ['name' => 'Fasteners & Hardware', 'description' => 'Nails, screws, bolts, brackets, and hinges'],
            ['name' => 'Paints & Sundries', 'description' => 'Paints, primers, brushes, rollers, and sealants'],
            ['name' => 'Building Materials', 'description' => 'Cement, sand, plywood, steel bars, and roofing']
        ];

        $categoryModels = [];
        foreach ($categories as $cat) {
            $categoryModels[] = Category::create($cat);
        }

        // Helper maps
        $cats = [
            'Tools' => $categoryModels[0]->id,
            'Plumbing' => $categoryModels[1]->id,
            'Electrical' => $categoryModels[2]->id,
            'Fasteners' => $categoryModels[3]->id,
            'Paints' => $categoryModels[4]->id,
            'Building' => $categoryModels[5]->id,
        ];

        // 4. Seed Products
        $products = [
            // Tools
            [
                'category_id' => $cats['Tools'],
                'sku' => 'TL-HD-001',
                'name' => 'Claw Hammer 16oz',
                'description' => 'High-carbon steel claw hammer with shock-absorbing fiberglass handle.',
                'cost_price' => 180.00,
                'selling_price' => 299.00,
                'stock_quantity' => 25,
                'reorder_level' => 5,
                'unit' => 'pcs',
            ],
            [
                'category_id' => $cats['Tools'],
                'sku' => 'TL-DR-002',
                'name' => 'Impact Drill 20V',
                'description' => 'Cordless impact drill with 2 rechargeable batteries and case.',
                'cost_price' => 1800.00,
                'selling_price' => 2499.00,
                'stock_quantity' => 8,
                'reorder_level' => 3,
                'unit' => 'pcs',
            ],
            [
                'category_id' => $cats['Tools'],
                'sku' => 'TL-SW-003',
                'name' => 'Handsaw 20-inch',
                'description' => 'Hardpoint triple-ground teeth saw for fast, clean cuts.',
                'cost_price' => 250.00,
                'selling_price' => 380.00,
                'stock_quantity' => 12,
                'reorder_level' => 4,
                'unit' => 'pcs',
            ],
            // Plumbing
            [
                'category_id' => $cats['Plumbing'],
                'sku' => 'PL-PV-001',
                'name' => 'PVC Pipe Blue 1/2" x 10ft',
                'description' => 'Schedule 40 PVC water pipe for residential clean water supply.',
                'cost_price' => 75.00,
                'selling_price' => 110.00,
                'stock_quantity' => 120,
                'reorder_level' => 20,
                'unit' => 'pcs',
            ],
            [
                'category_id' => $cats['Plumbing'],
                'sku' => 'PL-TF-002',
                'name' => 'Teflon Tape 1/2" x 10m',
                'description' => 'Thread sealant tape for leak-proof pipe joints.',
                'cost_price' => 8.00,
                'selling_price' => 15.00,
                'stock_quantity' => 300,
                'reorder_level' => 50,
                'unit' => 'pcs',
            ],
            [
                'category_id' => $cats['Plumbing'],
                'sku' => 'PL-FC-003',
                'name' => 'Stainless Steel Faucet',
                'description' => 'Wall-mounted laundry/garden faucet, rust resistant.',
                'cost_price' => 110.00,
                'selling_price' => 185.00,
                'stock_quantity' => 15,
                'reorder_level' => 5,
                'unit' => 'pcs',
            ],
            // Electrical
            [
                'category_id' => $cats['Electrical'],
                'sku' => 'EL-TH-001',
                'name' => 'THHN Wire Stranded #12 (2.0mm) 150m',
                'description' => 'Thermoplastic high heat-resistant nylon-coated copper wire.',
                'cost_price' => 3200.00,
                'selling_price' => 4200.00,
                'stock_quantity' => 6,
                'reorder_level' => 2,
                'unit' => 'boxes',
            ],
            [
                'category_id' => $cats['Electrical'],
                'sku' => 'EL-LB-002',
                'name' => 'LED Bulb 9W Cool Daylight',
                'description' => 'Energy saving LED bulb, E27 socket, 85% energy savings.',
                'cost_price' => 55.00,
                'selling_price' => 95.00,
                'stock_quantity' => 150,
                'reorder_level' => 25,
                'unit' => 'pcs',
            ],
            [
                'category_id' => $cats['Electrical'],
                'sku' => 'EL-SW-003',
                'name' => '1-Gang Wall Switch',
                'description' => 'Classic white wall switch with plate, durable contacts.',
                'cost_price' => 35.00,
                'selling_price' => 65.00,
                'stock_quantity' => 45,
                'reorder_level' => 10,
                'unit' => 'pcs',
            ],
            // Fasteners
            [
                'category_id' => $cats['Fasteners'],
                'sku' => 'FS-CN-001',
                'name' => 'Concrete Nails 3-inch',
                'description' => 'Galvanized concrete steel nails, high hardness.',
                'cost_price' => 90.00,
                'selling_price' => 140.00,
                'stock_quantity' => 40,
                'reorder_level' => 8,
                'unit' => 'kg',
            ],
            [
                'category_id' => $cats['Fasteners'],
                'sku' => 'FS-WS-002',
                'name' => 'Wood Screw #8 x 1-1/2"',
                'description' => 'Flat head Phillips wood screws, zinc plated (100pcs/pack).',
                'cost_price' => 45.00,
                'selling_price' => 75.00,
                'stock_quantity' => 3, // LOW STOCK FOR WARNING DEMO
                'reorder_level' => 10,
                'unit' => 'packs',
            ],
            // Paints
            [
                'category_id' => $cats['Paints'],
                'sku' => 'PT-LT-001',
                'name' => 'Latex Paint White Flat 1-Gal',
                'description' => 'Premium flat latex acrylic paint for concrete and masonry walls.',
                'cost_price' => 480.00,
                'selling_price' => 680.00,
                'stock_quantity' => 18,
                'reorder_level' => 5,
                'unit' => 'tins',
            ],
            [
                'category_id' => $cats['Paints'],
                'sku' => 'PT-BR-002',
                'name' => 'Paint Brush 2-inch',
                'description' => 'Nylon-bristle paint brush with wooden handle for latex/oil paints.',
                'cost_price' => 15.00,
                'selling_price' => 35.00,
                'stock_quantity' => 80,
                'reorder_level' => 15,
                'unit' => 'pcs',
            ],
            // Building Materials
            [
                'category_id' => $cats['Building'],
                'sku' => 'BM-CM-001',
                'name' => 'Portland Cement Type 1 40kg',
                'description' => 'High quality cement for general structural construction.',
                'cost_price' => 220.00,
                'selling_price' => 275.00,
                'stock_quantity' => 200,
                'reorder_level' => 40,
                'unit' => 'bags',
            ],
            [
                'category_id' => $cats['Building'],
                'sku' => 'BM-PW-002',
                'name' => 'Marine Plywood 1/4" x 4\' x 8\'',
                'description' => 'Water-resistant plywood suitable for outdoor use and cabinets.',
                'cost_price' => 350.00,
                'selling_price' => 495.00,
                'stock_quantity' => 35,
                'reorder_level' => 8,
                'unit' => 'pcs',
            ]
        ];

        foreach ($products as $prod) {
            $p = Product::create($prod);

            // Log the initial stock as a stock-in
            StockLog::create([
                'product_id' => $p->id,
                'user_id' => $admin->id,
                'supplier_id' => $supplierModels[array_rand($supplierModels)]->id,
                'type' => 'stock-in',
                'quantity' => $p->stock_quantity,
                'reason' => 'Initial stock seeding',
            ]);
        }
    }
}
