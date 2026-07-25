import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { 
    Plus, 
    Package, 
    Search, 
    Edit, 
    Trash2, 
    ArrowUpDown, 
    AlertTriangle, 
    Layers, 
    Filter,
    X,
    Check
} from 'lucide-react';

interface Category {
    id: number;
    name: string;
}

interface Supplier {
    id: number;
    name: string;
}

interface Product {
    id: number;
    category_id: number;
    sku: string;
    name: string;
    description: string | null;
    cost_price: number | string;
    selling_price: number | string;
    stock_quantity: number;
    reorder_level: number;
    unit: string;
    is_active: boolean;
    category: Category;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface IndexProps {
    products: {
        data: Product[];
        current_page: number;
        last_page: number;
        links: PaginationLink[];
        total: number;
    };
    categories: Category[];
    suppliers: Supplier[];
    filters: {
        search?: string;
        category_id?: string;
        status?: string;
    };
}

export default function Index({ products, categories, suppliers, filters }: IndexProps) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    // Search and Filters state
    const [searchVal, setSearchVal] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category_id || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');

    // Auto-populate default category and random SKU upon opening Add modal
    useEffect(() => {
        if (isAddModalOpen && categories.length > 0) {
            const defaultCategoryId = categories[0]?.id || 1;
            const randVal = Math.floor(100 + Math.random() * 900);
            const randStr = Math.random().toString(36).substring(2, 5).toUpperCase();
            const generatedSku = `PROD-${randVal}-${randStr}`;
            addForm.setData({
                category_id: defaultCategoryId.toString(),
                sku: generatedSku,
                name: '',
                description: '',
                cost_price: '',
                selling_price: '',
                stock_quantity: '',
                reorder_level: '5',
                unit: 'pcs',
                supplier_id: '',
            });
        }
    }, [isAddModalOpen, categories]);

    // Forms
    const addForm = useForm({
        category_id: '',
        sku: '',
        name: '',
        description: '',
        cost_price: '',
        selling_price: '',
        stock_quantity: '',
        reorder_level: '5',
        unit: 'pcs',
        supplier_id: '',
    });

    const editForm = useForm({
        category_id: '',
        sku: '',
        name: '',
        description: '',
        cost_price: '',
        selling_price: '',
        reorder_level: '5',
        unit: 'pcs',
        is_active: true,
    });

    const adjustForm = useForm({
        type: 'stock-in',
        quantity: '',
        reason: '',
        supplier_id: '',
    });

    // Handle filter application
    const applyFilters = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(route('products.index'), {
            search: searchVal,
            category_id: categoryFilter,
            status: statusFilter,
        }, {
            preserveState: true,
        });
    };

    const clearFilters = () => {
        setSearchVal('');
        setCategoryFilter('');
        setStatusFilter('all');
        router.get(route('products.index'), {});
    };

    // Open Modal Helpers
    const openEdit = (product: Product) => {
        setSelectedProduct(product);
        editForm.setData({
            category_id: product.category_id.toString(),
            sku: product.sku,
            name: product.name,
            description: product.description || '',
            cost_price: product.cost_price.toString(),
            selling_price: product.selling_price.toString(),
            reorder_level: product.reorder_level.toString(),
            unit: product.unit,
            is_active: product.is_active,
        });
        setIsEditModalOpen(true);
    };

    const openAdjust = (product: Product) => {
        setSelectedProduct(product);
        adjustForm.reset();
        setIsAdjustModalOpen(true);
    };

    // Submit Handlers
    const submitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post(route('products.store'), {
            onSuccess: () => {
                setIsAddModalOpen(false);
                addForm.reset();
            }
        });
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedProduct) {
            editForm.patch(route('products.update', selectedProduct.id), {
                onSuccess: () => {
                    setIsEditModalOpen(false);
                    editForm.reset();
                    setSelectedProduct(null);
                }
            });
        }
    };

    const submitAdjust = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedProduct) {
            adjustForm.post(route('products.adjust-stock', selectedProduct.id), {
                onSuccess: () => {
                    setIsAdjustModalOpen(false);
                    adjustForm.reset();
                    setSelectedProduct(null);
                }
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this product? All stock logs and sale items references will remain, but the product details will be deleted.')) {
            router.delete(route('products.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <Package className="h-6 w-6 text-emerald-500" />
                    <span>Hardware Inventory</span>
                </div>
            }
        >
            <Head title="Inventory" />

            <div className="space-y-6 animate-fade-in">
                {/* Search & Action Bar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                    <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-xs font-semibold text-slate-400 block">Search Products</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
                                <input 
                                    type="text"
                                    value={searchVal}
                                    onChange={e => setSearchVal(e.target.value)}
                                    placeholder="Search by name, SKU, or specs..."
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 block">Stock Status</label>
                            <select 
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-white"
                            >
                                <option value="all">All Products</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                                <option value="low_stock">Low / Out of Stock</option>
                            </select>
                        </div>

                        <div className="flex flex-wrap gap-2 md:col-span-3 justify-end mt-2">
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm transition"
                            >
                                Clear
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-md hover:bg-emerald-600 active:scale-95 transition flex items-center gap-2"
                            >
                                <Filter className="h-4 w-4" />
                                Apply Filters
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(true)}
                                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-sm shadow-md hover:bg-slate-850 dark:hover:bg-slate-50 active:scale-95 transition flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Add Product
                            </button>
                        </div>
                    </form>
                </div>

                {/* Products Table Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 text-xs font-bold uppercase">
                                    <th className="py-4 px-6">SKU</th>
                                    <th className="py-4 px-6">Product Details</th>
                                    <th className="py-4 px-6 text-right">Cost Price</th>
                                    <th className="py-4 px-6 text-right">Selling Price</th>
                                    <th className="py-4 px-6 text-center">Stock Level</th>
                                    <th className="py-4 px-6 text-center">Status</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {products.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            <Package className="h-10 w-10 mx-auto stroke-1 mb-2" />
                                            <span>No products found. Adjust filters or add a product.</span>
                                        </td>
                                    </tr>
                                ) : (
                                    products.data.map((product) => {
                                        const isLowStock = product.stock_quantity <= product.reorder_level;
                                        return (
                                            <tr key={product.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition duration-150">
                                                <td className="py-4 px-6 font-semibold text-xs text-slate-500 tracking-wider">
                                                    {product.sku}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="font-semibold text-slate-800 dark:text-white text-sm">
                                                        {product.name}
                                                    </div>
                                                    {product.description && (
                                                        <div className="text-xs text-slate-400 line-clamp-1 mt-0.5 max-w-sm">
                                                            {product.description}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right text-sm font-medium text-slate-500">
                                                    ₱{Number(product.cost_price).toFixed(2)}
                                                </td>
                                                <td className="py-4 px-6 text-right text-sm font-bold text-slate-900 dark:text-white">
                                                    ₱{Number(product.selling_price).toFixed(2)}
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                                        isLowStock 
                                                            ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 animate-pulse'
                                                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                    }`}>
                                                        {isLowStock && <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                                                        {product.stock_quantity} {product.unit}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${product.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} title={product.is_active ? 'Active' : 'Inactive'} />
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => openAdjust(product)}
                                                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/15 dark:hover:text-emerald-400 transition"
                                                            title="Adjust Stock"
                                                        >
                                                            Adjust
                                                        </button>
                                                        <button 
                                                            onClick={() => openEdit(product)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition"
                                                            title="Edit Product"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(product.id)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-105 hover:text-red-650 dark:hover:bg-slate-800 transition"
                                                            title="Delete Product"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {products.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/20 dark:bg-slate-900/10">
                            <span className="text-sm text-slate-400">Total products: {products.total}</span>
                            <div className="flex gap-1.5">
                                {products.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            if (link.url) router.get(link.url, {
                                                search: searchVal,
                                                category_id: categoryFilter,
                                                status: statusFilter,
                                            });
                                        }}
                                        disabled={!link.url}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                                            link.active
                                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10'
                                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350'
                                        } disabled:opacity-40 disabled:hover:bg-transparent`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL 1: ADD PRODUCT */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Add New Product</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={submitAdd} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Product SKU (Auto-generated)</label>
                                    <input 
                                        type="text"
                                        value={addForm.data.sku}
                                        readOnly
                                        placeholder="Select Category to generate SKU"
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                    />
                                    {addForm.errors.sku && <span className="text-xs text-red-500 font-medium">{addForm.errors.sku}</span>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Product Name</label>
                                    <input 
                                        type="text"
                                        value={addForm.data.name}
                                        onChange={e => addForm.setData('name', e.target.value)}
                                        placeholder="e.g. Claw Hammer 16oz"
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-900 dark:text-white"
                                        required
                                    />
                                    {addForm.errors.name && <span className="text-xs text-red-500 font-medium">{addForm.errors.name}</span>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Measurement Unit</label>
                                    <input 
                                        type="text"
                                        value={addForm.data.unit}
                                        onChange={e => addForm.setData('unit', e.target.value)}
                                        placeholder="pcs, meters, kg, boxes"
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-900 dark:text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Cost Price (₱)</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        value={addForm.data.cost_price}
                                        onChange={e => addForm.setData('cost_price', e.target.value)}
                                        placeholder="150.00"
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-900 dark:text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Selling Price (₱)</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        value={addForm.data.selling_price}
                                        onChange={e => addForm.setData('selling_price', e.target.value)}
                                        placeholder="250.00"
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-900 dark:text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Initial Stock Quantity</label>
                                    <input 
                                        type="number"
                                        value={addForm.data.stock_quantity}
                                        onChange={e => addForm.setData('stock_quantity', e.target.value)}
                                        placeholder="50"
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-900 dark:text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Reorder Alert Level (Min Stock)</label>
                                    <input 
                                        type="number"
                                        value={addForm.data.reorder_level}
                                        onChange={e => addForm.setData('reorder_level', e.target.value)}
                                        placeholder="5"
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-900 dark:text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-semibold text-slate-400 block">Supplier for Initial Stock (Optional)</label>
                                    <select 
                                        value={addForm.data.supplier_id}
                                        onChange={e => addForm.setData('supplier_id', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-900 dark:text-white"
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-semibold text-slate-400 block">Description / Specifications</label>
                                    <textarea 
                                        value={addForm.data.description}
                                        onChange={e => addForm.setData('description', e.target.value)}
                                        placeholder="Add key features, sizes, brands..."
                                        rows={3}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-900 dark:text-white resize-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-sm">Cancel</button>
                                <button type="submit" disabled={addForm.processing} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition">Save Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: EDIT PRODUCT */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Edit Product Details</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={submitEdit} className="flex-1 overflow-y-auto p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Product SKU</label>
                                    <input 
                                        type="text"
                                        value={editForm.data.sku}
                                        readOnly
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                    />
                                    {editForm.errors.sku && <span className="text-xs text-red-500 font-medium">{editForm.errors.sku}</span>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Product Name</label>
                                    <input 
                                        type="text"
                                        value={editForm.data.name}
                                        onChange={e => editForm.setData('name', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-950 dark:text-white"
                                        required
                                    />
                                    {editForm.errors.name && <span className="text-xs text-red-500 font-medium">{editForm.errors.name}</span>}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Measurement Unit</label>
                                    <input 
                                        type="text"
                                        value={editForm.data.unit}
                                        onChange={e => editForm.setData('unit', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-950 dark:text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Cost Price (₱)</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        value={editForm.data.cost_price}
                                        onChange={e => editForm.setData('cost_price', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-950 dark:text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Selling Price (₱)</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        value={editForm.data.selling_price}
                                        onChange={e => editForm.setData('selling_price', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-950 dark:text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Reorder Alert Level</label>
                                    <input 
                                        type="number"
                                        value={editForm.data.reorder_level}
                                        onChange={e => editForm.setData('reorder_level', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-950 dark:text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-1 flex items-center pt-5">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={editForm.data.is_active}
                                            onChange={e => editForm.setData('is_active', e.target.checked)}
                                            className="rounded border-slate-200 text-emerald-500 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Product is Available/Active</span>
                                    </label>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-semibold text-slate-400 block">Description / Specifications</label>
                                    <textarea 
                                        value={editForm.data.description}
                                        onChange={e => editForm.setData('description', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-950 dark:text-white resize-none"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-sm">Cancel</button>
                                <button type="submit" disabled={editForm.processing} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition">Update Product</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 3: ADJUST STOCK */}
            {isAdjustModalOpen && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white">Adjust Product Stock</h3>
                                <p className="text-xs text-slate-400 mt-0.5">{selectedProduct.name} (Qty: {selectedProduct.stock_quantity})</p>
                            </div>
                            <button onClick={() => setIsAdjustModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
                        </div>
                        <form onSubmit={submitAdjust} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 block">Adjustment Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => adjustForm.setData('type', 'stock-in')}
                                        className={`py-2 rounded-xl text-sm font-bold border transition ${
                                            adjustForm.data.type === 'stock-in'
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                                        }`}
                                    >
                                        Stock In (+)
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => adjustForm.setData('type', 'stock-out')}
                                        className={`py-2 rounded-xl text-sm font-bold border transition ${
                                            adjustForm.data.type === 'stock-out'
                                                ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                                        }`}
                                    >
                                        Stock Out (-)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 block">Quantity ({selectedProduct.unit})</label>
                                <input 
                                    type="number"
                                    min="1"
                                    value={adjustForm.data.quantity}
                                    onChange={e => adjustForm.setData('quantity', e.target.value)}
                                    placeholder="Enter quantity"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-950 dark:text-white"
                                    required
                                />
                            </div>

                            {adjustForm.data.type === 'stock-in' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Supplier (Optional)</label>
                                    <select 
                                        value={adjustForm.data.supplier_id}
                                        onChange={e => adjustForm.setData('supplier_id', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-950 dark:text-white"
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 block">Reason / Details</label>
                                <input 
                                    type="text"
                                    value={adjustForm.data.reason}
                                    onChange={e => adjustForm.setData('reason', e.target.value)}
                                    placeholder="e.g. Restocking, Damage write-off"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2 text-sm focus:border-emerald-500 text-slate-950 dark:text-white"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-sm">Cancel</button>
                                <button type="submit" disabled={adjustForm.processing} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition">Apply Adjustment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
