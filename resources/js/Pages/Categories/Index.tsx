import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Plus, Tags, Edit, Trash2, Save, X } from 'lucide-react';

interface Category {
    id: number;
    name: string;
    description: string | null;
    products_count?: number;
}

interface IndexProps {
    categories: Category[];
}

export default function Index({ categories }: IndexProps) {
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const { data, setData, post, patch, delete: destroy, reset, errors, processing } = useForm({
        name: '',
        description: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingCategory) {
            patch(route('categories.update', editingCategory.id), {
                onSuccess: () => {
                    setEditingCategory(null);
                    reset();
                }
            });
        } else {
            post(route('categories.store'), {
                onSuccess: () => reset()
            });
        }
    };

    const startEdit = (category: Category) => {
        setEditingCategory(category);
        setData({
            name: category.name,
            description: category.description || '',
        });
    };

    const cancelEdit = () => {
        setEditingCategory(null);
        reset();
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this category? All products in it will be deleted!')) {
            destroy(route('categories.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <Tags className="h-6 w-6 text-emerald-500" />
                    <span>Product Categories</span>
                </div>
            }
        >
            <Head title="Categories" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                {/* Form Pane (Create / Edit) */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm h-fit">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6">
                        {editingCategory ? 'Edit Category' : 'Create New Category'}
                    </h3>

                    <form onSubmit={submit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-500 block">Category Name</label>
                            <input 
                                type="text"
                                value={data.name}
                                onChange={e => setData('name', e.target.value)}
                                placeholder="e.g. Plumbing, Hand Tools"
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-white"
                                required
                            />
                            {errors.name && <span className="text-xs text-red-500 font-medium">{errors.name}</span>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-500 block">Description (Optional)</label>
                            <textarea 
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                placeholder="Describe items grouped under this category..."
                                rows={4}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500 text-slate-900 dark:text-white resize-none"
                            />
                            {errors.description && <span className="text-xs text-red-500 font-medium">{errors.description}</span>}
                        </div>

                        <div className="flex gap-3 pt-2">
                            {editingCategory && (
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
                                {editingCategory ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                {editingCategory ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Categories Grid List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-700 dark:text-slate-300">Available Categories ({categories.length})</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {categories.map((category) => (
                            <div 
                                key={category.id} 
                                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                            >
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h5 className="font-bold text-slate-850 dark:text-white text-lg tracking-tight">
                                            {category.name}
                                        </h5>
                                        <span className="inline-block px-2.5 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-lg border border-slate-100 dark:border-slate-800">
                                            {category.products_count ?? 0} Products
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 leading-relaxed min-h-[40px]">
                                        {category.description || 'No description provided.'}
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 border-t border-slate-50 dark:border-slate-800/50 pt-4 mt-6">
                                    <button 
                                        onClick={() => startEdit(category)}
                                        className="p-2 rounded-xl text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-500 transition duration-150"
                                        title="Edit Category"
                                    >
                                        <Edit className="h-4.5 w-4.5" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(category.id)}
                                        className="p-2 rounded-xl text-slate-450 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 transition duration-150"
                                        title="Delete Category"
                                    >
                                        <Trash2 className="h-4.5 w-4.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
