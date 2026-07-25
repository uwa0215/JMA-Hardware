import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Truck, Edit, Trash2, Save, X, Phone, Mail, MapPin, User as UserIcon } from 'lucide-react';

interface Supplier {
    id: number;
    name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
}

interface IndexProps {
    suppliers: Supplier[];
}

export default function Index({ suppliers }: IndexProps) {
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    const { data, setData, post, patch, delete: destroy, reset, errors, processing } = useForm({
        name: '',
        contact_name: '',
        phone: '',
        email: '',
        address: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSupplier) {
            patch(route('suppliers.update', editingSupplier.id), {
                onSuccess: () => {
                    setEditingSupplier(null);
                    reset();
                }
            });
        } else {
            post(route('suppliers.store'), {
                onSuccess: () => reset()
            });
        }
    };

    const startEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setData({
            name: supplier.name,
            contact_name: supplier.contact_name || '',
            phone: supplier.phone || '',
            email: supplier.email || '',
            address: supplier.address || '',
        });
    };

    const cancelEdit = () => {
        setEditingSupplier(null);
        reset();
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this supplier? This won\'t delete past stock logs, but the reference will be cleared.')) {
            destroy(route('suppliers.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <Truck className="h-6 w-6 text-emerald-500" />
                    <span>Suppliers Directory</span>
                </div>
            }
        >
            <Head title="Suppliers" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                {/* Form Pane (Create / Edit) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6">
                        {editingSupplier ? 'Edit Supplier' : 'Create New Supplier'}
                    </h3>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 block">Supplier Name</label>
                            <input 
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="e.g. Pioneer Construction Supplies"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-white"
                                required
                            />
                            {errors.name && <span className="text-xs text-red-500 font-medium">{errors.name}</span>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 block">Contact Person Name</label>
                            <input 
                                type="text"
                                value={data.contact_name}
                                onChange={e => setData('contact_name', e.target.value)}
                                placeholder="e.g. John Doe"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-white"
                            />
                            {errors.contact_name && <span className="text-xs text-red-500 font-medium">{errors.contact_name}</span>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 block">Phone / Mobile</label>
                            <input 
                                type="text"
                                value={data.phone}
                                onChange={e => setData('phone', e.target.value)}
                                placeholder="e.g. 0917-123-4567"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-white"
                            />
                            {errors.phone && <span className="text-xs text-red-500 font-medium">{errors.phone}</span>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 block">Email Address</label>
                            <input 
                                type="email"
                                value={data.email}
                                onChange={e => setData('email', e.target.value)}
                                placeholder="e.g. sales@pioneer.com"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-white"
                            />
                            {errors.email && <span className="text-xs text-red-500 font-medium">{errors.email}</span>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 block">Business Address</label>
                            <textarea 
                                value={data.address}
                                onChange={e => setData('address', e.target.value)}
                                placeholder="e.g. 123 Industrial Ave, Manila"
                                rows={3}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-white resize-none"
                            />
                            {errors.address && <span className="text-xs text-red-500 font-medium">{errors.address}</span>}
                        </div>

                        <div className="flex gap-3 pt-3">
                            {editingSupplier && (
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold py-2.5 px-4 hover:bg-slate-200 dark:hover:bg-slate-700 transition duration-150"
                                >
                                    <X className="h-4 w-4" />
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 text-white font-bold py-2.5 px-4 shadow-lg shadow-emerald-500/10 hover:bg-emerald-600 active:scale-95 transition-all duration-150"
                            >
                                {editingSupplier ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                {editingSupplier ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Suppliers Cards Grid List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300">Registered Suppliers ({suppliers.length})</h4>
                    </div>

                    {suppliers.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center text-slate-400 border border-slate-100 dark:border-slate-800">
                            <Truck className="h-12 w-12 mx-auto stroke-1 text-slate-300 mb-2" />
                            <span>No suppliers registered. Add one using the form.</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {suppliers.map((supplier) => (
                                <div 
                                    key={supplier.id} 
                                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    <div className="space-y-4">
                                        <h5 className="font-bold text-slate-800 dark:text-white text-lg tracking-tight truncate">
                                            {supplier.name}
                                        </h5>

                                        <div className="space-y-2 text-sm text-slate-500">
                                            {supplier.contact_name && (
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="h-4 w-4 text-slate-400 shrink-0" />
                                                    <span className="truncate">{supplier.contact_name}</span>
                                                </div>
                                            )}
                                            {supplier.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                                                    <span>{supplier.phone}</span>
                                                </div>
                                            )}
                                            {supplier.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                                                    <span className="truncate">{supplier.email}</span>
                                                </div>
                                            )}
                                            {supplier.address && (
                                                <div className="flex items-start gap-2">
                                                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                                    <span className="line-clamp-2">{supplier.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-3 border-t border-slate-50 dark:border-slate-800/50 pt-4 mt-6">
                                        <button 
                                            onClick={() => startEdit(supplier)}
                                            className="p-2 rounded-xl text-slate-405 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-500 transition duration-150"
                                            title="Edit Supplier"
                                        >
                                            <Edit className="h-4.5 w-4.5" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(supplier.id)}
                                            className="p-2 rounded-xl text-slate-405 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 transition duration-150"
                                            title="Delete Supplier"
                                        >
                                            <Trash2 className="h-4.5 w-4.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
