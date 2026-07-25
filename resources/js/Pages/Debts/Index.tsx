import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Coins, 
    Search, 
    Eye, 
    X, 
    CheckCircle, 
    Calendar, 
    User as UserIcon,
    AlertTriangle,
    Smartphone,
    CreditCard,
    Info
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
    debts: {
        data: Sale[];
        current_page: number;
        last_page: number;
        links: PaginationLink[];
        total: number;
    };
    filters: {
        search?: string;
    };
    metrics: {
        total_outstanding: number;
        debtors_count: number;
        oldest_debt_date: string | null;
    };
}

export default function Index({ debts, filters, metrics }: IndexProps) {
    const [searchVal, setSearchVal] = useState(filters.search || '');
    const [selectedDebt, setSelectedDebt] = useState<Sale | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
    const [settleMethod, setSettleMethod] = useState<'Cash' | 'GCash' | 'PayMaya'>('Cash');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('debts.index'), { search: searchVal }, { preserveState: true });
    };

    const clearSearch = () => {
        setSearchVal('');
        router.get(route('debts.index'), {});
    };

    const openDetails = (sale: Sale) => {
        setSelectedDebt(sale);
        setIsDetailModalOpen(true);
    };

    const openSettle = (sale: Sale) => {
        setSelectedDebt(sale);
        setIsSettleModalOpen(true);
    };

    const handleSettle = () => {
        if (!selectedDebt) return;
        setIsProcessing(true);
        router.post(route('sales.pay-debt', selectedDebt.id), {
            payment_method: settleMethod
        }, {
            onSuccess: () => {
                setIsSettleModalOpen(false);
                setIsDetailModalOpen(false);
                setSelectedDebt(null);
                setIsProcessing(false);
            },
            onError: (err: any) => {
                alert(err.error || 'Failed to settle debt.');
                setIsProcessing(false);
            }
        });
    };

    const formatCurrency = (val: number | string) => {
        return '₱' + Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <Coins className="h-6 w-6 text-emerald-500 animate-pulse-slow" />
                    <span>Customer Debt Monitoring</span>
                </div>
            }
        >
            <Head title="Customer Debts" />

            <div className="space-y-6 animate-fade-in">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card 1: Total Outstanding */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-400 tracking-wider block uppercase">Total Outstanding Debt</span>
                            <h3 className="text-2xl font-black text-red-500 dark:text-red-400">
                                {formatCurrency(metrics.total_outstanding)}
                            </h3>
                        </div>
                        <div className="p-3 bg-red-500/10 rounded-2xl">
                            <Coins className="h-6 w-6 text-red-500" />
                        </div>
                    </div>

                    {/* Card 2: Active Debtors Count */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-400 tracking-wider block uppercase">Active Debtors</span>
                            <h3 className="text-2xl font-black text-slate-850 dark:text-white">
                                {metrics.debtors_count} {metrics.debtors_count === 1 ? 'Person' : 'People'}
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-2xl">
                            <UserIcon className="h-6 w-6 text-emerald-500" />
                        </div>
                    </div>

                    {/* Card 3: Oldest Outstanding Debt */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-slate-400 tracking-wider block uppercase">Oldest Unresolved Debt</span>
                            <h3 className="text-sm font-extrabold text-slate-850 dark:text-white">
                                {metrics.oldest_debt_date ? new Date(metrics.oldest_debt_date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                }) : 'No debts outstanding'}
                            </h3>
                        </div>
                        <div className="p-3 bg-amber-500/10 rounded-2xl">
                            <Calendar className="h-6 w-6 text-amber-500" />
                        </div>
                    </div>
                </div>

                {/* Search Header */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
                            <input 
                                type="text"
                                value={searchVal}
                                onChange={e => setSearchVal(e.target.value)}
                                placeholder="Search debts by customer name or invoice number..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-transparent text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-white"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button 
                                type="button" 
                                onClick={clearSearch}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition flex-1 sm:flex-none text-center justify-center"
                            >
                                Reset
                            </button>
                            <button 
                                type="submit"
                                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition flex-1 sm:flex-none text-center justify-center"
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
                                    <th className="py-4 px-6 text-right">Debt Amount</th>
                                    <th className="py-4 px-6 text-center">Status</th>
                                    <th className="py-4 px-6 text-center">Cashier</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {debts.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            <Coins className="h-10 w-10 mx-auto stroke-1 mb-2 text-slate-350" />
                                            <span>No outstanding debts found.</span>
                                        </td>
                                    </tr>
                                ) : (
                                    debts.data.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/10 transition duration-150">
                                            <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                                                {sale.invoice_number}
                                            </td>
                                            <td className="py-4 px-6 text-sm text-slate-650 dark:text-slate-300 font-extrabold">
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
                                            <td className="py-4 px-6 text-right text-sm font-bold text-red-500 dark:text-red-400">
                                                {formatCurrency(sale.grand_total)}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400 animate-pulse-slow">
                                                    UNPAID
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center text-xs text-slate-500">
                                                {sale.user?.name || 'System'}
                                            </td>
                                            <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                                                <button
                                                    onClick={() => openDetails(sale)}
                                                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-750 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                                                    title="View Items"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => openSettle(sale)}
                                                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-sm hover:shadow-md transition inline-flex items-center gap-1 cursor-pointer"
                                                >
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    <span>Settle Debt</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {debts.links.length > 3 && (
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                                Showing {debts.data.length} of {debts.total} customer debts
                            </span>
                            <div className="flex gap-1">
                                {debts.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`
                                            px-3 py-1.5 rounded-lg text-xs font-bold transition
                                            ${!link.url ? 'opacity-40 pointer-events-none' : ''}
                                            ${link.active 
                                                ? 'bg-emerald-500 text-white shadow-md' 
                                                : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300'
                                            }
                                        `}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* DETAILS VIEW MODAL */}
            {isDetailModalOpen && selectedDebt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-scale-up max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                            <span className="font-extrabold text-slate-855 dark:text-white flex items-center gap-1.5"><Info className="h-4.5 w-4.5 text-emerald-500" /> Debt Invoice Details</span>
                            <button onClick={() => setIsDetailModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"><X className="h-5 w-5" /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-5 flex-1">
                            <div className="grid grid-cols-2 gap-y-2 border-b border-slate-100 dark:border-slate-800 pb-3 text-xs text-slate-500">
                                <div>Invoice No:</div>
                                <div className="font-bold text-slate-900 dark:text-white text-right">{selectedDebt.invoice_number}</div>

                                <div>Date / Time:</div>
                                <div className="text-right">{new Date(selectedDebt.created_at).toLocaleString()}</div>

                                <div>Debtor Name:</div>
                                <div className="text-right font-extrabold text-slate-900 dark:text-white">{selectedDebt.customer_name}</div>

                                <div>Cashier Recorded:</div>
                                <div className="text-right">{selectedDebt.user?.name || 'System'}</div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Purchased Items</h4>
                                <div className="space-y-2 divide-y divide-slate-100 dark:divide-slate-800/80 max-h-40 overflow-y-auto pr-1">
                                    {selectedDebt.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start text-xs pt-2 first:pt-0">
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-slate-850 dark:text-white leading-tight">{item.product?.name}</p>
                                                <p className="text-slate-400">{item.quantity} × {item.product?.unit || 'pcs'} × ₱{Number(item.selling_price).toFixed(2)}</p>
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white ml-2">₱{Number(item.total_price).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5 text-xs text-slate-650 dark:text-slate-350">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(selectedDebt.total_amount)}</span>
                                </div>
                                {Number(selectedDebt.discount) > 0 && (
                                    <div className="flex justify-between text-red-500">
                                        <span>Discount:</span>
                                        <span>-{formatCurrency(selectedDebt.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>VAT / Tax (12%):</span>
                                    <span>{formatCurrency(selectedDebt.tax)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-150 dark:border-slate-800 pt-2 text-sm font-black text-slate-900 dark:text-white">
                                    <span>Grand Total:</span>
                                    <span className="text-red-500 dark:text-red-400 text-base">{formatCurrency(selectedDebt.grand_total)}</span>
                                </div>
                            </div>

                            {selectedDebt.notes && (
                                <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-850">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Notes</span>
                                    <p className="text-xs text-slate-650 dark:text-slate-400 whitespace-pre-wrap">{selectedDebt.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-3">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setIsDetailModalOpen(false);
                                    openSettle(selectedDebt);
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                                <CheckCircle className="h-4 w-4" />
                                <span>Settle Debt</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SETTLE DEBT MODAL */}
            {isSettleModalOpen && selectedDebt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                            <span className="font-extrabold text-slate-850 dark:text-white flex items-center gap-1.5"><CheckCircle className="h-4.5 w-4.5 text-emerald-500" /> Settle Customer Debt</span>
                            <button onClick={() => setIsSettleModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 cursor-pointer"><X className="h-5 w-5" /></button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div className="text-center space-y-1.5">
                                <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto animate-bounce-slow" />
                                <h3 className="font-extrabold text-base text-slate-850 dark:text-white">Record Debt Settlement</h3>
                                <p className="text-xs text-slate-500 leading-normal">
                                    You are marking the debt of <strong className="text-slate-900 dark:text-white font-black">{selectedDebt.customer_name}</strong> for <strong className="text-emerald-500 font-extrabold">{formatCurrency(selectedDebt.grand_total)}</strong> as paid.
                                </p>
                            </div>

                            {/* Payment Method Selector */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Settle via Payment Method</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(
                                        [
                                            { name: 'Cash', icon: Coins },
                                            { name: 'GCash', icon: Smartphone },
                                            { name: 'PayMaya', icon: Smartphone },
                                        ] as const
                                    ).map(method => {
                                        const Icon = method.icon;
                                        return (
                                            <button
                                                key={method.name}
                                                type="button"
                                                onClick={() => setSettleMethod(method.name)}
                                                className={`
                                                    py-3 rounded-xl flex flex-col items-center gap-1 text-xs font-bold border transition duration-150 cursor-pointer
                                                    ${settleMethod === method.name 
                                                        ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-950 shadow-md scale-102 font-black'
                                                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
                                                    }
                                                `}
                                            >
                                                <Icon className="h-4.5 w-4.5" />
                                                <span>{method.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-3">
                            <button
                                onClick={() => setIsSettleModalOpen(false)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-sm text-slate-600 dark:text-slate-300 transition cursor-pointer"
                                disabled={isProcessing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSettle}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                                disabled={isProcessing}
                            >
                                {isProcessing ? 'Processing...' : 'Confirm Settle'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
