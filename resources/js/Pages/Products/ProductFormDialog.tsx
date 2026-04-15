import { useEffect, useMemo, useState } from 'react';
import { useForm, router } from '@inertiajs/react';
import Dialog from '@/Components/ui/Dialog';
import Input from '@/Components/ui/Input';
import Select from '@/Components/ui/Select';
import Button from '@/Components/ui/Button';
import Icon from '@/Components/ui/Icon';
import { brl, num } from '@/lib/format';
import type { Category, Product } from '@/types';

interface Props {
    open: boolean;
    product: Product | null;
    categories: Category[];
    onClose: () => void;
}

export default function ProductFormDialog({ open, product, categories, onClose }: Props) {
    const isEdit = !!product;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        sku: '',
        barcode: '',
        name: '',
        description: '',
        category_id: '' as string | number,
        cost_price: '0' as string | number,
        sale_price: '0' as string | number,
        stock_qty: 0,
        min_stock_qty: 5,
        warranty_days: 0,
        active: true,
    });

    // Carrega dados ao abrir/trocar produto
    useEffect(() => {
        if (!open) return;
        clearErrors();
        if (product) {
            setData({
                sku: product.sku ?? '',
                barcode: product.barcode ?? '',
                name: product.name ?? '',
                description: product.description ?? '',
                category_id: product.category_id ?? '',
                cost_price: product.cost_price ?? '0',
                sale_price: product.sale_price ?? '0',
                stock_qty: product.stock_qty ?? 0,
                min_stock_qty: product.min_stock_qty ?? 5,
                warranty_days: product.warranty_days ?? 0,
                active: product.active ?? true,
            });
        } else {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, product?.id]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
        };
        if (isEdit) put(`/products/${product!.id}`, options);
        else post('/products', options);
    };

    // ---- Cálculo de lucro ----
    const cost = num(data.cost_price);
    const sale = num(data.sale_price);
    const profit = sale - cost;
    const margin = cost > 0 ? (profit / cost) * 100 : 0; // markup sobre custo
    const marginOnSale = sale > 0 ? (profit / sale) * 100 : 0; // margem sobre venda

    const profitTone = useMemo(() => {
        if (!cost || !sale) return 'neutral';
        if (profit <= 0) return 'danger';
        if (margin < 20) return 'warning';
        return 'success';
    }, [cost, sale, profit, margin]);

    // ---- Criar categoria inline ----
    const [newCat, setNewCat] = useState('');
    const [creatingCat, setCreatingCat] = useState(false);
    const [catPickerOpen, setCatPickerOpen] = useState(false);
    const [catError, setCatError] = useState<string | null>(null);
    const [localCategories, setLocalCategories] = useState(categories);

    useEffect(() => { setLocalCategories(categories); }, [categories]);

    const createCategory = async () => {
        const name = newCat.trim();
        if (!name) { setCatError('Informe o nome da categoria.'); return; }
        setCreatingCat(true);
        setCatError(null);
        try {
            const res = await fetch('/categories', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '',
                },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setCatError(body?.errors?.name?.[0] ?? body?.message ?? 'Erro ao salvar.');
                return;
            }
            const cat = await res.json();
            setLocalCategories((curr) => [...curr, cat].sort((a, b) => a.name.localeCompare(b.name)));
            setData('category_id', cat.id);
            setNewCat('');
            setCatPickerOpen(false);
            // Força Inertia a re-fetch das categorias da página
            router.reload({ only: ['categories'] });
        } finally {
            setCreatingCat(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} title={isEdit ? `Editar: ${product!.name}` : 'Novo produto'} size="lg">
            <form onSubmit={submit} className="space-y-5">
                {/* ---------- Identificação ---------- */}
                <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                        Identificação
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input label="SKU *" value={data.sku} onChange={(e) => setData('sku', e.target.value)} error={errors.sku} required />
                        <Input label="Código de barras" value={data.barcode ?? ''} onChange={(e) => setData('barcode', e.target.value)} error={errors.barcode} />
                        <div className="md:col-span-2">
                            <Input label="Nome *" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} required />
                        </div>
                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-600 dark:text-ink-300">Descrição</label>
                            <textarea
                                value={data.description ?? ''}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={2}
                                className="block w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-600 dark:text-ink-300">Categoria</label>
                            <div className="flex gap-2">
                                <div className="flex-1 min-w-0">
                                    <Select
                                        value={data.category_id ?? ''}
                                        onChange={(e) => setData('category_id', e.target.value as any)}
                                    >
                                        <option value="">— sem categoria —</option>
                                        {localCategories.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </Select>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setCatPickerOpen(true); setCatError(null); setNewCat(''); }}
                                    title="Nova categoria"
                                    className="inline-flex items-center justify-center rounded-md border border-ink-300 bg-white px-3 text-ink-700 hover:bg-ink-100 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
                                >
                                    <Icon name="mdi:plus" className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                id="active"
                                checked={!!data.active}
                                onChange={(e) => setData('active', e.target.checked)}
                                className="h-4 w-4 rounded border-ink-300 bg-white text-brand-600 focus:ring-brand-500 dark:border-ink-600 dark:bg-ink-900"
                            />
                            <label htmlFor="active" className="text-sm">Ativo (disponível para venda)</label>
                        </div>
                    </div>
                </section>

                {/* ---------- Preços + lucro ---------- */}
                <section className="rounded-lg border border-ink-200 bg-ink-50/60 p-4 dark:border-ink-800 dark:bg-ink-950/50">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                        Preços — custo x venda
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                            label="Custo (R$)"
                            type="number"
                            step="0.01"
                            min={0}
                            value={data.cost_price as any}
                            onChange={(e) => setData('cost_price', e.target.value as any)}
                            error={errors.cost_price}
                        />
                        <Input
                            label="Venda (R$) *"
                            type="number"
                            step="0.01"
                            min={0}
                            value={data.sale_price as any}
                            onChange={(e) => setData('sale_price', e.target.value as any)}
                            error={errors.sale_price}
                            required
                        />
                        <div className={`rounded-md border p-3 ${
                            profitTone === 'success' ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/10' :
                            profitTone === 'warning' ? 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10' :
                            profitTone === 'danger'  ? 'border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10' :
                            'border-ink-300 bg-white dark:border-ink-700 dark:bg-ink-900'
                        }`}>
                            <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-ink-600 dark:text-ink-300">
                                <Icon name="mdi:calculator-variant-outline" className="h-3.5 w-3.5" />
                                Lucro por unidade
                            </div>
                            <div className={`mt-1 text-xl font-bold tabular-nums ${
                                profit > 0 ? 'text-emerald-700 dark:text-emerald-300' :
                                profit < 0 ? 'text-red-700 dark:text-red-300' :
                                'text-ink-900 dark:text-ink-100'
                            }`}>
                                {brl(profit)}
                            </div>
                            <div className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                                Markup {margin.toFixed(1)}% · Margem {marginOnSale.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </section>

                {/* ---------- Estoque ---------- */}
                <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                        Estoque & garantia
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input
                            label="Estoque atual *"
                            type="number"
                            value={data.stock_qty as any}
                            onChange={(e) => setData('stock_qty', parseInt(e.target.value) || 0)}
                            error={errors.stock_qty}
                            required
                        />
                        <Input
                            label="Estoque mínimo *"
                            type="number"
                            value={data.min_stock_qty as any}
                            onChange={(e) => setData('min_stock_qty', parseInt(e.target.value) || 0)}
                            error={errors.min_stock_qty}
                            required
                        />
                        <Input
                            label="Garantia (dias)"
                            type="number"
                            value={data.warranty_days as any}
                            onChange={(e) => setData('warranty_days', parseInt(e.target.value) || 0)}
                            hint="0 = sem garantia"
                            error={errors.warranty_days}
                        />
                    </div>
                </section>

                <div className="flex justify-end gap-2 pt-2 border-t border-ink-200 dark:border-ink-800">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" disabled={processing}>
                        <Icon name={isEdit ? 'mdi:content-save-outline' : 'mdi:plus'} className="h-4 w-4" />
                        {isEdit ? 'Salvar alterações' : 'Cadastrar produto'}
                    </Button>
                </div>
            </form>

            {/* ---------- Sub-dialog: criar categoria ---------- */}
            <Dialog open={catPickerOpen} onClose={() => setCatPickerOpen(false)} title="Nova categoria" size="sm">
                <div className="space-y-3">
                    <Input
                        label="Nome da categoria"
                        value={newCat}
                        onChange={(e) => setNewCat(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); createCategory(); } }}
                        autoFocus
                        error={catError ?? undefined}
                    />
                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" type="button" onClick={() => setCatPickerOpen(false)}>Cancelar</Button>
                        <Button type="button" onClick={createCategory} disabled={creatingCat || !newCat.trim()}>
                            <Icon name="mdi:plus" className="h-4 w-4" />
                            Criar
                        </Button>
                    </div>
                </div>
            </Dialog>
        </Dialog>
    );
}
