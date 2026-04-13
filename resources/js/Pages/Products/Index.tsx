import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import { Table, TBody, TD, TH, THead, TR } from '@/Components/ui/Table';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import { brl } from '@/lib/format';
import type { Category, Paginated, Product, PageProps } from '@/types';
import { useState } from 'react';

interface Props {
    products: Paginated<Product & { category?: Category | null }>;
    categories: Category[];
    filters: { q: string; category_id: number | null };
}

export default function ProductsIndex({ products, categories, filters }: Props) {
    const { props } = usePage<PageProps>();
    const isAdmin = props.auth?.user?.is_admin;
    const [q, setQ] = useState(filters.q ?? '');
    const [cat, setCat] = useState<string>(filters.category_id ? String(filters.category_id) : '');

    const apply = () => {
        router.get('/products', { q, category_id: cat || undefined }, { preserveState: true, replace: true });
    };

    const remove = (id: number) => {
        if (!confirm('Remover este produto? (Se tiver histórico, apenas será inativado)')) return;
        router.delete(`/products/${id}`);
    };

    return (
        <AppLayout title="Produtos">
            <Head title="Produtos" />
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <form
                        onSubmit={(e) => { e.preventDefault(); apply(); }}
                        className="flex items-end gap-2 flex-wrap"
                    >
                        <div className="w-72">
                            <Input
                                placeholder="Buscar por nome, SKU ou código…"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </div>
                        <select
                            value={cat}
                            onChange={(e) => setCat(e.target.value)}
                            className="rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100"
                        >
                            <option value="">Todas categorias</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <Button type="submit" variant="secondary">Filtrar</Button>
                    </form>
                    {isAdmin && (
                        <Link href="/products/create">
                            <Button>+ Novo produto</Button>
                        </Link>
                    )}
                </div>

                <Card>
                    <CardBody className="p-0">
                        <Table>
                            <THead>
                                <TR>
                                    <TH>Produto</TH>
                                    <TH>SKU / Código</TH>
                                    <TH>Categoria</TH>
                                    <TH className="text-right">Preço</TH>
                                    <TH className="text-right">Estoque</TH>
                                    <TH className="text-right">Ações</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {products.data.map((p) => (
                                    <TR key={p.id}>
                                        <TD>
                                            <div className="font-medium text-ink-100">{p.name}</div>
                                            {!p.active && <Badge tone="default" className="mt-1">inativo</Badge>}
                                        </TD>
                                        <TD className="text-xs">
                                            <div className="text-ink-200">{p.sku}</div>
                                            <div className="text-ink-500">{p.barcode || '—'}</div>
                                        </TD>
                                        <TD className="text-ink-300">{p.category?.name ?? '—'}</TD>
                                        <TD className="text-right font-mono">{brl(p.sale_price)}</TD>
                                        <TD className="text-right">
                                            <Badge tone={p.stock_qty <= p.min_stock_qty ? (p.stock_qty === 0 ? 'danger' : 'warning') : 'success'}>
                                                {p.stock_qty}
                                            </Badge>
                                        </TD>
                                        <TD className="text-right">
                                            {isAdmin ? (
                                                <div className="inline-flex gap-1">
                                                    <Link href={`/products/${p.id}/edit`}>
                                                        <Button size="sm" variant="secondary">Editar</Button>
                                                    </Link>
                                                    <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>×</Button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-ink-500">somente leitura</span>
                                            )}
                                        </TD>
                                    </TR>
                                ))}
                                {products.data.length === 0 && (
                                    <TR>
                                        <TD colSpan={6} className="text-center py-10 text-ink-400">Nenhum produto encontrado.</TD>
                                    </TR>
                                )}
                            </TBody>
                        </Table>
                    </CardBody>
                </Card>

                <Pagination links={products.links} />
            </div>
        </AppLayout>
    );
}

function Pagination({ links }: { links: Array<{ url: string | null; label: string; active: boolean }> }) {
    if (links.length <= 3) return null;
    return (
        <div className="flex flex-wrap gap-1">
            {links.map((l, i) => (
                <button
                    key={i}
                    disabled={!l.url}
                    onClick={() => l.url && router.visit(l.url, { preserveState: true })}
                    className={`rounded-md border px-3 py-1 text-xs disabled:opacity-30 ${l.active ? 'border-brand-500 bg-brand-600 text-white' : 'border-ink-700 bg-ink-900 text-ink-300 hover:bg-ink-800'}`}
                    dangerouslySetInnerHTML={{ __html: l.label }}
                />
            ))}
        </div>
    );
}
