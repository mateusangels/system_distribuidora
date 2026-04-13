import AppLayout from '@/Layouts/AppLayout';
import { Head, useForm, Link } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle, CardFooter } from '@/Components/ui/Card';
import Input from '@/Components/ui/Input';
import Button from '@/Components/ui/Button';
import type { Category, Product } from '@/types';
import { FormEvent } from 'react';

interface Props {
    product: Product | null;
    categories: Category[];
}

export default function ProductForm({ product, categories }: Props) {
    const isEdit = !!product;
    const { data, setData, post, put, processing, errors } = useForm({
        sku: product?.sku ?? '',
        barcode: product?.barcode ?? '',
        name: product?.name ?? '',
        description: product?.description ?? '',
        category_id: product?.category_id ?? '',
        cost_price: product?.cost_price ?? '0',
        sale_price: product?.sale_price ?? '0',
        stock_qty: product?.stock_qty ?? 0,
        min_stock_qty: product?.min_stock_qty ?? 5,
        warranty_days: product?.warranty_days ?? 0,
        active: product?.active ?? true,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (isEdit) {
            put(`/products/${product!.id}`);
        } else {
            post('/products');
        }
    };

    return (
        <AppLayout title={isEdit ? `Editar: ${product!.name}` : 'Novo produto'}>
            <Head title={isEdit ? 'Editar produto' : 'Novo produto'} />
            <form onSubmit={submit} className="max-w-3xl mx-auto space-y-4">
                <Card>
                    <CardHeader><CardTitle>Identificação</CardTitle></CardHeader>
                    <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="SKU *" name="sku" value={data.sku} onChange={(e)=>setData('sku',e.target.value)} error={errors.sku} required />
                        <Input label="Código de barras" name="barcode" value={data.barcode ?? ''} onChange={(e)=>setData('barcode',e.target.value)} error={errors.barcode} />
                        <div className="md:col-span-2">
                            <Input label="Nome *" name="name" value={data.name} onChange={(e)=>setData('name',e.target.value)} error={errors.name} required />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium uppercase tracking-wide text-ink-300 mb-1.5">Descrição</label>
                            <textarea
                                value={data.description ?? ''}
                                onChange={(e) => setData('description', e.target.value)}
                                rows={3}
                                className="block w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-50"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium uppercase tracking-wide text-ink-300 mb-1.5">Categoria</label>
                            <select
                                value={data.category_id ?? ''}
                                onChange={(e) => setData('category_id', e.target.value as any)}
                                className="block w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-50"
                            >
                                <option value="">— sem categoria —</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <input
                                type="checkbox"
                                id="active"
                                checked={!!data.active}
                                onChange={(e) => setData('active', e.target.checked)}
                                className="h-4 w-4 rounded border-ink-600 bg-ink-900 text-brand-600 focus:ring-brand-500"
                            />
                            <label htmlFor="active" className="text-sm">Ativo (disponível para venda)</label>
                        </div>
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Preços e estoque</CardTitle></CardHeader>
                    <CardBody className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Input label="Custo (R$)" type="number" step="0.01" name="cost_price" value={data.cost_price as any} onChange={(e)=>setData('cost_price',e.target.value as any)} error={errors.cost_price} />
                        <Input label="Venda (R$) *" type="number" step="0.01" name="sale_price" value={data.sale_price as any} onChange={(e)=>setData('sale_price',e.target.value as any)} error={errors.sale_price} required />
                        <Input label="Estoque atual *" type="number" name="stock_qty" value={data.stock_qty as any} onChange={(e)=>setData('stock_qty', parseInt(e.target.value) || 0 as any)} error={errors.stock_qty} required />
                        <Input label="Estoque mínimo *" type="number" name="min_stock_qty" value={data.min_stock_qty as any} onChange={(e)=>setData('min_stock_qty', parseInt(e.target.value) || 0 as any)} error={errors.min_stock_qty} required />
                        <Input label="Garantia (dias)" type="number" name="warranty_days" value={data.warranty_days as any} onChange={(e)=>setData('warranty_days', parseInt(e.target.value) || 0 as any)} hint="0 = sem garantia" error={errors.warranty_days} />
                    </CardBody>
                </Card>

                <Card>
                    <CardFooter className="flex justify-end gap-2">
                        <Link href="/products"><Button type="button" variant="ghost">Cancelar</Button></Link>
                        <Button type="submit" disabled={processing}>{isEdit ? 'Salvar alterações' : 'Cadastrar produto'}</Button>
                    </CardFooter>
                </Card>
            </form>
        </AppLayout>
    );
}
