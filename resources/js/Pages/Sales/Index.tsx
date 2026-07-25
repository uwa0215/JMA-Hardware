import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    History, 
    Search, 
    Eye, 
    RotateCcw, 
    X, 
    FileText, 
    Calendar, 
    User as UserIcon, 
    CreditCard 
} from 'lucide-react';

interface SaleItem {
    id: number;
    product_id: number;
    quantity: number;
    cost_price: number | string;
    selling_price: number | string;
    total_price: number | string;
    product?: {
        name: string;
        unit: string;
        sku: string;
    };
}

interface Sale {
    id: number;
    invoice_number: string;
    user_id: number;
    customer_name: string;
    total_amount: number | string;
    discount: number | string;
    tax: number | string;
    grand_total: number | string;
    payment_method: string;
    status: string;
    notes: string | null;
    created_at: string;
    user?: {
        name: string;
    };
    items?: SaleItem[];
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface IndexProps {
    sales: {
        data: Sale[];
        current_page: number;
        last_page: number;
        links: PaginationLink[];
        total: number;
    };
    filters: {
        search?: string;
    };
}

export default function Index({ sales, filters }: IndexProps) {
    const [searchVal, setSearchVal] = useState(filters.search || '');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('sales.index'), { search: searchVal }, { preserveState: true });
    };

    const clearSearch = () => {
        setSearchVal('');
        router.get(route('sales.index'), {});
    };

    const openDetails = (sale: Sale) => {
        setSelectedSale(sale);
        setIsDetailModalOpen(true);
    };

    const handleVoid = (id: number) => {
        if (confirm('Are you sure you want to void this sale? This will restore the products back to stock inventory and mark the invoice as voided.')) {
            router.post(route('sales.void', id), {}, {
                onSuccess: (page) => {
                    setIsDetailModalOpen(false);
                    setSelectedSale(null);
                }
            });
        }
    };

    const formatCurrency = (val: number | string) => {
        return '₱' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <History className="h-6 w-6 text-emerald-500" />
                    <span>Sales Transaction Logs</span>
                </div>
            }
        >
            <Head title="Sales Logs" />

            <div className="space-y-6 animate-fade-in">
                {/* Search Header */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                            <input 
                                type="text"
                                value={searchVal}
                                onChange={e => setSearchVal(e.target.value)}
                                placeholder="Search by Invoice number or Customer name..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-transparent text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button 
                                type="button" 
                                onClick={clearSearch}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition flex-1 sm:flex-none text-center justify-center animate-fade-in"
                            >
                                Reset
                            </button>
                            <button 
                                type="submit"
                                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition flex-1 sm:flex-none text-center justify-center animate-fade-in"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>

                {/* Table list */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-400 text-xs font-bold uppercase">
                                    <th className="py-4 px-6">Invoice #</th>
                                    <th className="py-4 px-6">Customer</th>
                                    <th className="py-4 px-6">Date / Time</th>
                                    <th className="py-4 px-6">Payment Method</th>
                                    <th className="py-4 px-6 text-right">Grand Total</th>
                                    <th className="py-4 px-6 text-center">Status</th>
                                    <th className="py-4 px-6 text-center">Cashier</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {sales.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-slate-400">
                                            <History className="h-10 w-10 mx-auto stroke-1 mb-2" />
                                            <span>No transactions found.</span>
                                        </td>
                                    </tr>
                                ) : (
                                    sales.data.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition duration-150">
                                            <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                {sale.invoice_number}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-650 dark:text-slate-300">
                                                {sale.customer_name}
                                            </td>
                                            <td className="py-4 px-6 text-xs text-slate-400">
                                                {new Date(sale.created_at).toLocaleString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-500">
                                                {sale.payment_method}
                                            </td>
                                            <td className="py-4 px-6 text-right text-sm font-bold text-slate-850 dark:text-white">
                                                {formatCurrency(sale.grand_total)}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    sale.status === 'completed'
                                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                        : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                                                }`}>
                                                    {sale.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center text-sm text-slate-500">
                                                {sale.user?.name || 'Unknown'}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => openDetails(sale)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-755 hover:text-slate-900 transition flex items-center gap-1.5 ml-auto"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {sales.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/20 dark:bg-slate-900/10">
                            <span className="text-sm text-slate-400">Total Transactions: {sales.total}</span>
                            <div className="flex gap-1.5">
                                {sales.links.map((link, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            if (link.url) router.get(link.url, { search: searchVal });
                                        }}
                                        disabled={!link.url}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                                            link.active
                                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/10'
                                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-605 dark:text-slate-350'
                                        } disabled:opacity-40`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Receipt / Invoice Details Modal */}
            {isDetailModalOpen && selectedSale && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-100 dark:border-slate-850 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                            <span className="font-bold text-slate-850 dark:text-white">Transaction Invoice</span>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Receipt Header (Hardware Store Details) */}
                            <div className="text-center space-y-1">
                                <h3 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-wide">JMA HARDWARE</h3>
                                <p className="text-xs text-slate-400">123 Construction Rd, Metro Manila</p>
                                <p className="text-xs text-slate-400">Tel: (02) 8888-1234</p>
                            </div>

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-y-2 gap-x-4 border-t border-b border-dashed border-slate-200 dark:border-slate-800 py-4 text-xs">
                                <div className="flex gap-1.5 items-center text-slate-400">
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>Invoice No:</span>
                                </div>
                                <div className="font-bold text-slate-800 dark:text-white text-right">{selectedSale.invoice_number}</div>

                                <div className="flex gap-1.5 items-center text-slate-400">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>Date:</span>
                                </div>
                                <div className="font-medium text-slate-800 dark:text-white text-right">
                                    {new Date(selectedSale.created_at).toLocaleString()}
                                </div>

                                <div className="flex gap-1.5 items-center text-slate-400">
                                    <UserIcon className="h-3.5 w-3.5" />
                                    <span>Cashier:</span>
                                </div>
                                <div className="font-medium text-slate-800 dark:text-white text-right">{selectedSale.user?.name || 'System'}</div>

                                <div className="flex gap-1.5 items-center text-slate-400">
                                    <CreditCard className="h-3.5 w-3.5" />
                                    <span>Payment Method:</span>
                                </div>
                                <div className="font-bold text-emerald-500 text-right">{selectedSale.payment_method}</div>
                            </div>

                            {/* Items List */}
                            <div className="space-y-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Items Purchased</p>
                                <div className="space-y-3">
                                    {selectedSale.items?.map((item) => (
                                        <div key={item.id} className="flex justify-between items-start text-sm">
                                            <div className="space-y-0.5">
                                                <p className="font-semibold text-slate-800 dark:text-white leading-snug">{item.product?.name || 'Unknown Product'}</p>
                                                <p className="text-xs text-slate-450">
                                                    {item.quantity} {item.product?.unit || 'pcs'} × {formatCurrency(item.selling_price)}
                                                </p>
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white ml-4 shrink-0">
                                                {formatCurrency(item.total_price)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="border-t border-dashed border-slate-200 dark:border-slate-800 pt-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Subtotal</span>
                                    <span className="font-medium text-slate-850 dark:text-white">{formatCurrency(selectedSale.total_amount)}</span>
                                </div>
                                {Number(selectedSale.discount) > 0 && (
                                    <div className="flex justify-between text-red-500 font-medium">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(selectedSale.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-400">VAT / Tax</span>
                                    <span className="font-medium text-slate-850 dark:text-white">{formatCurrency(selectedSale.tax)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-base font-extrabold">
                                    <span className="text-slate-850 dark:text-white">Grand Total</span>
                                    <span className="text-emerald-500">{formatCurrency(selectedSale.grand_total)}</span>
                                </div>
                            </div>

                            {selectedSale.notes && (
                                <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800/80 text-xs">
                                    <span className="font-bold text-slate-400 block mb-0.5">Notes</span>
                                    <span className="text-slate-600 dark:text-slate-350">{selectedSale.notes}</span>
                                </div>
                            )}

                            {selectedSale.status === 'voided' && (
                                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-3 text-center text-red-700 dark:text-red-400 text-xs font-bold uppercase tracking-wide">
                                    This Transaction was VOIDED
                                </div>
                            )}
                        </div>

                        {/* Actions (Void Transaction) */}
                        {selectedSale.status === 'completed' && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-3">
                                <button
                                    onClick={() => handleVoid(selectedSale.id)}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 font-bold text-sm transition"
                                >
                                    <RotateCcw className="h-4.5 w-4.5" />
                                    Void & Restore Stock
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
