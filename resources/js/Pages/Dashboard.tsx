import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { ReactNode, useEffect, useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Table, TBody, TD, TH, THead, TR } from '@/Components/ui/Table';
import Badge from '@/Components/ui/Badge';
import Icon from '@/Components/ui/Icon';
import { CATEGORY_PALETTE, CHART_COLORS, ChartTooltip, PieTooltip } from '@/Components/ui/Chart';
import { brl } from '@/lib/format';

type Period = 'week' | 'month' | '3months' | 'custom';

interface Props {
    metrics: {
        sales_today: number;
        sales_today_count: number;
        revenue_period: number;
        revenue_period_count: number;
        fiado_outstanding: number;
        fiado_overdue: number;
    };
    filter: {
        period: Period;
        start: string;
        end: string;
    };
    topProducts: Array<{
        product_name: string;
        product_sku: string;
        qty_sold: number;
        revenue: number;
    }>;
    revenueByDay: Array<{
        date: string;
        label: string;
        revenue: number;
        count: number;
    }>;
    salesByCategory: Array<{
        name: string;
        revenue: number;
        qty: number;
    }>;
    lowStock: Array<{
        id: number;
        name: string;
        sku: string;
        stock_qty: number;
        min_stock_qty: number;
    }>;
    topDebtors: Array<{
        id: number;
        name: string;
        outstanding: number;
        next_due: string | null;
        overdue_count: number;
    }>;
}

const PERIOD_LABELS: Record<Period, string> = {
    week: 'Semana',
    month: 'Mês',
    '3months': '3 meses',
    custom: 'Personalizado',
};

function formatDateBr(iso: string): string {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

function compactBrl(n: number): string {
    if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(1)}k`;
    return `R$ ${n.toFixed(0)}`;
}

export default function Dashboard({
    metrics,
    filter,
    topProducts,
    revenueByDay,
    salesByCategory,
    lowStock,
    topDebtors,
}: Props) {
    const [customStart, setCustomStart] = useState(filter.start);
    const [customEnd, setCustomEnd] = useState(filter.end);

    const applyPreset = (period: Exclude<Period, 'custom'>) => {
        router.get('/dashboard', { period }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const applyCustom = () => {
        if (!customStart || !customEnd) return;
        router.get('/dashboard', { period: 'custom', start: customStart, end: customEnd }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const revenueSub = `${metrics.revenue_period_count} venda(s) · ${formatDateBr(filter.start)} – ${formatDateBr(filter.end)}`;

    const hasRevenueSeries = revenueByDay.some((d) => d.revenue > 0);
    const hasCategories = salesByCategory.some((c) => c.revenue > 0);
    const hasTopProducts = topProducts.length > 0;

    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />
            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Filtro de faturamento */}
                <Card>
                    <CardBody className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-ink-600 dark:text-ink-400">Faturamento</div>
                            <div className="text-xs text-ink-500 dark:text-ink-400">Período: {PERIOD_LABELS[filter.period]}</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {(['week', 'month', '3months'] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => applyPreset(p)}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ring-1 transition ${
                                        filter.period === p
                                            ? 'bg-brand-600 text-white ring-brand-600'
                                            : 'bg-white text-ink-700 ring-ink-200 hover:bg-ink-50 dark:bg-ink-900 dark:text-ink-200 dark:ring-ink-700 dark:hover:bg-ink-800'
                                    }`}
                                >
                                    {PERIOD_LABELS[p]}
                                </button>
                            ))}
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
                                />
                                <span className="text-ink-400">–</span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="rounded-lg border border-ink-200 bg-white px-2 py-1.5 text-sm text-ink-700 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
                                />
                                <button
                                    type="button"
                                    onClick={applyCustom}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium ring-1 transition ${
                                        filter.period === 'custom'
                                            ? 'bg-brand-600 text-white ring-brand-600'
                                            : 'bg-white text-ink-700 ring-ink-200 hover:bg-ink-50 dark:bg-ink-900 dark:text-ink-200 dark:ring-ink-700 dark:hover:bg-ink-800'
                                    }`}
                                >
                                    Aplicar
                                </button>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        label="Vendas hoje"
                        value={<AnimatedBRL value={metrics.sales_today} />}
                        sub={`${metrics.sales_today_count} venda(s)`}
                        accent="brand"
                    />
                    <MetricCard
                        label={`Faturamento (${PERIOD_LABELS[filter.period].toLowerCase()})`}
                        value={<AnimatedBRL value={metrics.revenue_period} />}
                        sub={revenueSub}
                        accent="info"
                    />
                    <MetricCard
                        label="A receber (fiado)"
                        value={<AnimatedBRL value={metrics.fiado_outstanding} />}
                        sub={metrics.fiado_overdue > 0 ? `${brl(metrics.fiado_overdue)} vencido` : 'em dia'}
                        accent={metrics.fiado_overdue > 0 ? 'warning' : 'success'}
                    />
                    <MetricCard
                        label="Estoque baixo"
                        value={String(lowStock.length)}
                        sub="itens abaixo do mínimo"
                        accent="warning"
                    />
                </div>

                {/* Gráfico de faturamento diário */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Faturamento diário ({PERIOD_LABELS[filter.period].toLowerCase()})</CardTitle>
                            <span className="text-xs text-ink-500 dark:text-ink-400">{revenueByDay.length} dia(s)</span>
                        </div>
                    </CardHeader>
                    <CardBody>
                        {!hasRevenueSeries ? (
                            <div className="flex h-[260px] items-center justify-center text-sm text-ink-500">
                                Sem vendas no período selecionado.
                            </div>
                        ) : (
                            <div className="h-[260px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueByDay} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_COLORS.brand} stopOpacity={0.4} />
                                                <stop offset="95%" stopColor={CHART_COLORS.brand} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 6" stroke={CHART_COLORS.inkLight} strokeOpacity={0.3} vertical={false} />
                                        <XAxis
                                            dataKey="label"
                                            tick={{ fontSize: 11, fill: CHART_COLORS.ink }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickMargin={8}
                                            minTickGap={20}
                                        />
                                        <YAxis
                                            tick={{ fontSize: 11, fill: CHART_COLORS.ink }}
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={compactBrl}
                                            width={60}
                                        />
                                        <Tooltip
                                            content={
                                                <ChartTooltip
                                                    labelFormatter={(l) => `Dia ${l}`}
                                                    formatter={(v, name) => (name === 'Vendas' ? `${v}` : brl(v))}
                                                />
                                            }
                                            cursor={{ stroke: CHART_COLORS.brand, strokeOpacity: 0.2, strokeWidth: 2 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            name="Receita"
                                            stroke={CHART_COLORS.brand}
                                            strokeWidth={2.5}
                                            fill="url(#revenueGradient)"
                                            dot={false}
                                            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: CHART_COLORS.brand }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Donut + Bar */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Pie / Donut por categoria */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Vendas por categoria (30 dias)</CardTitle>
                        </CardHeader>
                        <CardBody>
                            {!hasCategories ? (
                                <div className="flex h-[260px] items-center justify-center text-sm text-ink-500">
                                    Sem vendas nos últimos 30 dias.
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 md:flex-row md:items-stretch">
                                    <div className="h-[260px] w-full md:w-1/2">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Tooltip content={<PieTooltip />} />
                                                <Pie
                                                    data={salesByCategory}
                                                    dataKey="revenue"
                                                    nameKey="name"
                                                    innerRadius={55}
                                                    outerRadius={90}
                                                    paddingAngle={2}
                                                    stroke="none"
                                                >
                                                    {salesByCategory.map((_, i) => (
                                                        <Cell key={i} fill={CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <CategoryLegend data={salesByCategory} />
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* Bar horizontal — Top 5 produtos */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Top 5 produtos (30 dias)</CardTitle>
                                <Link href="/sales" className="text-xs text-brand-600 hover:underline dark:text-brand-300">
                                    ver vendas
                                </Link>
                            </div>
                        </CardHeader>
                        <CardBody>
                            {!hasTopProducts ? (
                                <div className="flex h-[260px] items-center justify-center text-sm text-ink-500">
                                    Nenhuma venda ainda.
                                </div>
                            ) : (
                                <div className="h-[260px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={topProducts}
                                            layout="vertical"
                                            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 6" stroke={CHART_COLORS.inkLight} strokeOpacity={0.3} horizontal={false} />
                                            <XAxis
                                                type="number"
                                                tick={{ fontSize: 11, fill: CHART_COLORS.ink }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={compactBrl}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="product_name"
                                                tick={{ fontSize: 11, fill: CHART_COLORS.ink }}
                                                axisLine={false}
                                                tickLine={false}
                                                width={110}
                                                tickFormatter={(v: string) => (v.length > 16 ? v.slice(0, 15) + '…' : v)}
                                            />
                                            <Tooltip
                                                content={<ChartTooltip />}
                                                cursor={{ fill: CHART_COLORS.brand, fillOpacity: 0.08 }}
                                            />
                                            <Bar dataKey="revenue" name="Receita" fill={CHART_COLORS.brand} radius={[0, 6, 6, 0]} barSize={18} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

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

                {/* Maiores devedores (fiado) */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Maiores devedores (fiado)</CardTitle>
                            <Link href="/fiado" className="text-xs text-brand-600 hover:underline dark:text-brand-300">ver todos</Link>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        {topDebtors.length === 0 ? (
                            <div className="flex items-center justify-center gap-2 px-5 py-8 text-center text-sm text-emerald-600 dark:text-emerald-400">
                                <Icon name="mdi:check-circle-outline" className="h-5 w-5" />
                                Nenhum cliente com saldo em aberto.
                            </div>
                        ) : (
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Cliente</TH>
                                        <TH>Próx. vencimento</TH>
                                        <TH className="text-right">Saldo devedor</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {topDebtors.map((d) => (
                                        <TR key={d.id}>
                                            <TD>
                                                <Link href={`/customers/${d.id}`} className="font-medium text-ink-900 hover:text-brand-600 dark:text-ink-100 dark:hover:text-brand-300">
                                                    {d.name}
                                                </Link>
                                                {d.overdue_count > 0 && <Badge tone="danger" className="ml-2">{d.overdue_count} venc.</Badge>}
                                            </TD>
                                            <TD>{d.next_due ? new Date(d.next_due + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</TD>
                                            <TD className="text-right font-mono font-semibold">{brl(d.outstanding)}</TD>
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

function CategoryLegend({ data }: { data: Array<{ name: string; revenue: number; qty: number }> }) {
    const total = data.reduce((acc, d) => acc + d.revenue, 0);
    return (
        <div className="flex w-full flex-col justify-center gap-2 md:w-1/2">
            {data.map((c, i) => {
                const pct = total > 0 ? (c.revenue / total) * 100 : 0;
                return (
                    <div key={c.name} className="flex items-center gap-2 text-sm">
                        <span
                            className="inline-block h-3 w-3 shrink-0 rounded-sm"
                            style={{ backgroundColor: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] }}
                        />
                        <span className="flex-1 truncate text-ink-700 dark:text-ink-200">{c.name}</span>
                        <span className="font-mono text-xs text-ink-500 dark:text-ink-400">{pct.toFixed(0)}%</span>
                        <span className="font-mono text-xs font-semibold text-ink-900 dark:text-ink-100 tabular-nums">
                            {brl(c.revenue)}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

function MetricCard({ label, value, sub, accent }: { label: string; value: ReactNode; sub?: string; accent?: 'brand'|'info'|'warning'|'success' }) {
    const ring = {
        brand: 'ring-brand-200 from-brand-50 dark:ring-brand-500/40 dark:from-brand-500/10',
        info: 'ring-sky-200 from-sky-50 dark:ring-sky-500/40 dark:from-sky-500/10',
        warning: 'ring-amber-200 from-amber-50 dark:ring-amber-500/40 dark:from-amber-500/10',
        success: 'ring-emerald-200 from-emerald-50 dark:ring-emerald-500/40 dark:from-emerald-500/10',
    }[accent || 'brand'];
    return (
        <div className={`animate-fade-in rounded-xl border border-ink-200 bg-gradient-to-br ${ring} to-white p-5 ring-1 transition-transform hover:-translate-y-0.5 dark:border-ink-800 dark:to-ink-900`}>
            <div className="text-xs uppercase tracking-wide text-ink-600 dark:text-ink-400">{label}</div>
            <div className="mt-1 text-3xl font-bold text-ink-900 dark:text-ink-50 tabular-nums">{value}</div>
            {sub && <div className="mt-1 text-xs text-ink-500 dark:text-ink-400">{sub}</div>}
        </div>
    );
}

/** Conta de 0 até o valor alvo com easing (cubic-out) ao montar/atualizar. */
function useCountUp(target: number, duration = 700): number {
    const [val, setVal] = useState(0);
    useEffect(() => {
        let raf = 0;
        let startTs = 0;
        const from = 0;
        const step = (ts: number) => {
            if (!startTs) startTs = ts;
            const t = Math.min(1, (ts - startTs) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setVal(from + (target - from) * eased);
            if (t < 1) raf = requestAnimationFrame(step);
        };
        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);
    return val;
}

function AnimatedBRL({ value }: { value: number }) {
    const animated = useCountUp(value);
    return <>{brl(animated)}</>;
}
