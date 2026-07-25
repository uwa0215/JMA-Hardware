import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { 
    Hammer, 
    CheckCircle, 
    Lock, 
    User, 
    Info, 
    Cpu, 
    Eye, 
    EyeOff,
    TrendingUp,
    Shield
} from 'lucide-react';
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    // Auto-fill credential helper
    const fillCredentials = () => {
        setData({
            email: 'Admin',
            password: 'Admin123',
            remember: true
        });
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row relative overflow-hidden font-sans selection:bg-emerald-500 selection:text-white">
            
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

            <Head title="JMA Hardware Login" />

            {/* LEFT SIDE: BRAND / INFO (Visible on md+) */}
            <div className="hidden md:flex md:w-1/2 bg-slate-900/60 backdrop-blur-md border-r border-slate-800/60 p-12 lg:p-16 flex-col justify-between relative z-10">
                <div className="space-y-6">
                    {/* Brand Logo */}
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-2xl shadow-lg shadow-emerald-500/20 text-slate-950">
                            <Hammer className="h-6 w-6 stroke-[2.5]" />
                        </div>
                        <span className="font-extrabold text-2xl text-white tracking-widest bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                            JMA HARDWARE
                        </span>
                    </div>

                    <div className="space-y-4 pt-12">
                        <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                            Smart Inventory &<br />
                            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                                Real-time Sales
                            </span>
                        </h1>
                        <p className="text-slate-400 text-base max-w-md leading-relaxed">
                            A professional-grade management system designed to monitor stocks, log transactions, and maximize the efficiency of your Hardware Store.
                        </p>
                    </div>

                    {/* Features list */}
                    <div className="space-y-4 pt-10">
                        {[
                            { title: 'Interactive POS Checkout', desc: 'Add items, apply discounts, and process transactions in seconds.' },
                            { title: 'Smart Stock Control & Logs', desc: 'Real-time stock tracking with low-inventory warnings.' },
                            { title: 'Profit & Sales Intelligence', desc: 'Visualize sales trends and calculate actual profit margins.' },
                        ].map((feat, idx) => (
                            <div key={idx} className="flex gap-4 items-start group">
                                <div className="mt-1 p-1 bg-slate-800 text-emerald-400 rounded-lg group-hover:bg-emerald-500 group-hover:text-slate-950 transition duration-300">
                                    <CheckCircle className="h-4.5 w-4.5" />
                                </div>
                                <div className="space-y-0.5">
                                    <h4 className="font-semibold text-white text-sm">{feat.title}</h4>
                                    <p className="text-xs text-slate-400 max-w-xs">{feat.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer details */}
                <div className="flex gap-6 text-slate-500 text-xs pt-12">
                    <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Secure Session</span>
                    <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" /> High Performance</span>
                </div>
            </div>

            {/* RIGHT SIDE: LOGIN FORM */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative z-10">
                <div className="w-full max-w-md bg-slate-900/40 border border-slate-800/80 p-8 sm:p-10 rounded-3xl backdrop-blur-xl shadow-2xl flex flex-col justify-center space-y-8">
                    
                    {/* Header info */}
                    <div className="space-y-2">
                        {/* Mobile Logo */}
                        <div className="md:hidden flex items-center gap-2 mb-6 justify-center">
                            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl text-slate-950">
                                <Hammer className="h-5 w-5" />
                            </div>
                            <span className="font-black text-xl text-white tracking-widest">JMA HARDWARE</span>
                        </div>

                        <h2 className="text-2xl font-bold text-white tracking-tight text-center md:text-left">Welcome Back</h2>
                        <p className="text-sm text-slate-400 text-center md:text-left">Enter your credentials to access the console.</p>
                    </div>

                    {status && (
                        <div className="bg-emerald-500/10 border border-emerald-500/35 rounded-xl p-3 text-emerald-400 text-sm font-semibold">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        {/* Email / Username field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Username or Email</label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                                <input
                                    id="email"
                                    type="text"
                                    name="email"
                                    tabIndex={1}
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Enter your username or email"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/60 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-white placeholder-slate-650 transition"
                                    required
                                    autoComplete="username"
                                />
                            </div>
                            {errors.email && <InputError message={errors.email} className="mt-1" />}
                        </div>

                        {/* Password field */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Password</label>
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        tabIndex={6}
                                        className="text-xs text-slate-450 hover:text-emerald-400 hover:underline"
                                    >
                                        Forgot?
                                    </Link>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    tabIndex={2}
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Enter your secret password"
                                    className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-800 bg-slate-950/60 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-white placeholder-slate-650 transition"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    tabIndex={3}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-350"
                                >
                                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                </button>
                            </div>
                            {errors.password && <InputError message={errors.password} className="mt-1" />}
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center">
                            <label className="flex items-center cursor-pointer">
                                <Checkbox
                                    name="remember"
                                    tabIndex={4}
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <span className="ms-2 text-xs font-medium text-slate-400 hover:text-slate-300 select-none">
                                    Keep me logged in
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            tabIndex={5}
                            disabled={processing}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-40"
                        >
                            <span>LOG IN</span>
                            <Cpu className="h-4 w-4" />
                        </button>
                    </form>

                    {/* Quick Demo Login Box */}
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-2 relative">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <Info className="h-4 w-4 text-emerald-400 shrink-0" />
                            <span>Demo Console Access</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">
                            Click below to automatically fill credentials and log in to the Store Console.
                        </p>
                        <button
                            onClick={fillCredentials}
                            className="mt-2 text-xs font-extrabold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 py-2 rounded-xl text-center active:scale-95 transition"
                        >
                            Click to Fill Demo Credentials
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
