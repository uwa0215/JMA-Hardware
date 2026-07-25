import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import { 
    ShoppingCart, 
    Search, 
    Plus, 
    Minus, 
    Trash2, 
    Coins, 
    CreditCard, 
    Smartphone, 
    Check, 
    ChevronRight,
    AlertTriangle,
    X,
    FileText,
    Receipt
} from 'lucide-react';

interface Category {
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
}

interface POSProps {
    products: Product[];
    categories: Category[];
}

interface CartItem {
    product_id: number;
    sku: string;
    name: string;
    unit: string;
    cost_price: number;
    selling_price: number;
    quantity: number;
    stock_quantity: number;
}

export default function Index({ products: initialProducts, categories }: POSProps) {
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [cart, setCart] = useState<CartItem[]>([]);
    
    // Checkout animation / confirmation states
    const [isCheckoutProcessing, setIsCheckoutProcessing] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    
    // POS filter states
    const [searchVal, setSearchVal] = useState('');

    // Checkout states
    const [discount, setDiscount] = useState<number>(0);
    const [taxRate, setTaxRate] = useState<number>(12); // Default 12% VAT in PH
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'GCash' | 'PayMaya' | 'Debt'>('Cash');
    const [customerName, setCustomerName] = useState('');
    const [cashReceived, setCashReceived] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [activeMobileTab, setActiveMobileTab] = useState<'catalog' | 'cart'>('catalog');

    // Invoice Success Modal
    const [successInvoice, setSuccessInvoice] = useState<any | null>(null);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [lastCashReceived, setLastCashReceived] = useState<number>(0);
    const [lastChangeDue, setLastChangeDue] = useState<number>(0);

    const confettiFlakes = useMemo(() => {
        if (!showSuccessOverlay) return [];
        const colors = ['bg-emerald-500', 'bg-teal-400', 'bg-amber-400', 'bg-blue-400', 'bg-pink-400', 'bg-purple-400'];
        const shapes = ['rounded-full', 'rounded-sm', 'w-3 h-1.5'];
        return Array.from({ length: 80 }).map((_, i) => ({
            id: i,
            left: `${Math.random() * 100}%`,
            delay: `${Math.random() * 2.5}s`,
            duration: `${2.5 + Math.random() * 2}s`,
            color: colors[Math.floor(Math.random() * colors.length)],
            shape: shapes[Math.floor(Math.random() * shapes.length)],
            scale: 0.5 + Math.random() * 0.8,
            rotate: `${Math.random() * 360}deg`
        }));
    }, [showSuccessOverlay]);

    // Audio cues (synthesized using Web Audio API for interactive clicks, checkout success, and warnings)
    const playSound = (type: 'add' | 'click' | 'success' | 'warn') => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'add') {
                osc.frequency.setValueAtTime(600, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.1);
            } else if (type === 'click') {
                osc.frequency.setValueAtTime(400, ctx.currentTime);
                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.05);
            } else if (type === 'success') {
                osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
                osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
                osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.3);
            } else if (type === 'warn') {
                osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
                gain.gain.setValueAtTime(0.2, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.25);
            }
        } catch (e) {
            // Ignore if blocked by browser autoplay rules
        }
    };

    // Filtered Products Catalog
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            return p.name.toLowerCase().includes(searchVal.toLowerCase()) || 
                   p.sku.toLowerCase().includes(searchVal.toLowerCase());
        });
    }, [products, searchVal]);

    // Cart Actions
    const addToCart = (product: Product) => {
        if (product.stock_quantity <= 0) {
            playSound('warn');
            alert('This product is out of stock!');
            return;
        }

        const existingIndex = cart.findIndex(item => item.product_id === product.id);

        if (existingIndex > -1) {
            const existingItem = cart[existingIndex];
            if (existingItem.quantity >= product.stock_quantity) {
                playSound('warn');
                alert(`Cannot add more. Only ${product.stock_quantity} items are in stock.`);
                return;
            }
            const updated = [...cart];
            updated[existingIndex].quantity += 1;
            setCart(updated);
        } else {
            setCart([...cart, {
                product_id: product.id,
                sku: product.sku,
                name: product.name,
                unit: product.unit,
                cost_price: Number(product.cost_price),
                selling_price: Number(product.selling_price),
                quantity: 1,
                stock_quantity: product.stock_quantity,
            }]);
        }
        playSound('add');
    };

    const updateQty = (productId: number, delta: number) => {
        const item = cart.find(item => item.product_id === productId);
        if (!item) return;

        const newQty = item.quantity + delta;
        if (newQty <= 0) {
            removeFromCart(productId);
            return;
        }

        if (newQty > item.stock_quantity) {
            playSound('warn');
            alert(`Cannot exceed available stock of ${item.stock_quantity} ${item.unit}.`);
            return;
        }

        setCart(cart.map(i => i.product_id === productId ? { ...i, quantity: newQty } : i));
        playSound('click');
    };

    const removeFromCart = (productId: number) => {
        setCart(cart.filter(item => item.product_id !== productId));
        playSound('warn');
    };

    const clearCart = () => {
        if (confirm('Are you sure you want to empty the checkout cart?')) {
            setCart([]);
            setDiscount(0);
            setCashReceived('');
            playSound('warn');
        }
    };

    // Checkout Calculations
    const subtotal = useMemo(() => {
        return cart.reduce((acc, item) => acc + (item.selling_price * item.quantity), 0);
    }, [cart]);

    const taxAmount = useMemo(() => {
        const afterDiscount = subtotal - discount;
        const tax = afterDiscount * (taxRate / 100);
        return tax > 0 ? tax : 0;
    }, [subtotal, discount, taxRate]);

    const grandTotal = useMemo(() => {
        const total = subtotal - discount + taxAmount;
        return total > 0 ? total : 0;
    }, [subtotal, discount, taxAmount]);

    const changeDue = useMemo(() => {
        const received = parseFloat(cashReceived);
        if (isNaN(received) || received < grandTotal) return 0;
        return received - grandTotal;
    }, [cashReceived, grandTotal]);

    // Form submission
    const form = useForm<{
        customer_name: string;
        discount: number;
        tax: number;
        payment_method: 'Cash' | 'GCash' | 'PayMaya' | 'Debt';
        notes: string;
        items: Array<{ product_id: number; quantity: number }>;
    }>({
        customer_name: '',
        discount: 0,
        tax: 12,
        payment_method: 'Cash',
        notes: '',
        items: [],
    });

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        if (paymentMethod === 'Cash') {
            const received = parseFloat(cashReceived);
            if (isNaN(received) || received < grandTotal) {
                playSound('warn');
                alert('Please input a valid Cash Received amount equal to or greater than the Grand Total.');
                return;
            }
        }

        if (paymentMethod === 'Debt') {
            const cleanName = customerName.trim();
            if (!cleanName || cleanName.toLowerCase() === 'walk-in customer' || cleanName.toLowerCase() === 'walk-in') {
                playSound('warn');
                alert('Please enter a valid Customer Name to record this debt. Debt cannot be recorded anonymously.');
                return;
            }
        }

        // Show scanning / processing loading overlay first
        setIsCheckoutProcessing(true);
        setTimeout(() => {
            setIsCheckoutProcessing(false);
            setIsConfirmModalOpen(true);
        }, 1500);
    };

    const submitCheckout = () => {
        setIsConfirmModalOpen(false);
        router.post(route('sales.store'), {
            customer_name: customerName || 'Walk-in Customer',
            discount: discount,
            tax: taxRate,
            payment_method: paymentMethod,
            notes: notes,
            items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
        }, {
            onSuccess: (page) => {
                const invoice = (page.props as any).flash?.invoice || (page.props as any).invoice;
                
                // Update our local products stock quantities instantly
                const updatedProducts = products.map(p => {
                    const cartItem = cart.find(c => c.product_id === p.id);
                    if (cartItem) {
                        return { ...p, stock_quantity: p.stock_quantity - cartItem.quantity };
                    }
                    return p;
                });
                setProducts(updatedProducts);

                // Show invoice modal
                setLastCashReceived(parseFloat(cashReceived) || 0);
                setLastChangeDue(changeDue);
                setSuccessInvoice(invoice);
                setShowSuccessOverlay(true);
                setCart([]);
                setDiscount(0);
                setCustomerName('');
                setNotes('');
                setCashReceived('');
                playSound('success');
            },
            onError: (err: any) => {
                playSound('warn');
                alert(err.error || 'Failed to complete transaction.');
            }
        });
    };

    const formatCurrency = (num: number) => {
        return '₱' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <ShoppingCart className="h-6 w-6 text-emerald-500" />
                    <span>POS Terminal Checkout</span>
                </div>
            }
        >
            <Head title="POS Terminal" />

            <div className="flex flex-col h-[calc(100vh-170px)] md:h-[calc(100vh-180px)] overflow-hidden animate-fade-in">
                {/* Mobile Switch Tabs */}
                <div className="flex xl:hidden gap-2 bg-slate-105 dark:bg-slate-900/60 p-1.5 rounded-xl mb-4 shrink-0">
                    <button
                        onClick={() => { setActiveMobileTab('catalog'); playSound('click'); }}
                        className={`flex-1 py-2.5 text-center rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                            activeMobileTab === 'catalog'
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white'
                        }`}
                    >
                        Product Catalog
                    </button>
                    <button
                        onClick={() => { setActiveMobileTab('cart'); playSound('click'); }}
                        className={`flex-1 py-2.5 text-center rounded-lg text-xs font-bold transition-all duration-200 flex justify-center items-center gap-2 cursor-pointer ${
                            activeMobileTab === 'cart'
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white'
                        }`}
                    >
                        <span>Checkout Cart</span>
                        {cart.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-5 h-5 flex items-center justify-center animate-bounce-slow">
                                {cart.reduce((sum, item) => sum + item.quantity, 0)}
                            </span>
                        )}
                    </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 flex-1 min-h-0 gap-6 xl:gap-8 overflow-hidden">
                    {/* LEFT SIDE: CATALOG (7 cols) */}
                    <div className={`xl:col-span-7 flex flex-col h-full min-h-0 space-y-4 ${activeMobileTab === 'catalog' ? 'flex' : 'hidden xl:flex'}`}>
                    {/* Catalog Header - Search & Filter */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-455" />
                            <input 
                                type="text"
                                value={searchVal}
                                onChange={e => setSearchVal(e.target.value)}
                                placeholder="Quick search product name or SKU..."
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-white"
                            />
                            {searchVal && (
                                <button onClick={() => setSearchVal('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"><X className="h-4.5 w-4.5" /></button>
                            )}
                        </div>
                    </div>

                    {/* Catalog Catalog Cards Grid */}
                    <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {filteredProducts.map((p) => {
                            const isLowStock = p.stock_quantity <= p.reorder_level;
                            const isOut = p.stock_quantity <= 0;
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => !isOut && addToCart(p)}
                                    className={`
                                        bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between cursor-pointer select-none transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] group
                                        ${isOut ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50' : ''}
                                    `}
                                >
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase">{p.sku}</span>
                                        <h4 className="font-extrabold text-sm text-slate-850 dark:text-white line-clamp-2 h-10 leading-tight group-hover:text-emerald-550 transition-colors duration-200">
                                            {p.name}
                                        </h4>
                                    </div>

                                    <div className="mt-4 flex justify-between items-end">
                                        <div className="space-y-0.5">
                                            <span className="text-xs text-slate-400">Unit: {p.unit}</span>
                                            <div className="font-extrabold text-base text-emerald-500">
                                                ₱{Number(p.selling_price).toFixed(2)}
                                            </div>
                                        </div>

                                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                            isOut 
                                                ? 'bg-red-150 text-red-700' 
                                                : isLowStock 
                                                    ? 'bg-amber-100 text-amber-800' 
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                            {isOut ? 'OUT' : `Qty: ${p.stock_quantity}`}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT SIDE: CART & CHECKOUT (5 cols) */}
                <div className={`xl:col-span-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col h-full min-h-0 overflow-hidden ${activeMobileTab === 'cart' ? 'flex' : 'hidden xl:flex'}`}>
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-emerald-500" />
                            <h3 className="font-bold text-slate-850 dark:text-white">Active Checkout Cart</h3>
                        </div>
                        {cart.length > 0 && (
                            <button 
                                onClick={clearCart}
                                className="text-xs font-bold text-red-500 hover:underline"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 divide-y divide-slate-100 dark:divide-slate-800/80">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <ShoppingCart className="h-12 w-12 stroke-1 mb-2 text-slate-300" />
                                <span className="text-sm">Cart is empty. Click items on the left to add.</span>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.product_id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                                    <div className="min-w-0 pr-4 space-y-0.5">
                                        <p className="font-semibold text-sm text-slate-800 dark:text-white truncate">{item.name}</p>
                                        <p className="text-xs text-slate-400">₱{item.selling_price.toFixed(2)} / {item.unit}</p>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        {/* Qty selectors */}
                                        <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950">
                                            <button 
                                                onClick={() => updateQty(item.product_id, -1)}
                                                className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="px-2 text-xs font-bold text-slate-850 dark:text-white">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQty(item.product_id, 1)}
                                                className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>

                                        {/* Price */}
                                        <span className="w-20 text-right font-bold text-sm text-slate-900 dark:text-white">
                                            ₱{(item.selling_price * item.quantity).toFixed(2)}
                                        </span>

                                        <button 
                                            onClick={() => removeFromCart(item.product_id)}
                                            className="p-1 rounded-lg text-slate-400 hover:text-red-500 transition"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Financial Summary & Checkout Options */}
                    <form onSubmit={handleCheckout} className="border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/20 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 block">Customer Name</label>
                                <input 
                                    type="text"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    placeholder="Walk-in Customer"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-950 dark:text-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-400 block">Discount (₱ Cash)</label>
                                <input 
                                    type="number"
                                    min="0"
                                    value={discount === 0 ? '' : discount}
                                    onChange={e => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                                    placeholder="₱0.00"
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-950 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-400 block">Payment Method</label>
                            <div className="grid grid-cols-4 gap-2">
                                {(
                                    [
                                        { name: 'Cash', icon: Coins },
                                        { name: 'GCash', icon: Smartphone },
                                        { name: 'PayMaya', icon: Smartphone },
                                        { name: 'Debt', icon: FileText },
                                    ] as const
                                ).map(method => {
                                    const Icon = method.icon;
                                    return (
                                        <button
                                            key={method.name}
                                            type="button"
                                            onClick={() => { setPaymentMethod(method.name); playSound('click'); }}
                                            className={`
                                                py-2 rounded-xl flex flex-col items-center gap-1 text-xs font-bold border transition
                                                ${paymentMethod === method.name 
                                                    ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-950'
                                                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
                                                }
                                            `}
                                        >
                                            <Icon className="h-4 w-4" />
                                            <span>{method.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Cash calculator (only for cash payments) */}
                        {paymentMethod === 'Cash' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-450 block">Cash Received (₱)</label>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        value={cashReceived}
                                        onChange={e => setCashReceived(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-1.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-950 dark:text-white"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-semibold text-slate-450 block">Change Due</span>
                                    <div className="font-extrabold text-lg text-emerald-500 pt-1">
                                        {formatCurrency(changeDue)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Totals Summary */}
                        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Subtotal:</span>
                                <span className="font-medium text-slate-800 dark:text-white">{formatCurrency(subtotal)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between text-red-500">
                                    <span>Discount:</span>
                                    <span>-{formatCurrency(discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-slate-400">VAT (12% Included):</span>
                                <span className="font-medium text-slate-800 dark:text-white">{formatCurrency(taxAmount)}</span>
                            </div>
                            <div className="flex justify-between text-base font-extrabold border-t border-slate-200 dark:border-slate-800 pt-2">
                                <span className="text-slate-950 dark:text-white">Grand Total:</span>
                                <span className="text-emerald-500 text-lg">{formatCurrency(grandTotal)}</span>
                            </div>
                        </div>

                        {/* Checkout button */}
                        <button
                            type="submit"
                            disabled={cart.length === 0 || form.processing}
                            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/10 hover:shadow-emerald-650/20 active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:bg-emerald-500 disabled:shadow-none"
                        >
                            <span>Proceed & Complete Checkout</span>
                            <ChevronRight className="h-4.5 w-4.5" />
                        </button>
                    </form>
                </div>
            </div>
            </div>

            {/* INVOICE SUCCESS MODAL (RECEIPT PRINTOUT STYLE) */}
            {successInvoice && !showSuccessOverlay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                            <span className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5"><Receipt className="h-4.5 w-4.5 text-emerald-500" /> Transaction Success</span>
                            <button onClick={() => setSuccessInvoice(null)} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="text-center space-y-1">
                                <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-wide">JMA HARDWARE</h3>
                                <p className="text-xs text-slate-400">123 Construction Rd, Metro Manila</p>
                                <p className="text-xs text-slate-400">Tel: (02) 8888-1234</p>
                            </div>

                            <div className="grid grid-cols-2 gap-y-2 border-t border-b border-dashed border-slate-200 dark:border-slate-800 py-3 text-[11px] text-slate-500">
                                <div>Invoice No:</div>
                                <div className="font-bold text-slate-900 dark:text-white text-right">{successInvoice.invoice_number}</div>

                                <div>Date / Time:</div>
                                <div className="text-right">{new Date(successInvoice.created_at).toLocaleString()}</div>

                                <div>Cashier:</div>
                                <div className="text-right">{successInvoice.user?.name || 'System'}</div>

                                <div>Customer:</div>
                                <div className="text-right font-medium">{successInvoice.customer_name}</div>
                            </div>

                            <div className="space-y-3">
                                {successInvoice.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-start text-xs">
                                        <div className="space-y-0.5">
                                            <p className="font-bold text-slate-850 dark:text-white leading-tight">{item.product?.name}</p>
                                            <p className="text-slate-400">{item.quantity} × ₱{Number(item.selling_price).toFixed(2)}</p>
                                        </div>
                                        <span className="font-bold text-slate-900 dark:text-white ml-2">₱{Number(item.total_price).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-dashed border-slate-250 dark:border-slate-800 pt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-350">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(successInvoice.total_amount)}</span>
                                </div>
                                {Number(successInvoice.discount) > 0 && (
                                    <div className="flex justify-between text-red-500">
                                        <span>Discount:</span>
                                        <span>-{formatCurrency(successInvoice.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>VAT / Tax (12%):</span>
                                    <span>{formatCurrency(successInvoice.tax)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-sm font-extrabold text-slate-900 dark:text-white">
                                    <span>Grand Total:</span>
                                    <span className="text-emerald-500 text-base">{formatCurrency(successInvoice.grand_total)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                            <button
                                onClick={() => setSuccessInvoice(null)}
                                className="w-full py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold text-sm shadow-md transition"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* STUNNING TRANSACTION COMPLETE ANIMATION OVERLAY */}
            {showSuccessOverlay && successInvoice && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-hidden select-none">
                    {/* Render Confetti */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {confettiFlakes.map((flake) => (
                            <div 
                                key={flake.id} 
                                className={`absolute w-3 h-3 ${flake.shape} ${flake.color} animate-confetti-fall`}
                                style={{
                                    left: flake.left,
                                    animationDelay: flake.delay,
                                    animationDuration: flake.duration,
                                    transform: `rotate(${flake.rotate})`,
                                }}
                            />
                        ))}
                    </div>

                    {/* Glow element behind checkmark */}
                    <div className="absolute w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl animate-success-glow pointer-events-none" />

                    {/* Main Card */}
                    <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center animate-scale-up z-10">
                        
                        {/* SVG Animated Checkmark */}
                        <div className="mb-6 flex justify-center">
                            <svg className="w-24 h-24 text-emerald-500" viewBox="0 0 52 52">
                                <circle className="animate-draw-circle fill-none stroke-current" strokeWidth="3" cx="26" cy="26" r="25" strokeLinecap="round" />
                                <path className="animate-draw-check fill-none stroke-current" strokeWidth="4" strokeLinecap="round" d="M14 27l7.5 7.5L38 18" />
                            </svg>
                        </div>

                        {/* Glowing Success Text */}
                        <h2 className="text-2xl font-black mb-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 bg-clip-text text-transparent tracking-wide">
                            TRANSACTION COMPLETE!
                        </h2>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 font-semibold uppercase tracking-wider">
                            Invoice: {successInvoice.invoice_number}
                        </p>

                        {/* Detailed Info Card */}
                        <div className="w-full bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 rounded-2xl p-5 mb-6 text-left space-y-4 animate-slide-up-fade" style={{ animationDelay: '0.4s' }}>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 dark:text-slate-500 font-bold">CUSTOMER</span>
                                <span className="font-extrabold text-slate-800 dark:text-white truncate max-w-[200px]">
                                    {successInvoice.customer_name}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-450 dark:text-slate-500 font-bold">PAYMENT METHOD</span>
                                <span className="font-extrabold text-slate-850 dark:text-white uppercase flex items-center gap-1.5">
                                    {paymentMethod === 'Cash' && <Coins className="w-3.5 h-3.5 text-emerald-500 animate-bounce-slow" />}
                                    {(paymentMethod === 'GCash' || paymentMethod === 'PayMaya') && <Smartphone className="w-3.5 h-3.5 text-sky-500" />}
                                    {paymentMethod}
                                </span>
                            </div>
                            <div className="border-t border-slate-100 dark:border-slate-800/80 my-3" />
                            <div className="flex justify-between items-center">
                                <span className="text-slate-455 dark:text-slate-500 text-xs font-bold">TOTAL CHARGED</span>
                                <span className="text-lg font-black text-slate-900 dark:text-white">
                                    {formatCurrency(Number(successInvoice.grand_total))}
                                </span>
                            </div>

                            {paymentMethod === 'Cash' && (
                                <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 flex justify-between items-center animate-pulse-slow">
                                                                    <div>
                                        <span className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70 font-black tracking-wider uppercase block">Cash Received</span>
                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatCurrency(lastCashReceived)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70 font-black tracking-wider uppercase block">Change Due</span>
                                        <span className="text-base font-black text-emerald-500 dark:text-emerald-450">{formatCurrency(lastChangeDue)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Buttons */}
                        <div className="w-full flex flex-col gap-3 animate-slide-up-fade" style={{ animationDelay: '0.6s' }}>
                            <button
                                onClick={() => setShowSuccessOverlay(false)}
                                className="w-full py-3.5 rounded-xl bg-slate-950 dark:bg-white dark:text-slate-950 text-white font-extrabold text-sm hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center gap-2 animate-shimmer"
                            >
                                <FileText className="w-4.5 h-4.5" />
                                <span>View & Print Receipt</span>
                            </button>
                            <button
                                onClick={() => {
                                    setShowSuccessOverlay(false);
                                    setSuccessInvoice(null);
                                }}
                                className="w-full py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 font-extrabold text-sm text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 active:scale-[0.98] transition flex items-center justify-center gap-2"
                            >
                                <Check className="w-4.5 h-4.5 text-emerald-500" />
                                <span>Done & New Sale</span>
                            </button>
                        </div>

                    </div>
                </div>
            )

            }

            {/* CHECKOUT LOADING OVERLAY */}
            {isCheckoutProcessing && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in">
                    <div className="flex flex-col items-center space-y-6 p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-center max-w-sm w-full mx-4">
                        {/* Scanning / Loading animation */}
                        <div className="relative w-20 h-20">
                            {/* Outer spinning ring */}
                            <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                            {/* Inner pulsing circle */}
                            <div className="absolute inset-4 rounded-full bg-emerald-500/10 flex items-center justify-center animate-pulse">
                                <ShoppingCart className="h-6 w-6 text-emerald-400" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="font-extrabold text-white text-base tracking-wide">Processing Order</h3>
                            <p className="text-xs text-slate-400 leading-normal">Verifying stock inventory & preparing invoice details...</p>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRMATION DIALOG MODAL */}
            {isConfirmModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-scale-up max-h-[85vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                            <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                                <Check className="h-5 w-5 text-emerald-500" />
                                Confirm Purchased Products
                            </span>
                            <button onClick={() => setIsConfirmModalOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            {/* Summary info */}
                            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 text-xs">
                                <div>
                                    <span className="text-slate-400 block font-semibold">Customer</span>
                                    <span className="font-bold text-slate-800 dark:text-white truncate block">{customerName || 'Walk-in Customer'}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-slate-400 block font-semibold">Payment Method</span>
                                    <span className="font-bold text-slate-800 dark:text-white">{paymentMethod}</span>
                                </div>
                            </div>

                            {/* Items list */}
                            <div className="space-y-2">
                                <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Order Details</h4>
                                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 space-y-2 max-h-40 overflow-y-auto">
                                    {cart.map((item) => (
                                        <div key={item.product_id} className="flex justify-between items-start py-2 first:pt-0 last:pb-0 text-xs">
                                            <div className="space-y-0.5 min-w-0 pr-4">
                                                <p className="font-bold text-slate-800 dark:text-white truncate">{item.name}</p>
                                                <p className="text-slate-400">{item.sku} | {item.quantity} {item.unit} × ₱{item.selling_price.toFixed(2)}</p>
                                            </div>
                                            <span className="font-bold text-slate-800 dark:text-white shrink-0">₱{(item.selling_price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Subtotal</span>
                                    <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(subtotal)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-red-500 font-semibold">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-slate-400">VAT (12% Included)</span>
                                    <span className="font-bold text-slate-800 dark:text-white">{formatCurrency(taxAmount)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-2 text-sm font-black">
                                    <span className="text-slate-900 dark:text-white">Grand Total</span>
                                    <span className="text-emerald-500 text-base">{formatCurrency(grandTotal)}</span>
                                </div>
                                {paymentMethod === 'Cash' && (
                                    <div className="grid grid-cols-2 gap-4 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100/50 dark:border-emerald-500/10 text-xs mt-2">
                                        <div>
                                            <span className="text-emerald-600/80 dark:text-emerald-450 block font-semibold">Cash Received</span>
                                            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">₱{parseFloat(cashReceived).toFixed(2)}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-emerald-600/80 dark:text-emerald-450 block font-semibold">Change Due</span>
                                            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">{formatCurrency(changeDue)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsConfirmModalOpen(false)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm transition font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitCheckout}
                                disabled={form.processing}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-md transition disabled:opacity-50"
                            >
                                {form.processing ? 'Processing...' : 'Confirm & Complete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
