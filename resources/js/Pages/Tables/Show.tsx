import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Dialog from '@/Components/ui/Dialog';
import Badge from '@/Components/ui/Badge';
import Icon from '@/Components/ui/Icon';
import { brl, num, paymentLabel } from '@/lib/format';
import type { PaymentMethod, TableOrder, TableOrderCustomer } from '@/types';

interface PdvProduct {
    id: number;
    sku: string;
    barcode: string | null;
    name: string;
    sale_price: string | number;
    stock_qty: number;
    unit_label: string;
    has_pack: boolean;
    pack_label: string | null;
    pack_size: number;
    pack_price: number;
}

interface Props {
    table: { id: number; name: string; capacity: number | null };
    order: TableOrder;
}

const csrf = () => (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';

async function api(url: string, method: string, body?: unknown): Promise<any> {
    const res = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': csrf(),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = data?.errors
            ? Object.values(data.errors).flat().join(' • ')
            : data?.message || 'Erro na operação.';
        throw new Error(String(msg));
    }
    return data;
}

export default function TableShow({ table, order: initialOrder }: Props) {
    const [order, setOrder] = useState<TableOrder>(initialOrder);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<PdvProduct[]>([]);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [customerOpen, setCustomerOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<{ code: string; receipt: string; change: number | null; total: number; fiado: boolean } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const subtotal = order.subtotal;
    const itemsCount = useMemo(() => order.items.reduce((s, i) => s + i.qty, 0), [order.items]);

    const flashError = (msg: string) => { setError(msg); setTimeout(() => setError(null), 2800); };

    // Foco automático no campo de busca (estilo PDV)
    useEffect(() => {
        if (paymentOpen || customerOpen || success) return;
        const t = setInterval(() => {
            if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                inputRef.current?.focus();
            }
        }, 500);
        inputRef.current?.focus();
        return () => clearInterval(t);
    }, [paymentOpen, customerOpen, success]);

    // Busca de produtos com debounce
    useEffect(() => {
        const term = search.trim();
        if (!term) { setResults([]); return; }
        setSearching(true);
        const t = setTimeout(async () => {
            try {
                const r = await fetch(`/products/search?q=${encodeURIComponent(term)}`, { headers: { Accept: 'application/json' } });
                if (!r.ok) return;
                const data: PdvProduct[] = await r.json();
                const exact = data.find((p) => p.barcode === term || p.sku === term);
                if (exact) {
                    addProduct(exact, 'unit');
                    setSearch('');
                    setResults([]);
                    return;
                }
                setResults(data);
            } finally {
                setSearching(false);
            }
        }, 200);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const term = search.trim();
        if (!term) return;
        (async () => {
            const r = await fetch(`/products/search?q=${encodeURIComponent(term)}&exact=1`, { headers: { Accept: 'application/json' } });
            if (!r.ok) return;
            const data: PdvProduct[] = await r.json();
            if (data.length === 1) { addProduct(data[0], 'unit'); setSearch(''); setResults([]); }
            else if (data.length === 0 && results[0]) { addProduct(results[0], 'unit'); setSearch(''); setResults([]); }
            else if (data.length === 0) { flashError(`Produto não encontrado: ${term}`); }
            else setResults(data);
        })();
    };

    const addProduct = async (p: PdvProduct, mode: 'unit' | 'pack') => {
        if (p.stock_qty <= 0) { flashError(`${p.name} sem estoque.`); return; }
        setBusy(true);
        try {
            const data = await api(`/tables/${table.id}/items`, 'POST', { product_id: p.id, mode });
            setOrder(data.order);
        } catch (e) {
            flashError((e as Error).message);
        } finally {
            setBusy(false);
        }
    };

    const setItemQty = async (itemId: number, qty: number) => {
        const q = Math.max(0, qty);
        try {
            const data = await api(`/table-items/${itemId}`, 'PATCH', { qty: q });
            setOrder(data.order);
        } catch (e) {
            flashError((e as Error).message);
        }
    };

    const removeItem = async (itemId: number) => {
        try {
            const data = await api(`/table-items/${itemId}`, 'DELETE');
            setOrder(data.order);
        } catch (e) {
            flashError((e as Error).message);
        }
    };

    const pickCustomer = async (c: TableOrderCustomer | null) => {
        try {
            const data = await api(`/tables/${table.id}/customer`, 'POST', { customer_id: c?.id ?? null });
            setOrder(data.order);
            setCustomerOpen(false);
        } catch (e) {
            flashError((e as Error).message);
        }
    };

    const finalize = async (method: PaymentMethod, amountReceived: number | null, dueDate: string | null, discount: number) => {
        setError(null);
        setSubmitting(true);
        try {
            const data = await api(`/tables/${table.id}/finalize`, 'POST', {
                payment: { method, amount_received: amountReceived, discount, due_date: dueDate },
            });
            const sale = data.sale;
            setSuccess({
                code: sale.code,
                receipt: data.receipt,
                change: sale.change_due != null ? Number(sale.change_due) : null,
                total: Number(sale.total),
                fiado: method === 'fiado',
            });
            setPaymentOpen(false);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setSubmitting(false);
        }
    };

    const cancelTable = () => {
        if (order.items.length > 0 && !confirm('Cancelar a comanda e liberar a mesa? Os itens serão descartados.')) return;
        router.post(`/tables/${table.id}/cancel`);
    };

    return (
        <AppLayout title={`Mesa — ${table.name}`}>
            <Head title={`Mesa ${table.name}`} />

            {error && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800 shadow-lg animate-slide-up dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200">
                    <Icon name="mdi:alert-circle-outline" className="h-4 w-4" />
                    {error}
                </div>
            )}

            <div className="mb-3 flex items-center justify-between gap-2">
                <Link href="/tables" className="inline-flex items-center gap-1 text-sm text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-ink-100">
                    <Icon name="mdi:arrow-left" className="h-4 w-4" />
                    Voltar às mesas
                </Link>
                <div className="flex items-center gap-2">
                    <Badge tone="default">Comanda {order.code}</Badge>
                    <Button variant="ghost" size="sm" onClick={cancelTable}>
                        <Icon name="mdi:close-circle-outline" className="h-4 w-4" />
                        Cancelar / liberar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[500px] lg:h-[calc(100vh-220px)]">
                {/* Coluna esquerda: busca + itens */}
                <div className="lg:col-span-2 flex flex-col gap-3">
                    <div className="rounded-xl border border-ink-200 bg-white p-3 dark:border-ink-800 dark:bg-ink-900/70">
                        <Input
                            ref={inputRef as any}
                            placeholder="Bipe um produto ou busque por nome / SKU…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={onSearchKey}
                            sizeBig
                            autoFocus
                            disabled={busy}
                            hint={searching ? 'Buscando…' : results.length > 0 ? `${results.length} resultado(s) — Enter pra adicionar 1º` : 'Foco automático: pode bipar a qualquer momento'}
                        />
                        {results.length > 0 && (
                            <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950">
                                {results.map((p) => (
                                    <div key={p.id} className="flex w-full items-center justify-between gap-3 border-b border-ink-200 px-3 py-2 last:border-0 dark:border-ink-800">
                                        <div className="min-w-0">
                                            <div className="truncate font-medium">{p.name}</div>
                                            <div className="text-xs text-ink-500">
                                                {p.sku}{p.barcode ? ` · ${p.barcode}` : ''} · est. {p.stock_qty} {p.unit_label || 'un'}
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1.5">
                                            <button
                                                type="button"
                                                onClick={() => { addProduct(p, 'unit'); setSearch(''); setResults([]); }}
                                                className="rounded-md border border-ink-200 px-2.5 py-1 text-center hover:bg-ink-50 dark:border-ink-700 dark:hover:bg-ink-800"
                                            >
                                                <div className="text-[10px] uppercase text-ink-500">{p.unit_label || 'un'}</div>
                                                <div className="font-mono text-sm text-brand-600 dark:text-brand-300">{brl(p.sale_price)}</div>
                                            </button>
                                            {p.has_pack && (
                                                <button
                                                    type="button"
                                                    onClick={() => { addProduct(p, 'pack'); setSearch(''); setResults([]); }}
                                                    className="rounded-md border border-brand-300 bg-brand-50 px-2.5 py-1 text-center hover:bg-brand-100 dark:border-brand-500/40 dark:bg-brand-600/10 dark:hover:bg-brand-600/20"
                                                >
                                                    <div className="text-[10px] uppercase text-ink-500">{p.pack_label} ({p.pack_size})</div>
                                                    <div className="font-mono text-sm text-brand-600 dark:text-brand-300">{brl(p.pack_price)}</div>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto rounded-xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900/40">
                        {order.items.length === 0 ? (
                            <div className="grid h-full place-items-center p-6 text-center">
                                <div>
                                    <Icon name="mdi:silverware-fork-knife" className="mx-auto h-16 w-16 text-ink-300 dark:text-ink-600" />
                                    <div className="mt-2 text-lg text-ink-600 dark:text-ink-300">Comanda vazia</div>
                                    <div className="mt-1 text-sm text-ink-500">Bipe um produto para lançar na mesa</div>
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-ink-50 text-xs uppercase text-ink-500 dark:bg-ink-900/80 dark:text-ink-400">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Produto</th>
                                        <th className="w-24 px-2 py-2 text-center">Qtd</th>
                                        <th className="w-28 px-2 py-2 text-right">Unit.</th>
                                        <th className="w-28 px-2 py-2 text-right">Total</th>
                                        <th className="w-10 px-2 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-200 dark:divide-ink-800">
                                    {order.items.map((it) => (
                                        <tr key={it.id}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{it.name}</div>
                                                <div className="text-xs text-ink-500">
                                                    {it.sku}
                                                    {it.units_each > 1 && (
                                                        <span className="ml-1.5 rounded bg-brand-50 px-1.5 py-0.5 text-brand-700 dark:bg-brand-600/15 dark:text-brand-300">
                                                            {it.sold_as} · {it.units_each} un
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-2 py-3">
                                                <div className="inline-flex items-center gap-1">
                                                    <button onClick={() => setItemQty(it.id, it.qty - 1)} className="rounded bg-ink-100 px-2 py-1 hover:bg-ink-200 dark:bg-ink-800 dark:hover:bg-ink-700">
                                                        <Icon name="mdi:minus" className="h-4 w-4" />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={it.qty}
                                                        onChange={(e) => setItemQty(it.id, parseInt(e.target.value) || 1)}
                                                        className="w-12 rounded border border-ink-300 bg-white px-1 py-1 text-center text-sm dark:border-ink-700 dark:bg-ink-900"
                                                    />
                                                    <button onClick={() => setItemQty(it.id, it.qty + 1)} className="rounded bg-ink-100 px-2 py-1 hover:bg-ink-200 dark:bg-ink-800 dark:hover:bg-ink-700">
                                                        <Icon name="mdi:plus" className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 text-right font-mono">{brl(it.unit_price)}</td>
                                            <td className="px-2 py-3 text-right font-mono font-semibold">{brl(it.total)}</td>
                                            <td className="px-2 py-3 text-right">
                                                <button
                                                    onClick={() => removeItem(it.id)}
                                                    title="Remover item"
                                                    className="rounded bg-ink-100 p-1.5 text-ink-600 hover:bg-red-600 hover:text-white dark:bg-ink-800 dark:text-ink-300"
                                                >
                                                    <Icon name="mdi:trash-can-outline" className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Coluna direita */}
                <div className="flex flex-col gap-3">
                    <div className="rounded-xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900/70">
                        <div className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">Cliente</div>
                        {order.customer ? (
                            <div className="mt-1 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{order.customer.name}</div>
                                    <div className="text-xs text-ink-500">{order.customer.whatsapp ?? order.customer.phone ?? order.customer.document}</div>
                                </div>
                                <button
                                    onClick={() => pickCustomer(null)}
                                    title="Remover cliente"
                                    className="rounded p-1 text-ink-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-300"
                                >
                                    <Icon name="mdi:close" className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <Button variant="secondary" block onClick={() => setCustomerOpen(true)} className="mt-2">
                                <Icon name="mdi:account-plus-outline" className="h-4 w-4" />
                                Identificar cliente
                            </Button>
                        )}
                    </div>

                    <div className="flex-1 rounded-xl border border-ink-200 bg-gradient-to-br from-brand-50 to-white p-5 dark:border-ink-800 dark:from-brand-600/10 dark:to-ink-900">
                        <div className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">Total da comanda</div>
                        <div className="mt-1 text-5xl font-black tabular-nums text-ink-900 dark:text-ink-50">{brl(subtotal)}</div>
                        <div className="mt-3 text-sm text-ink-600 dark:text-ink-300">{itemsCount} item(ns) lançado(s)</div>
                    </div>

                    <Button size="xl" block disabled={order.items.length === 0} onClick={() => setPaymentOpen(true)}>
                        <Icon name="mdi:cash-register" className="h-5 w-5" />
                        Fechar conta / pagar
                    </Button>
                </div>
            </div>

            <PaymentModal
                open={paymentOpen}
                onClose={() => setPaymentOpen(false)}
                subtotal={subtotal}
                submitting={submitting}
                customer={order.customer}
                onConfirm={finalize}
                serverError={error}
            />
            <CustomerPicker open={customerOpen} onClose={() => setCustomerOpen(false)} onPick={pickCustomer} />

            <FinishPrompt
                success={success}
                onPrint={() => {
                    if (success) window.open(`${success.receipt}?print=1`, '_blank', 'noopener,noreferrer');
                    router.visit('/tables');
                }}
                onSkip={() => router.visit('/tables')}
            />
        </AppLayout>
    );
}

const PAYMENT_ICONS: Record<PaymentMethod, string> = {
    cash: 'mdi:cash',
    pix: 'mdi:qrcode',
    credit: 'mdi:credit-card-outline',
    debit: 'mdi:bank-outline',
    fiado: 'mdi:notebook-outline',
};

function defaultDueDate(days = 30): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

function PaymentModal({
    open, onClose, subtotal, submitting, customer, onConfirm, serverError,
}: {
    open: boolean;
    onClose: () => void;
    subtotal: number;
    submitting: boolean;
    customer: TableOrderCustomer | null;
    onConfirm: (method: PaymentMethod, received: number | null, dueDate: string | null, discount: number) => void;
    serverError?: string | null;
}) {
    const [method, setMethod] = useState<PaymentMethod>('cash');
    const [discount, setDiscount] = useState(0);
    const [received, setReceived] = useState(subtotal);
    const [dueDate, setDueDate] = useState(defaultDueDate());
    const [localError, setLocalError] = useState<string | null>(null);

    const total = Math.max(0, subtotal - discount);
    const change = method === 'cash' ? Math.max(0, received - total) : 0;
    const isFiado = method === 'fiado';
    const available = customer?.available_credit ?? null;
    const overLimit = isFiado && available !== null && total > available;

    useEffect(() => {
        if (open) {
            setMethod('cash');
            setDiscount(0);
            setReceived(subtotal);
            setDueDate(defaultDueDate());
            setLocalError(null);
        }
    }, [open, subtotal]);

    useEffect(() => {
        if (method === 'cash') setReceived(Math.max(0, subtotal - discount));
    }, [discount, subtotal, method]);

    const submit = () => {
        setLocalError(null);
        if (isFiado && !customer) {
            setLocalError('Venda no fiado exige um cliente identificado.');
            return;
        }
        if (overLimit) {
            setLocalError(`Limite de crédito insuficiente. Disponível: ${brl(available ?? 0)}.`);
            return;
        }
        if (method === 'cash' && received < total) {
            setLocalError('Valor recebido é menor que o total.');
            return;
        }
        onConfirm(method, method === 'cash' ? received : null, isFiado ? dueDate : null, discount);
    };

    return (
        <Dialog open={open} onClose={onClose} title="Fechar conta da mesa" size="md">
            <div className="space-y-4">
                <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-center dark:border-brand-500/30 dark:bg-brand-600/10">
                    <div className="text-xs uppercase tracking-wide text-brand-700 dark:text-brand-300">Total a pagar</div>
                    <div className="text-4xl font-black tabular-nums text-ink-900 dark:text-ink-50">{brl(total)}</div>
                    {discount > 0 && (
                        <div className="mt-1 text-xs text-ink-500">Subtotal {brl(subtotal)} − desconto {brl(discount)}</div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {(['cash', 'pix', 'credit', 'debit', 'fiado'] as PaymentMethod[]).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setMethod(m)}
                            className={`rounded-lg border px-3 py-3 text-left transition-colors ${
                                method === m
                                    ? 'border-brand-500 bg-brand-50 text-ink-900 dark:bg-brand-500/15 dark:text-ink-50'
                                    : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:bg-ink-800'
                            }`}
                        >
                            <Icon name={PAYMENT_ICONS[m]} className="h-7 w-7" />
                            <div className="mt-1 text-sm font-medium">{paymentLabel(m)}</div>
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between rounded-lg border border-ink-200 px-3 py-2 dark:border-ink-800">
                    <span className="text-sm text-ink-600 dark:text-ink-300">Desconto (R$)</span>
                    <input
                        type="number"
                        step="0.01"
                        min={0}
                        max={subtotal}
                        value={discount}
                        onChange={(e) => setDiscount(Math.min(subtotal, Math.max(0, parseFloat(e.target.value) || 0)))}
                        className="w-28 rounded border border-ink-300 bg-white px-2 py-1 text-right font-mono text-sm dark:border-ink-700 dark:bg-ink-900"
                    />
                </div>

                {isFiado && (
                    <div className="space-y-2">
                        {customer ? (
                            <div className="rounded-lg border border-ink-200 bg-ink-50/60 p-3 dark:border-ink-800 dark:bg-ink-950/50">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-ink-600 dark:text-ink-300">Cliente</span>
                                    <span className="font-medium">{customer.name}</span>
                                </div>
                                {available !== null && (
                                    <div className="mt-1 flex items-center justify-between text-sm">
                                        <span className="text-ink-600 dark:text-ink-300">Crédito disponível</span>
                                        <span className={`font-mono font-semibold ${overLimit ? 'text-red-600 dark:text-red-300' : 'text-emerald-600 dark:text-emerald-300'}`}>
                                            {brl(available)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
                                <Icon name="mdi:account-alert-outline" className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>Identifique o cliente antes de fechar no fiado.</span>
                            </div>
                        )}
                        <Input label="Vencimento" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>
                )}

                {method === 'cash' && (
                    <div className="space-y-2">
                        <Input
                            label="Valor recebido (R$)"
                            type="number"
                            step="0.01"
                            min={total}
                            value={received}
                            onChange={(e) => setReceived(parseFloat(e.target.value) || 0)}
                            sizeBig
                            autoFocus
                        />
                        <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                            <span className="text-emerald-800 dark:text-emerald-200">Troco</span>
                            <span className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-100">{brl(change)}</span>
                        </div>
                    </div>
                )}

                {(localError || serverError) && (
                    <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200">
                        <Icon name="mdi:alert-circle-outline" className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{localError || serverError}</span>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancelar (Esc)</Button>
                    <Button onClick={submit} size="lg" disabled={submitting || (isFiado && (!customer || overLimit))}>
                        <Icon name={submitting ? 'mdi:loading' : 'mdi:check'} className={`h-5 w-5 ${submitting ? 'animate-spin' : ''}`} />
                        {submitting ? 'Fechando…' : isFiado ? 'Fechar no fiado' : 'Confirmar pagamento'}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}

function CustomerPicker({
    open, onClose, onPick,
}: {
    open: boolean;
    onClose: () => void;
    onPick: (c: TableOrderCustomer) => void;
}) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState<TableOrderCustomer[]>([]);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (!open) { setQ(''); setResults([]); setCreating(false); return; }
        const t = setTimeout(async () => {
            const r = await fetch(`/customers/search?q=${encodeURIComponent(q)}`, { headers: { Accept: 'application/json' } });
            if (r.ok) setResults(await r.json());
        }, 200);
        return () => clearTimeout(t);
    }, [q, open]);

    if (creating) {
        return (
            <QuickCustomerForm
                open={open}
                initialName={q}
                onClose={onClose}
                onBack={() => setCreating(false)}
                onCreated={(c) => onPick(c)}
            />
        );
    }

    return (
        <Dialog open={open} onClose={onClose} title="Identificar cliente" size="md">
            <div className="space-y-3">
                <Input placeholder="Buscar por nome, doc ou telefone…" value={q} onChange={(e) => setQ(e.target.value)} sizeBig autoFocus />
                <div className="max-h-72 overflow-y-auto rounded-md border border-ink-200 dark:border-ink-800">
                    {results.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-ink-500">
                            {q ? (
                                <div className="space-y-3">
                                    <div>Nenhum cliente encontrado para “{q}”.</div>
                                    <Button onClick={() => setCreating(true)}>
                                        <Icon name="mdi:account-plus" className="h-4 w-4" />
                                        Cadastrar “{q}” agora
                                    </Button>
                                </div>
                            ) : 'Comece a digitar para buscar.'}
                        </div>
                    ) : results.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => onPick(c)}
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
                <div className="flex justify-between">
                    <button
                        type="button"
                        onClick={() => setCreating(true)}
                        className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline dark:text-brand-300"
                    >
                        <Icon name="mdi:plus" className="h-4 w-4" />
                        Cadastrar novo cliente
                    </button>
                    <Button variant="ghost" onClick={onClose}>Fechar</Button>
                </div>
            </div>
        </Dialog>
    );
}

/** Cadastro rápido (nome + celular) — usado nas mesas e no fiado, sem sair da tela. */
function QuickCustomerForm({
    open, initialName, onClose, onBack, onCreated,
}: {
    open: boolean;
    initialName?: string;
    onClose: () => void;
    onBack?: () => void;
    onCreated: (c: TableOrderCustomer) => void;
}) {
    const [name, setName] = useState(initialName ?? '');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (open) { setName(initialName ?? ''); setPhone(''); setErr(null); setSaving(false); }
    }, [open, initialName]);

    const submit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!name.trim()) { setErr('Informe o nome do cliente.'); return; }
        setSaving(true);
        setErr(null);
        try {
            const c = await api('/customers/quick', 'POST', { name: name.trim(), phone: phone.trim() || null });
            onCreated(c);
        } catch (e) {
            setErr((e as Error).message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} title="Cadastrar cliente" size="sm">
            <form onSubmit={submit} className="space-y-3">
                <Input label="Nome *" value={name} onChange={(e) => setName(e.target.value)} sizeBig autoFocus />
                <Input
                    label="Celular / WhatsApp"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    inputMode="tel"
                    hint="Opcional"
                />
                {err && (
                    <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200">
                        <Icon name="mdi:alert-circle-outline" className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{err}</span>
                    </div>
                )}
                <div className="flex justify-between gap-2 pt-2">
                    <Button type="button" variant="ghost" onClick={onBack ?? onClose} disabled={saving}>
                        <Icon name="mdi:arrow-left" className="h-4 w-4" />
                        Voltar
                    </Button>
                    <Button type="submit" disabled={saving}>
                        <Icon name={saving ? 'mdi:loading' : 'mdi:check'} className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
                        {saving ? 'Salvando…' : 'Cadastrar e usar'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}

function FinishPrompt({
    success, onPrint, onSkip,
}: {
    success: { code: string; receipt: string; change: number | null; total: number; fiado: boolean } | null;
    onPrint: () => void;
    onSkip: () => void;
}) {
    useEffect(() => {
        if (!success) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter') { e.preventDefault(); onPrint(); }
            else if (e.key === 'Escape') { e.preventDefault(); onSkip(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [success, onPrint, onSkip]);

    return (
        <Dialog open={!!success} onClose={onSkip} title={`Mesa fechada — venda ${success?.code}`} size="sm">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                    <Icon name="mdi:check-circle-outline" className="h-5 w-5 text-emerald-500" />
                    {success?.fiado ? 'Lançado no fiado — saldo registrado para o cliente.' : 'Estoque atualizado e mesa liberada.'}
                </div>
                <div className="rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-center dark:border-ink-700 dark:bg-ink-950/60">
                    <div className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">Valor da venda</div>
                    <div className="text-3xl font-black tabular-nums text-ink-900 dark:text-ink-50">{success ? brl(success.total) : '—'}</div>
                </div>
                {success?.change != null && success.change > 0 && (
                    <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                        <div className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Troco</div>
                        <div className="text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-200">{brl(success.change)}</div>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="lg" onClick={onSkip}>
                        <Icon name="mdi:close" className="h-5 w-5" />
                        Voltar às mesas
                    </Button>
                    <Button size="lg" onClick={onPrint} autoFocus>
                        <Icon name="mdi:printer-outline" className="h-5 w-5" />
                        Imprimir cupom
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
