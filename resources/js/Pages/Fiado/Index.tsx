import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Table, TBody, TD, TH, THead, TR } from '@/Components/ui/Table';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Dialog from '@/Components/ui/Dialog';
import Icon from '@/Components/ui/Icon';
import { brl, dateBr, dateTimeBr, paymentLabel } from '@/lib/format';
import type { Payment } from '@/types';

interface PickedCustomer {
    id: number;
    name: string;
    document: string | null;
    phone: string | null;
    whatsapp: string | null;
    outstanding?: number;
}

const csrf = () => (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';

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
    const [newOpen, setNewOpen] = useState(false);

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
                <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-ink-500 dark:text-ink-400">
                        Acompanhe quem deve, lance saldos e receba pagamentos.
                    </p>
                    <Button onClick={() => setNewOpen(true)}>
                        <Icon name="mdi:notebook-plus-outline" className="h-4 w-4" />
                        Novo fiado
                    </Button>
                </div>

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

            <NewFiadoDialog open={newOpen} onClose={() => setNewOpen(false)} />
        </AppLayout>
    );
}

function NewFiadoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [customer, setCustomer] = useState<PickedCustomer | null>(null);
    const [q, setQ] = useState('');
    const [results, setResults] = useState<PickedCustomer[]>([]);
    const [mode, setMode] = useState<'pick' | 'create'>('pick');

    // Cadastro rápido
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [creating, setCreating] = useState(false);

    // Lançamento
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!open) {
            setCustomer(null); setQ(''); setResults([]); setMode('pick');
            setNewName(''); setNewPhone(''); setCreating(false);
            setAmount(''); setDueDate(''); setSaving(false); setErr(null);
        }
    }, [open]);

    // Busca de clientes
    useEffect(() => {
        if (!open || customer || mode !== 'pick') return;
        const t = setTimeout(async () => {
            const r = await fetch(`/customers/search?q=${encodeURIComponent(q)}`, { headers: { Accept: 'application/json' } });
            if (r.ok) setResults(await r.json());
        }, 200);
        return () => clearTimeout(t);
    }, [q, open, customer, mode]);

    const createCustomer = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newName.trim()) { setErr('Informe o nome do cliente.'); return; }
        setCreating(true);
        setErr(null);
        try {
            const res = await fetch('/customers/quick', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrf(),
                },
                body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim() || null }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data?.errors ? Object.values(data.errors).flat().join(' • ') : (data?.message || 'Erro ao cadastrar.'));
            }
            setCustomer(data);
            setMode('pick');
        } catch (e) {
            setErr((e as Error).message);
        } finally {
            setCreating(false);
        }
    };

    const submit = (e?: React.FormEvent) => {
        e?.preventDefault();
        setErr(null);
        if (!customer) { setErr('Selecione ou cadastre um cliente.'); return; }
        const value = parseFloat(amount.replace(',', '.'));
        if (!value || value <= 0) { setErr('Informe um valor maior que zero.'); return; }
        setSaving(true);
        router.post('/fiado', {
            customer_id: customer.id,
            amount: value,
            due_date: dueDate || null,
        }, {
            preserveScroll: true,
            onSuccess: () => onClose(),
            onError: (errors) => setErr(Object.values(errors).flat().join(' • ') || 'Erro ao lançar saldo.'),
            onFinish: () => setSaving(false),
        });
    };

    return (
        <Dialog open={open} onClose={onClose} title="Novo lançamento no fiado" size="md">
            <div className="space-y-4">
                {/* Etapa 1: cliente */}
                {!customer ? (
                    mode === 'create' ? (
                        <form onSubmit={createCustomer} className="space-y-3">
                            <div className="text-xs font-medium uppercase tracking-wide text-ink-500">Cadastrar cliente</div>
                            <Input label="Nome *" value={newName} onChange={(e) => setNewName(e.target.value)} sizeBig autoFocus />
                            <Input
                                label="Celular / WhatsApp"
                                value={newPhone}
                                onChange={(e) => setNewPhone(e.target.value)}
                                placeholder="(00) 00000-0000"
                                inputMode="tel"
                                hint="Opcional"
                            />
                            {err && <ErrBox msg={err} />}
                            <div className="flex justify-between gap-2">
                                <Button type="button" variant="ghost" onClick={() => { setMode('pick'); setErr(null); }} disabled={creating}>
                                    <Icon name="mdi:arrow-left" className="h-4 w-4" />
                                    Voltar
                                </Button>
                                <Button type="submit" disabled={creating}>
                                    <Icon name={creating ? 'mdi:loading' : 'mdi:check'} className={`h-4 w-4 ${creating ? 'animate-spin' : ''}`} />
                                    {creating ? 'Salvando…' : 'Cadastrar e usar'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-3">
                            <Input placeholder="Buscar cliente por nome, doc ou telefone…" value={q} onChange={(e) => setQ(e.target.value)} sizeBig autoFocus />
                            <div className="max-h-60 overflow-y-auto rounded-md border border-ink-200 dark:border-ink-800">
                                {results.length === 0 ? (
                                    <div className="px-4 py-6 text-center text-sm text-ink-500">
                                        {q ? (
                                            <div className="space-y-3">
                                                <div>Nenhum cliente encontrado para “{q}”.</div>
                                                <Button onClick={() => { setNewName(q); setMode('create'); }}>
                                                    <Icon name="mdi:account-plus" className="h-4 w-4" />
                                                    Cadastrar “{q}” agora
                                                </Button>
                                            </div>
                                        ) : 'Comece a digitar para buscar.'}
                                    </div>
                                ) : results.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setCustomer(c)}
                                        className="flex w-full items-center justify-between border-b border-ink-200 px-4 py-3 text-left last:border-0 hover:bg-ink-50 dark:border-ink-800 dark:hover:bg-ink-800"
                                    >
                                        <div>
                                            <div className="font-medium">{c.name}</div>
                                            <div className="text-xs text-ink-500">
                                                {c.document || '—'}
                                                {(c.outstanding ?? 0) > 0 && <span className="ml-2 text-amber-600 dark:text-amber-300">fiado: {brl(c.outstanding ?? 0)}</span>}
                                            </div>
                                        </div>
                                        <Badge tone="default">{c.whatsapp ?? c.phone ?? '—'}</Badge>
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => { setNewName(q); setMode('create'); }}
                                className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline dark:text-brand-300"
                            >
                                <Icon name="mdi:plus" className="h-4 w-4" />
                                Cadastrar novo cliente
                            </button>
                        </div>
                    )
                ) : (
                    /* Etapa 2: valor */
                    <form onSubmit={submit} className="space-y-4">
                        <div className="flex items-center justify-between rounded-lg border border-ink-200 bg-ink-50/60 px-4 py-3 dark:border-ink-800 dark:bg-ink-950/50">
                            <div>
                                <div className="text-xs uppercase tracking-wide text-ink-500">Cliente</div>
                                <div className="font-medium">{customer.name}</div>
                                {(customer.outstanding ?? 0) > 0 && (
                                    <div className="text-xs text-amber-600 dark:text-amber-300">já deve {brl(customer.outstanding ?? 0)}</div>
                                )}
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => setCustomer(null)}>
                                <Icon name="mdi:swap-horizontal" className="h-4 w-4" />
                                Trocar
                            </Button>
                        </div>
                        <Input
                            label="Valor do saldo devedor (R$) *"
                            type="number"
                            step="0.01"
                            min={0.01}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0,00"
                            sizeBig
                            autoFocus
                        />
                        <Input label="Vencimento" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} hint="Opcional" />
                        {err && <ErrBox msg={err} />}
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
                            <Button type="submit" size="lg" disabled={saving}>
                                <Icon name={saving ? 'mdi:loading' : 'mdi:notebook-plus-outline'} className={`h-5 w-5 ${saving ? 'animate-spin' : ''}`} />
                                {saving ? 'Lançando…' : 'Lançar no fiado'}
                            </Button>
                        </div>
                    </form>
                )}
            </div>
        </Dialog>
    );
}

function ErrBox({ msg }: { msg: string }) {
    return (
        <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200">
            <Icon name="mdi:alert-circle-outline" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{msg}</span>
        </div>
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
