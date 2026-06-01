import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Table, TBody, TD, TH, THead, TR } from '@/Components/ui/Table';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Icon from '@/Components/ui/Icon';
import { brl, dateBr, dateTimeBr, paymentLabel } from '@/lib/format';
import type { Payment } from '@/types';

interface Debtor {
    id: number;
    name: string;
    phone: string | null;
    whatsapp: string | null;
    credit_limit: number;
    outstanding: number;
    open_sales: number;
    overdue_count: number;
    next_due: string | null;
    has_overdue: boolean;
    whatsapp_url: string | null;
}

interface Props {
    debtors: Debtor[];
    metrics: { total_outstanding: number; overdue_amount: number; debtors_count: number };
    recentPayments: Payment[];
    filters: { q: string };
}

export default function FiadoIndex({ debtors, metrics, recentPayments, filters }: Props) {
    const [q, setQ] = useState(filters.q ?? '');

    useEffect(() => {
        const t = setTimeout(() => {
            if (q === (filters.q ?? '')) return;
            router.get('/fiado', { q: q || undefined }, { preserveState: true, replace: true, only: ['debtors', 'filters'] });
        }, 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    return (
        <AppLayout title="Fiado — Contas a receber">
            <Head title="Fiado" />
            <div className="space-y-4">
                {/* Métricas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <MetricCard
                        label="Total a receber"
                        value={brl(metrics.total_outstanding)}
                        icon="mdi:cash-multiple"
                        tone="brand"
                    />
                    <MetricCard
                        label="Vencido"
                        value={brl(metrics.overdue_amount)}
                        icon="mdi:alert-circle-outline"
                        tone="danger"
                    />
                    <MetricCard
                        label="Clientes devedores"
                        value={String(metrics.debtors_count)}
                        icon="mdi:account-group-outline"
                        tone="default"
                    />
                </div>

                {/* Devedores */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                            <CardTitle>Clientes com saldo devedor</CardTitle>
                            <div className="w-56">
                                <Input
                                    placeholder="Buscar cliente…"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        {debtors.length === 0 ? (
                            <div className="px-5 py-10 text-center text-sm text-ink-500">
                                <Icon name="mdi:check-circle-outline" className="mx-auto h-10 w-10 text-emerald-400" />
                                <div className="mt-2">Nenhum cliente com saldo em aberto. 🎉</div>
                            </div>
                        ) : (
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Cliente</TH>
                                        <TH className="text-center">Vendas</TH>
                                        <TH>Próx. venc.</TH>
                                        <TH className="text-right">Saldo</TH>
                                        <TH className="text-right">Ações</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {debtors.map((d) => (
                                        <TR key={d.id}>
                                            <TD>
                                                <Link href={`/customers/${d.id}`} className="font-medium text-brand-600 hover:underline dark:text-brand-300">
                                                    {d.name}
                                                </Link>
                                                <div className="text-xs text-ink-500">{d.whatsapp ?? d.phone ?? 'sem telefone'}</div>
                                            </TD>
                                            <TD className="text-center">
                                                {d.open_sales}
                                                {d.overdue_count > 0 && <Badge tone="danger" className="ml-2">{d.overdue_count} venc.</Badge>}
                                            </TD>
                                            <TD>
                                                <span className={d.has_overdue ? 'text-red-600 dark:text-red-300 font-medium' : ''}>
                                                    {dateBr(d.next_due)}
                                                </span>
                                            </TD>
                                            <TD className="text-right font-mono font-semibold">{brl(d.outstanding)}</TD>
                                            <TD className="text-right">
                                                <div className="inline-flex gap-2">
                                                    {d.whatsapp_url && (
                                                        <a href={d.whatsapp_url} target="_blank" rel="noreferrer" title="Cobrar via WhatsApp">
                                                            <Button variant="secondary" size="sm">
                                                                <Icon name="mdi:whatsapp" className="h-4 w-4" />
                                                            </Button>
                                                        </a>
                                                    )}
                                                    <Link href={`/customers/${d.id}`} title="Abrir cliente / receber">
                                                        <Button size="sm">
                                                            <Icon name="mdi:cash-plus" className="h-4 w-4" />
                                                            Receber
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </TD>
                                        </TR>
                                    ))}
                                </TBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>

                {/* Últimos recebimentos */}
                <Card>
                    <CardHeader><CardTitle>Últimos recebimentos</CardTitle></CardHeader>
                    <CardBody className="p-0">
                        {recentPayments.length === 0 ? (
                            <div className="px-5 py-8 text-center text-sm text-ink-500">Nenhum recebimento ainda.</div>
                        ) : (
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Recibo</TH>
                                        <TH>Cliente</TH>
                                        <TH>Data</TH>
                                        <TH>Forma</TH>
                                        <TH className="text-right">Valor</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {recentPayments.map((p) => (
                                        <TR key={p.id}>
                                            <TD className="font-mono">{p.code}</TD>
                                            <TD>
                                                {p.customer ? (
                                                    <Link href={`/customers/${p.customer.id}`} className="text-brand-600 hover:underline dark:text-brand-300">
                                                        {p.customer.name}
                                                    </Link>
                                                ) : '—'}
                                            </TD>
                                            <TD>{dateTimeBr(p.paid_at)}</TD>
                                            <TD>{paymentLabel(p.method)}</TD>
                                            <TD className="text-right font-mono text-emerald-600 dark:text-emerald-300">{brl(p.amount)}</TD>
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

function MetricCard({ label, value, icon, tone }: { label: string; value: string; icon: string; tone: 'brand' | 'danger' | 'default' }) {
    const accent = tone === 'brand'
        ? 'text-brand-600 dark:text-brand-300'
        : tone === 'danger'
            ? 'text-red-600 dark:text-red-300'
            : 'text-ink-700 dark:text-ink-200';
    return (
        <Card className="animate-fade-in">
            <CardBody className="flex items-center gap-4">
                <div className={`grid h-12 w-12 place-items-center rounded-lg bg-ink-100 dark:bg-ink-800 ${accent}`}>
                    <Icon name={icon} className="h-6 w-6" />
                </div>
                <div>
                    <div className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">{label}</div>
                    <div className={`text-2xl font-bold tabular-nums ${accent}`}>{value}</div>
                </div>
            </CardBody>
        </Card>
    );
}
