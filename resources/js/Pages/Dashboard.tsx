import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Table, TBody, TD, TH, THead, TR } from '@/Components/ui/Table';
import Badge from '@/Components/ui/Badge';
import Icon from '@/Components/ui/Icon';
import { brl } from '@/lib/format';

interface Props {
    metrics: {
        sales_today: number;
        sales_today_count: number;
        sales_month: number;
    };
    topProducts: Array<{
        product_name: string;
        product_sku: string;
        qty_sold: number;
        revenue: number;
    }>;
    lowStock: Array<{
        id: number;
        name: string;
        sku: string;
        stock_qty: number;
        min_stock_qty: number;
    }>;
    expiringWarranties: Array<{
        id: number;
        ends_at: string;
        product?: { id: number; name: string };
        customer?: { id: number; name: string; phone: string | null; whatsapp: string | null };
    }>;
}

export default function Dashboard({ metrics, topProducts, lowStock, expiringWarranties }: Props) {
    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <MetricCard
                        label="Vendas hoje"
                        value={brl(metrics.sales_today)}
                        sub={`${metrics.sales_today_count} venda(s)`}
                        accent="brand"
                    />
                    <MetricCard
                        label="Vendas no mês"
                        value={brl(metrics.sales_month)}
                        sub="acumulado"
                        accent="info"
                    />
                    <MetricCard
                        label="Alertas ativos"
                        value={String(lowStock.length + expiringWarranties.length)}
                        sub={`${lowStock.length} estoque · ${expiringWarranties.length} garantias`}
                        accent="warning"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Top produtos */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Top 5 produtos (30 dias)</CardTitle>
                                <Link href="/sales" className="text-xs text-brand-600 hover:underline dark:text-brand-300">ver vendas</Link>
                            </div>
                        </CardHeader>
                        <CardBody className="p-0">
                            {topProducts.length === 0 ? (
                                <div className="px-5 py-8 text-center text-sm text-ink-500">Nenhuma venda ainda.</div>
                            ) : (
                                <Table>
                                    <THead>
                                        <TR>
                                            <TH>Produto</TH>
                                            <TH className="text-right">Qtd</TH>
                                            <TH className="text-right">Receita</TH>
                                        </TR>
                                    </THead>
                                    <TBody>
                                        {topProducts.map((p) => (
                                            <TR key={p.product_sku}>
                                                <TD>
                                                    <div className="font-medium text-ink-900 dark:text-ink-100">{p.product_name}</div>
                                                    <div className="text-xs text-ink-500">{p.product_sku}</div>
                                                </TD>
                                                <TD className="text-right">{p.qty_sold}</TD>
                                                <TD className="text-right">{brl(p.revenue)}</TD>
                                            </TR>
                                        ))}
                                    </TBody>
                                </Table>
                            )}
                        </CardBody>
                    </Card>

                    {/* Estoque baixo */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Estoque baixo</CardTitle>
                                <Link href="/products" className="text-xs text-brand-600 hover:underline dark:text-brand-300">gerenciar</Link>
                            </div>
                        </CardHeader>
                        <CardBody className="p-0">
                            {lowStock.length === 0 ? (
                                <div className="flex items-center justify-center gap-2 px-5 py-8 text-center text-sm text-emerald-600 dark:text-emerald-400">
                                    <Icon name="mdi:check-circle-outline" className="h-5 w-5" />
                                    Tudo em dia.
                                </div>
                            ) : (
                                <Table>
                                    <THead>
                                        <TR>
                                            <TH>Produto</TH>
                                            <TH className="text-right">Disponível</TH>
                                            <TH className="text-right">Mínimo</TH>
                                        </TR>
                                    </THead>
                                    <TBody>
                                        {lowStock.map((p) => (
                                            <TR key={p.id}>
                                                <TD>
                                                    <Link href="/products" className="font-medium text-ink-900 hover:text-brand-600 dark:text-ink-100 dark:hover:text-brand-300">
                                                        {p.name}
                                                    </Link>
                                                    <div className="text-xs text-ink-500">{p.sku}</div>
                                                </TD>
                                                <TD className="text-right">
                                                    <Badge tone={p.stock_qty === 0 ? 'danger' : 'warning'}>{p.stock_qty}</Badge>
                                                </TD>
                                                <TD className="text-right text-ink-500 dark:text-ink-400">{p.min_stock_qty}</TD>
                                            </TR>
                                        ))}
                                    </TBody>
                                </Table>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Garantias vencendo */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Garantias vencendo em breve</CardTitle>
                            <Link href="/warranties" className="text-xs text-brand-600 hover:underline dark:text-brand-300">ver todas</Link>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        {expiringWarranties.length === 0 ? (
                            <div className="flex items-center justify-center gap-2 px-5 py-8 text-center text-sm text-emerald-600 dark:text-emerald-400">
                                <Icon name="mdi:check-circle-outline" className="h-5 w-5" />
                                Nenhuma garantia vencendo nos próximos dias.
                            </div>
                        ) : (
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Produto</TH>
                                        <TH>Cliente</TH>
                                        <TH>Contato</TH>
                                        <TH className="text-right">Vence em</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {expiringWarranties.map((w) => (
                                        <TR key={w.id}>
                                            <TD className="font-medium">{w.product?.name}</TD>
                                            <TD>{w.customer?.name ?? <span className="text-ink-400">—</span>}</TD>
                                            <TD>{w.customer?.whatsapp ?? w.customer?.phone ?? <span className="text-ink-400">—</span>}</TD>
                                            <TD className="text-right">
                                                <Badge tone="warning">
                                                    {new Date(w.ends_at).toLocaleDateString('pt-BR')}
                                                </Badge>
                                            </TD>
                                        </TR>
                                    ))}
                                </TBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: 'brand'|'info'|'warning' }) {
    const ring = {
        brand: 'ring-brand-200 from-brand-50 dark:ring-brand-500/40 dark:from-brand-500/10',
        info: 'ring-sky-200 from-sky-50 dark:ring-sky-500/40 dark:from-sky-500/10',
        warning: 'ring-amber-200 from-amber-50 dark:ring-amber-500/40 dark:from-amber-500/10',
    }[accent || 'brand'];
    return (
        <div className={`rounded-xl border border-ink-200 bg-gradient-to-br ${ring} to-white p-5 ring-1 dark:border-ink-800 dark:to-ink-900`}>
            <div className="text-xs uppercase tracking-wide text-ink-600 dark:text-ink-400">{label}</div>
            <div className="mt-1 text-3xl font-bold text-ink-900 dark:text-ink-50">{value}</div>
            {sub && <div className="mt-1 text-xs text-ink-500 dark:text-ink-400">{sub}</div>}
        </div>
    );
}
