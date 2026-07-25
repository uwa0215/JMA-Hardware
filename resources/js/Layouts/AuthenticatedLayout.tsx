import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    ShoppingCart, 
    Package, 
    Tags, 
    Truck, 
    History, 
    User, 
    LogOut, 
    Menu, 
    X, 
    Cpu, 
    Sun, 
    Moon,
    Coins
} from 'lucide-react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const user = usePage().props.auth.user;
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'dark';
        }
        return 'dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const navigation = [
        { name: 'Dashboard', href: route('dashboard'), icon: LayoutDashboard, active: route().current('dashboard') },
        { name: 'POS Checkout', href: route('pos.index'), icon: ShoppingCart, active: route().current('pos.index') },
        { name: 'Products Inventory', href: route('products.index'), icon: Package, active: route().current('products.index') },
        { name: 'Suppliers', href: route('suppliers.index'), icon: Truck, active: route().current('suppliers.index') },
        { name: 'Sales History', href: route('sales.index'), icon: History, active: route().current('sales.index') },
        { name: 'Customer Debts', href: route('debts.index'), icon: Coins, active: route().current('debts.index') },
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col md:flex-row">
            
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 border-b border-slate-800">
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-emerald-400">
                    <Cpu className="h-6 w-6 text-emerald-400" />
                    <span>JMA Hardware</span>
                </Link>
                <div className="flex items-center gap-2">
                    <Link 
                        href={route('logout')} 
                        method="post" 
                        as="button"
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition duration-200 cursor-pointer"
                        title="Log Out"
                    >
                        <LogOut className="h-5 w-5" />
                    </Link>
                    <button 
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 focus:outline-none"
                    >
                        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Sidebar Overlay for Mobile */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-300 border-r border-slate-800 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo Section */}
                <div className="flex h-16 items-center gap-2 px-6 border-b border-slate-800">
                    <Cpu className="h-8 w-8 text-emerald-400" />
                    <span className="font-bold text-xl text-white tracking-wider">JMA Hardware</span>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                                    ${item.active 
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                        : 'hover:bg-slate-800 hover:text-white'
                                    }
                                `}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Icon className="h-5 w-5 shrink-0" />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Section / Bottom Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/40">
                    <div className="flex items-center justify-between gap-3 px-2 py-2">
                        <Link href={route('profile.edit')} className="min-w-0 flex-1 hover:opacity-80 transition group">
                            <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">{user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </Link>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Link 
                                href={route('profile.edit')} 
                                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition duration-200 cursor-pointer"
                                title="Edit Profile"
                            >
                                <User className="h-4 w-4" />
                            </Link>
                            <Link 
                                href={route('logout')} 
                                method="post" 
                                as="button"
                                className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition duration-200 cursor-pointer"
                                title="Log Out"
                            >
                                <LogOut className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:h-screen md:overflow-y-auto">
                {header && (
                    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between transition-colors duration-300">
                        <div className="font-semibold text-xl text-slate-800 dark:text-white">
                            {header}
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Theme Toggle Button */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all duration-300 shadow-sm hover:scale-105 cursor-pointer"
                                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                {theme === 'dark' ? (
                                    <Sun className="h-4.5 w-4.5 text-amber-500 animate-pulse-slow" />
                                ) : (
                                    <Moon className="h-4.5 w-4.5 text-indigo-500" />
                                )}
                            </button>
                            <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 transition-colors duration-300">
                                Active Session
                            </span>
                        </div>
                    </header>
                )}

                <main className="flex-1 p-4 sm:p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
