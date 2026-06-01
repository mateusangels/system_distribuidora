import AppLayout from '@/Layouts/AppLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import { Table, TBody, TD, TH, THead, TR } from '@/Components/ui/Table';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Select from '@/Components/ui/Select';
import Icon from '@/Components/ui/Icon';
import ProductFormDialog from './ProductFormDialog';
import StockDialog from './StockDialog';
import { brl } from '@/lib/format';
import type { Category, Paginated, Product, PageProps } from '@/types';
import { useEffect, useState } from 'react';

interface Props {
    products: Paginated<Product & { category?: Category | null }>;
    categories: Category[];
    filters: {
        q: string;
        category_id: number | null;
        stock: 'out' | 'low' | 'ok' | null;
    };
}

export default function ProductsIndex({ products, categories, filters }: Props) {
    const { props } = usePage<PageProps>();
    const isAdmin = props.auth?.user?.is_admin;
    const [q, setQ] = useState(filters.q ?? '');
    const [cat, setCat] = useState<string>(filters.category_id ? String(filters.category_id) : '');
    const [stock, setStock] = useState<string>(filters.stock ?? '');
    const [editing, setEditing] = useState<Product | null | 'new'>(null);
    const [stockProduct, setStockProduct] = useState<Product | null>(null);

    // Abre o modal automaticamente quando vem de /products/create ou /products/{id}/edit
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('new')) {
            setEditing('new');
            params.delete('new');
            const q = params.toString();
            window.history.replaceState({}, '', window.location.pathname + (q ? `?${q}` : ''));
        } else if (params.get('edit')) {
            const id = parseInt(params.get('edit') || '0');
            const p = products.data.find((x) => x.id === id);
            if (p) setEditing(p);
            params.delete('edit');
            const q = params.toString();
            window.history.replaceState({}, '', window.location.pathname + (q ? `?${q}` : ''));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const apply = () => {
        router.get('/products', {
            q,
            category_id: cat || undefined,
            stock: stock || undefined,
        }, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setQ(''); setCat(''); setStock('');
        router.get('/products', {}, { preserveState: false, replace: true });
    };

    const hasFilter = !!(q || cat || stock);

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
                        <div className="w-64">
                            <Input
                                placeholder="Nome, SKU ou código…"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </div>
                        <Select value={cat} onChange={(e) => setCat(e.target.value)} title="Categoria">
                            <option value="">Todas categorias</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </Select>
                        <Select value={stock} onChange={(e) => setStock(e.target.value)} title="Estoque">
                            <option value="">Todo estoque</option>
                            <option value="out">Sem estoque</option>
                            <option value="low">Estoque baixo</option>
                            <option value="ok">Estoque OK</option>
                        </Select>
                        <Button type="submit" variant="secondary">
                            <Icon name="mdi:filter-outline" className="h-4 w-4" />
                            Filtrar
                        </Button>
                        {hasFilter && (
                            <Button type="button" variant="ghost" onClick={resetFilters} title="Limpar filtros">
                                <Icon name="mdi:close" className="h-4 w-4" />
                                Limpar
                            </Button>
                        )}
                    </form>
                    {isAdmin && (
                        <Button onClick={() => setEditing('new')}>
                            <Icon name="mdi:plus" className="h-4 w-4" />
                            Novo produto
                        </Button>
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
                                            <div className="font-medium text-ink-900 dark:text-ink-100">{p.name}</div>
                                            {p.pack_label && Number(p.pack_size) > 1 && (
                                                <div className="text-xs text-ink-500">{p.pack_label} c/ {p.pack_size} {p.unit_label || 'un'}</div>
                                            )}
                                            {!p.active && <Badge tone="default" className="mt-1">inativo</Badge>}
                                        </TD>
                                        <TD className="text-xs">
                                            <div className="text-ink-800 dark:text-ink-200">{p.sku}</div>
                                            <div className="text-ink-500">{p.barcode || '—'}</div>
                                        </TD>
                                        <TD className="text-ink-600 dark:text-ink-300">{p.category?.name ?? '—'}</TD>
                                        <TD className="text-right font-mono">{brl(p.sale_price)}</TD>
                                        <TD className="text-right">
                                            <Badge tone={p.stock_qty <= p.min_stock_qty ? (p.stock_qty === 0 ? 'danger' : 'warning') : 'success'}>
                                                {p.stock_qty}
                                            </Badge>
                                        </TD>
                                        <TD className="text-right">
                                            <div className="inline-flex gap-1">
                                                <Button size="sm" variant="secondary" onClick={() => setStockProduct(p)} title="Movimentar estoque">
                                                    <Icon name="mdi:warehouse" className="h-4 w-4" />
                                                    Estoque
                                                </Button>
                                                {isAdmin && (
                                                    <>
                                                        <Button size="sm" variant="secondary" onClick={() => setEditing(p)}>
                                                            <Icon name="mdi:pencil-outline" className="h-4 w-4" />
                                                            Editar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => remove(p.id)}
                                                            title="Remover"
                                                            className="!text-red-600 hover:!bg-red-50 dark:!text-red-400 dark:hover:!bg-red-500/10"
                                                        >
                                                            <Icon name="mdi:trash-can-outline" className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TD>
                                    </TR>
                                ))}
                                {products.data.length === 0 && (
                                    <TR>
                                        <TD colSpan={6} className="text-center py-10 text-ink-500">Nenhum produto encontrado.</TD>
                                    </TR>
                                )}
                            </TBody>
                        </Table>
                    </CardBody>
                </Card>

                <Pagination links={products.links} />
            </div>

            <ProductFormDialog
                open={editing !== null}
                product={editing === 'new' ? null : editing}
                categories={categories}
                onClose={() => setEditing(null)}
            />

            <StockDialog
                open={stockProduct !== null}
                product={stockProduct}
                onClose={() => setStockProduct(null)}
            />
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
                    className={`rounded-md border px-3 py-1 text-xs disabled:opacity-30 ${l.active ? 'border-brand-500 bg-brand-600 text-white' : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-100 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:bg-ink-800'}`}
                    dangerouslySetInnerHTML={{ __html: l.label }}
                />
            ))}
        </div>
    );
}
