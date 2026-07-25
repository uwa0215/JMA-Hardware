import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    TrendingUp, 
    AlertTriangle, 
    Package, 
    DollarSign, 
    ShoppingCart, 
    ArrowRight,
    CheckCircle,
    ShoppingBag,
    Clock,
    Edit2,
    Trash2,
    X
} from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string;
    icon: any;
    color: string;
    bgLight: string;
    bgDark: string;
    textColor: string;
}

function MetricCard({ title, value, icon: Icon, color, bgLight, bgDark, textColor }: MetricCardProps) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-400">{title}</p>
                    <p className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">{value}</p>
                </div>
                <div className={`p-4 rounded-xl ${bgLight} ${bgDark} ${textColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );
}

interface DashboardProps {
    metrics: {
        todaySales: number;
        monthlySales: number;
        todayProfit: number;
        monthlyProfit: number;
        activeProductsCount: number;
        lowStockCount: number;
    };
    lowStockProducts: Array<{
        id: number;
        sku: string;
        name: string;
        stock_quantity: number;
        reorder_level: number;
        unit: string;
        category?: { name: string };
    }>;
    bestSellers: Array<{
        name: string;
        unit: string;
        total_qty: number;
        total_sales: number;
    }>;
    salesTrend: Array<{
        day: string;
        date: string;
        total: number;
    }>;
    recentSales: Array<{
        id: number;
        invoice_number: string;
        customer_name: string;
        grand_total: number;
        payment_method: string;
        status: string;
        created_at: string;
    }>;
    todaySalesList: Array<{
        id: number;
        invoice_number: string;
        customer_name: string;
        grand_total: number;
        discount: number;
        payment_method: string;
        status: string;
        created_at: string;
        user: { name: string };
        items: Array<{
            id: number;
            quantity: number;
            selling_price: number;
            product: { name: string; unit: string };
        }>;
    }>;
}

export default function Dashboard({ metrics, lowStockProducts, bestSellers, salesTrend, recentSales, todaySalesList }: DashboardProps) {
    const [editingSale, setEditingSale] = useState<any | null>(null);
    const [selectedSaleIds, setSelectedSaleIds] = useState<number[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<{
        show: boolean;
        saleId?: number;
        invoiceNum?: string;
        isBulk: boolean;
    } | null>(null);

    const form = useForm({
        customer_name: '',
        payment_method: 'Cash' as 'Cash' | 'Card' | 'GCash' | 'PayMaya',
        discount: 0,
        notes: '',
    });

    const handleEditClick = (sale: any) => {
        setEditingSale(sale);
        form.setData({
            customer_name: sale.customer_name,
            payment_method: sale.payment_method as any,
            discount: Number(sale.discount),
            notes: sale.notes || '',
        });
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSale) return;
        
        form.patch(route('sales.update', editingSale.id), {
            onSuccess: () => {
                setEditingSale(null);
                form.reset();
            },
            onError: (err: any) => {
                alert(err.error || 'Failed to update transaction.');
            }
        });
    };

    const handleDeleteClick = (saleId: number, invoiceNum: string) => {
        setDeleteConfirm({
            show: true,
            saleId,
            invoiceNum,
            isBulk: false
        });
    };

    const handleBulkDeleteClick = () => {
        if (selectedSaleIds.length === 0) return;
        setDeleteConfirm({
            show: true,
            isBulk: true
        });
    };



    const formatCurrency = (num: number) => {
        return '₱' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const formatDateTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + 
                   date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-emerald-500" />
                    <span>Store Dashboard</span>
                </div>
            }
        >
            <Head title="Dashboard" />

            <div className="space-y-8 animate-fade-in">
                {/* 1. Low Stock Banner Warning */}
                {metrics.lowStockCount > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-amber-950 dark:text-amber-300">Inventory Alert</h4>
                                <p className="text-sm text-amber-800/80 dark:text-amber-400/80">
                                    There are {metrics.lowStockCount} items currently running low or out of stock.
                                </p>
                            </div>
                        </div>
                        <Link 
                            href={route('products.index', { status: 'low_stock' })}
                            className="text-sm font-semibold text-amber-900 dark:text-amber-300 hover:underline flex items-center gap-1.5 shrink-0"
                        >
                            <span>Manage Stock</span>
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                )}

                {/* 2. Key Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard 
                        title="Today's Sales" 
                        value={formatCurrency(metrics.todaySales)} 
                        icon={ShoppingCart} 
                        color="emerald"
                        bgLight="bg-emerald-50"
                        bgDark="dark:bg-emerald-500/10"
                        textColor="text-emerald-600 dark:text-emerald-400"
                    />
                    <MetricCard 
                        title="Today's Profit" 
                        value={formatCurrency(metrics.todayProfit)} 
                        icon={DollarSign} 
                        color="teal"
                        bgLight="bg-teal-50"
                        bgDark="dark:bg-teal-500/10"
                        textColor="text-teal-600 dark:text-teal-400"
                    />
                    <MetricCard 
                        title="Monthly Sales" 
                        value={formatCurrency(metrics.monthlySales)} 
                        icon={TrendingUp} 
                        color="indigo"
                        bgLight="bg-indigo-50"
                        bgDark="dark:bg-indigo-500/10"
                        textColor="text-indigo-600 dark:text-indigo-400"
                    />
                    <MetricCard 
                        title="Active Products" 
                        value={metrics.activeProductsCount.toString()} 
                        icon={Package} 
                        color="sky"
                        bgLight="bg-sky-50"
                        bgDark="dark:bg-sky-500/10"
                        textColor="text-sky-600 dark:text-sky-400"
                    />
                </div>

                {/* 4. Lists & History Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Low Stock Watchlist */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 dark:text-white">Low Stock Watchlist</h3>
                            <Link href={route('products.index', { status: 'low_stock' })} className="text-xs font-semibold text-emerald-500 hover:underline">
                                View All
                            </Link>
                        </div>
                        {lowStockProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-emerald-500 text-sm">
                                <CheckCircle className="h-8 w-8 mb-2" />
                                <span>All items fully stocked!</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {lowStockProducts.map((p) => (
                                    <div key={p.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{p.name}</p>
                                            <p className="text-xs text-slate-400">SKU: {p.sku}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                                {p.stock_quantity} {p.unit} remaining
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 dark:text-white">Recent Sales</h3>
                            <Link href={route('sales.index')} className="text-xs font-semibold text-emerald-500 hover:underline">
                                View All
                            </Link>
                        </div>
                        {recentSales.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-sm">
                                <ShoppingCart className="h-8 w-8 mb-2 stroke-1" />
                                <span>No transactions yet</span>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800">
                                            <th className="py-2 text-xs font-semibold text-slate-400">Invoice</th>
                                            <th className="py-2 text-xs font-semibold text-slate-400">Customer</th>
                                            <th className="py-2 text-xs font-semibold text-slate-400">Total</th>
                                            <th className="py-2 text-xs font-semibold text-slate-400 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {recentSales.map((sale) => (
                                            <tr key={sale.id}>
                                                <td className="py-3 text-sm font-semibold text-slate-950 dark:text-white">
                                                    {sale.invoice_number}
                                                </td>
                                                <td className="py-3 text-sm text-slate-500">
                                                    {sale.customer_name}
                                                </td>
                                                <td className="py-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                                                    ₱{sale.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3 text-right">
                                                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                                                        sale.status === 'completed'
                                                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                            : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                                    }`}>
                                                        {sale.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. Daily Sales List (with purchased items and date/time details) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-emerald-500" />
                            <h3 className="font-bold text-slate-800 dark:text-white">Daily Sales Log (Today's Transactions)</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            {selectedSaleIds.length > 0 && (
                                <button
                                    onClick={handleBulkDeleteClick}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-sm transition duration-300 cursor-pointer"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete Selected ({selectedSaleIds.length})
                                </button>
                            )}
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                {todaySalesList.length} {todaySalesList.length === 1 ? 'Sale' : 'Sales'} Recorded
                            </span>
                        </div>
                    </div>

                    {todaySalesList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm">
                            <ShoppingBag className="h-10 w-10 mb-2 stroke-1 text-slate-300" />
                            <span>No sales recorded yet today. Go to the POS Checkout terminal to log a sale!</span>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        <th className="pb-3 pr-4 text-center w-10">
                                            <input 
                                                type="checkbox"
                                                checked={todaySalesList.length > 0 && selectedSaleIds.length === todaySalesList.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedSaleIds(todaySalesList.map(s => s.id));
                                                    } else {
                                                        setSelectedSaleIds([]);
                                                    }
                                                }}
                                                className="rounded border-slate-300 dark:border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-transparent cursor-pointer"
                                            />
                                        </th>
                                        <th className="pb-3 pr-4">Invoice</th>
                                        <th className="pb-3 pr-4">Time Bought</th>
                                        <th className="pb-3 pr-4">Customer</th>
                                        <th className="pb-3 pr-4">Purchased Items</th>
                                        <th className="pb-3 pr-4">Cashier</th>
                                        <th className="pb-3 pr-4">Payment</th>
                                        <th className="pb-3 text-right pr-4">Grand Total</th>
                                        <th className="pb-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                    {todaySalesList.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                                            <td className="py-4 pr-4 text-center w-10">
                                                <input 
                                                    type="checkbox"
                                                    checked={selectedSaleIds.includes(sale.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedSaleIds(prev => [...prev, sale.id]);
                                                        } else {
                                                            setSelectedSaleIds(prev => prev.filter(id => id !== sale.id));
                                                        }
                                                    }}
                                                    className="rounded border-slate-300 dark:border-slate-700 text-emerald-500 focus:ring-emerald-500 bg-transparent cursor-pointer"
                                                />
                                            </td>
                                            <td className="py-4 pr-4 font-mono font-bold text-slate-900 dark:text-white text-sm">
                                                {sale.invoice_number}
                                            </td>
                                            <td className="py-4 pr-4 text-sm text-slate-600 dark:text-slate-300">
                                                <div className="flex items-center gap-1.5 font-medium">
                                                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>{formatDateTime(sale.created_at)}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                                                {sale.customer_name}
                                            </td>
                                            <td className="py-4 pr-4 text-sm max-w-xs">
                                                <div className="space-y-0.5">
                                                    {sale.items.map((item, idx) => (
                                                        <div key={idx} className="text-slate-500 dark:text-slate-400 text-xs truncate">
                                                            <span className="font-extrabold text-emerald-500 mr-1">{item.quantity}x</span> 
                                                            <span>{item.product?.name || 'Deleted Product'}</span>
                                                            <span className="text-[10px] text-slate-400 ml-1">({item.product?.unit})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-4 pr-4 text-sm text-slate-500">
                                                {sale.user?.name || 'System'}
                                            </td>
                                            <td className="py-4 pr-4 text-sm">
                                                <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                    {sale.payment_method}
                                                </span>
                                            </td>
                                            <td className="py-4 text-right pr-4">
                                                <div className="font-extrabold text-emerald-500">
                                                    {formatCurrency(Number(sale.grand_total))}
                                                </div>
                                                {Number(sale.discount) > 0 && (
                                                    <div className="text-[10px] text-red-500 font-semibold">
                                                        Disc: -{formatCurrency(Number(sale.discount))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => handleEditClick(sale)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition"
                                                        title="Edit Sale Details"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(sale.id, sale.invoice_number)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                                                        title="Delete Sale & Restore Stock"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* EDIT TRANSACTION MODAL */}
                {editingSale && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                    <Edit2 className="h-4.5 w-4.5 text-emerald-500" /> 
                                    Edit Invoice: {editingSale.invoice_number}
                                </span>
                                <button 
                                    onClick={() => { setEditingSale(null); form.reset(); }} 
                                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-500"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            
                            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
                                {/* Customer Name */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Customer Name</label>
                                    <input 
                                        type="text"
                                        value={form.data.customer_name}
                                        onChange={e => form.setData('customer_name', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-white"
                                        placeholder="Walk-in Customer"
                                    />
                                </div>

                                {/* Discount */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Discount (₱ Cash)</label>
                                    <input 
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.data.discount === 0 ? '' : form.data.discount}
                                        onChange={e => form.setData('discount', Math.max(0, parseFloat(e.target.value) || 0))}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-white"
                                        placeholder="₱0.00"
                                    />
                                </div>

                                {/* Payment Method */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Payment Method</label>
                                    <select 
                                        value={form.data.payment_method}
                                        onChange={e => form.setData('payment_method', e.target.value as any)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-white"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="GCash">GCash</option>
                                        <option value="PayMaya">PayMaya</option>
                                    </select>
                                </div>

                                {/* Notes */}
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 block">Notes</label>
                                    <textarea 
                                        value={form.data.notes}
                                        onChange={e => form.setData('notes', e.target.value)}
                                        rows={3}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-white"
                                        placeholder="Additional sale remarks..."
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setEditingSale(null); form.reset(); }}
                                        className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-sm font-semibold text-slate-600 dark:text-slate-350 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-400 text-white text-sm font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.98] transition flex items-center justify-center"
                                    >
                                        {form.processing ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* DELETE CONFIRMATION MODAL */}
                {deleteConfirm && deleteConfirm.show && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 text-red-500">
                                    <Trash2 className="h-4.5 w-4.5" /> 
                                    Confirm Deletion
                                </span>
                                <button 
                                    onClick={() => setDeleteConfirm(null)} 
                                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-500 cursor-pointer"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-xl text-red-500 shrink-0">
                                        <AlertTriangle className="h-6 w-6 animate-pulse" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-base">
                                            Are you absolutely sure?
                                        </h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            {deleteConfirm.isBulk ? (
                                                `You are about to delete ${selectedSaleIds.length} selected transaction(s). This will restore all purchased items back to the product stock inventory.`
                                            ) : (
                                                `You are about to delete transaction ${deleteConfirm.invoiceNum}. This will restore the purchased items back to the product stock inventory.`
                                            )}
                                        </p>
                                        <p className="text-xs text-red-500 dark:text-red-400 font-semibold mt-2">
                                            This action cannot be undone.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-850 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (deleteConfirm.isBulk) {
                                            router.delete(route('sales.bulk-destroy'), {
                                                data: { ids: selectedSaleIds },
                                                onSuccess: () => {
                                                    setSelectedSaleIds([]);
                                                    setDeleteConfirm(null);
                                                },
                                                onError: (err: any) => {
                                                    alert(err.error || 'Failed to delete selected transactions.');
                                                    setDeleteConfirm(null);
                                                }
                                            });
                                        } else if (deleteConfirm.saleId) {
                                            const id = deleteConfirm.saleId;
                                            router.delete(route('sales.destroy', id), {
                                                onSuccess: () => {
                                                    setSelectedSaleIds(prev => prev.filter(item => item !== id));
                                                    setDeleteConfirm(null);
                                                },
                                                onError: (err: any) => {
                                                    alert(err.error || 'Failed to delete transaction.');
                                                    setDeleteConfirm(null);
                                                }
                                            });
                                        }
                                    }}
                                    className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition cursor-pointer"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
