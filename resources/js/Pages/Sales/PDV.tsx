import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Dialog from '@/Components/ui/Dialog';
import Badge from '@/Components/ui/Badge';
import Icon from '@/Components/ui/Icon';
import { brl, num, paymentLabel } from '@/lib/format';
import { useShortcut } from '@/hooks/use-shortcut';
import type { Customer, PaymentMethod, Product } from '@/types';

interface CartItem {
    product_id: number;
    sku: string;
    barcode: string | null;
    name: string;
    qty: number;
    unit_price: number;
    stock_qty: number;
    warranty_days: number;
}

type Action =
    | { type: 'add'; product: Product }
    | { type: 'inc'; id: number }
    | { type: 'dec'; id: number }
    | { type: 'set_qty'; id: number; qty: number }
    | { type: 'remove'; id: number }
    | { type: 'clear' };

function cartReducer(state: CartItem[], action: Action): CartItem[] {
    switch (action.type) {
        case 'add': {
            const p = action.product;
            const idx = state.findIndex((i) => i.product_id === p.id);
            if (idx >= 0) {
                const next = [...state];
                next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
                return next;
            }
            return [
                ...state,
                {
                    product_id: p.id,
                    sku: p.sku,
                    barcode: p.barcode,
                    name: p.name,
                    qty: 1,
                    unit_price: num(p.sale_price),
                    stock_qty: p.stock_qty,
                    warranty_days: p.warranty_days,
                },
            ];
        }
        case 'inc':
            return state.map((i) => i.product_id === action.id ? { ...i, qty: i.qty + 1 } : i);
        case 'dec':
            return state
                .map((i) => i.product_id === action.id ? { ...i, qty: i.qty - 1 } : i)
                .filter((i) => i.qty > 0);
        case 'set_qty':
            return state.map((i) => i.product_id === action.id ? { ...i, qty: Math.max(1, action.qty) } : i);
        case 'remove':
            return state.filter((i) => i.product_id !== action.id);
        case 'clear':
            return [];
    }
}

export default function PDV() {
    const [cart, dispatch] = useReducer(cartReducer, [] as CartItem[]);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [searching, setSearching] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [customerOpen, setCustomerOpen] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [discount, setDiscount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState<{ code: string; id: number; change: number | null; total: number } | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const subtotal = useMemo(() => cart.reduce((s, i) => s + i.unit_price * i.qty, 0), [cart]);
    const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);
    const itemsCount = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart]);

    useEffect(() => {
        if (paymentOpen || customerOpen || success) return;
        const focusInterval = setInterval(() => {
            if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                inputRef.current?.focus();
            }
        }, 500);
        inputRef.current?.focus();
        return () => clearInterval(focusInterval);
    }, [paymentOpen, customerOpen, success]);

    useEffect(() => {
        const term = search.trim();
        if (!term) { setResults([]); return; }
        setSearching(true);
        const t = setTimeout(async () => {
            try {
                const r = await fetch(`/products/search?q=${encodeURIComponent(term)}`, {
                    headers: { Accept: 'application/json' },
                });
                if (!r.ok) return;
                const data: Product[] = await r.json();

                // Match exato por barcode ou SKU → adiciona automático sem precisar de Enter
                // (scanners que mandam "ENTER" já são cobertos pelo onSearchKey; isso cobre
                //  scanners sem ENTER e digitação manual do código completo).
                const exact = data.find((p) => p.barcode === term || p.sku === term);
                if (exact) {
                    addProduct(exact);
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
        if (e.key === 'Enter') {
            e.preventDefault();
            const term = search.trim();
            if (!term) return;
            (async () => {
                const r = await fetch(`/products/search?q=${encodeURIComponent(term)}&exact=1`, {
                    headers: { Accept: 'application/json' },
                });
                if (r.ok) {
                    const data: Product[] = await r.json();
                    if (data.length === 1) {
                        addProduct(data[0]);
                        setSearch('');
                        setResults([]);
                    } else if (data.length === 0) {
                        if (results[0]) {
                            addProduct(results[0]);
                            setSearch('');
                            setResults([]);
                        } else {
                            setError(`Produto não encontrado: ${term}`);
                            setTimeout(() => setError(null), 2500);
                        }
                    } else {
                        setResults(data);
                    }
                }
            })();
        }
    };

    const addProduct = (p: Product) => {
        if (p.stock_qty <= 0) {
            setError(`${p.name} sem estoque.`);
            setTimeout(() => setError(null), 2500);
            return;
        }
        const inCart = cart.find((i) => i.product_id === p.id)?.qty ?? 0;
        if (inCart + 1 > p.stock_qty) {
            setError(`Estoque insuficiente para ${p.name}. Disponível: ${p.stock_qty}.`);
            setTimeout(() => setError(null), 2500);
            return;
        }
        dispatch({ type: 'add', product: p });
    };

    const finalize = async (method: PaymentMethod, amountReceived: number | null, customerDoc: string | null) => {
        const payload = {
            customer_id: customer?.id ?? null,
            customer_document: customerDoc || null,
            items: cart.map((i) => ({ product_id: i.product_id, qty: i.qty, unit_price: i.unit_price })),
            payment: { method, amount_received: amountReceived, discount },
        };

        setSubmitting(true);
        try {
            // Fetch direto (não Inertia) pra NÃO redirecionar pra /sales/{id}.
            // O SaleController devolve JSON quando recebe Accept: application/json.
            const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null)?.content ?? '';
            const res = await fetch('/sales', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                const msg = body?.errors
                    ? Object.values(body.errors).flat().join(' • ')
                    : body?.message || 'Erro ao finalizar venda.';
                setError(String(msg));
                setTimeout(() => setError(null), 3500);
                return;
            }

            const data = await res.json();
            const sale = data.sale;
            if (!sale) {
                setError('Resposta inválida do servidor.');
                setTimeout(() => setError(null), 3500);
                return;
            }

            setSuccess({
                code: sale.code,
                id: sale.id,
                change: sale.change_due != null ? Number(sale.change_due) : null,
                total: Number(sale.total),
            });
            dispatch({ type: 'clear' });
            setCustomer(null);
            setDiscount(0);
            setPaymentOpen(false);
            // Atualiza props do Inertia (estoque, alertas) sem sair da página
            router.reload({ only: ['alerts'] });
        } catch (e) {
            setError('Erro de rede ao finalizar venda.');
            setTimeout(() => setError(null), 3500);
        } finally {
            setSubmitting(false);
        }
    };

    useShortcut(
        {
            f4: () => { if (cart.length > 0) setPaymentOpen(true); },
            f2: () => setCustomerOpen(true),
            f8: () => { if (confirm('Limpar carrinho?')) { dispatch({ type: 'clear' }); setCustomer(null); setDiscount(0); } },
            esc: () => { setSearch(''); setResults([]); },
        },
        { enabled: !paymentOpen && !customerOpen && !success }
    );

    return (
        <AppLayout title="PDV — Ponto de Venda">
            <Head title="PDV" />

            {error && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800 shadow-lg animate-slide-up dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200">
                    <Icon name="mdi:alert-circle-outline" className="h-4 w-4" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[500px] lg:h-[calc(100vh-180px)]">
                {/* Coluna esquerda */}
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
                            hint={searching ? 'Buscando…' : results.length > 0 ? `${results.length} resultado(s) — Enter pra adicionar 1º / clique pra escolher` : 'Foco automático: pode bipar a qualquer momento'}
                        />
                        {results.length > 0 && (
                            <div className="mt-2 max-h-56 overflow-y-auto rounded-md border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950">
                                {results.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => { addProduct(p); setSearch(''); setResults([]); }}
                                        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-ink-50 border-b border-ink-200 last:border-0 dark:hover:bg-ink-800 dark:border-ink-800"
                                    >
                                        <div>
                                            <div className="font-medium">{p.name}</div>
                                            <div className="text-xs text-ink-500">{p.sku} {p.barcode && `· ${p.barcode}`}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-brand-600 dark:text-brand-300">{brl(p.sale_price)}</div>
                                            <div className="text-xs text-ink-500">est. {p.stock_qty}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto rounded-xl border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900/40">
                        {cart.length === 0 ? (
                            <div className="grid h-full place-items-center text-center p-6">
                                <div>
                                    <Icon name="mdi:cart-outline" className="mx-auto h-16 w-16 text-ink-300 dark:text-ink-600" />
                                    <div className="mt-2 text-lg text-ink-600 dark:text-ink-300">Carrinho vazio</div>
                                    <div className="text-sm text-ink-500 mt-1">Bipe um produto ou busque pra começar</div>
                                </div>
                            </div>
                        ) : (
                            <table className="w-full text-sm">
                                <thead className="bg-ink-50 text-xs uppercase text-ink-500 sticky top-0 dark:bg-ink-900/80 dark:text-ink-400">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Produto</th>
                                        <th className="px-2 py-2 w-24 text-center">Qtd</th>
                                        <th className="px-2 py-2 w-28 text-right">Unit.</th>
                                        <th className="px-2 py-2 w-28 text-right">Total</th>
                                        <th className="px-2 py-2 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-ink-200 dark:divide-ink-800">
                                    {cart.map((it) => (
                                        <tr key={it.product_id}>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{it.name}</div>
                                                <div className="text-xs text-ink-500">{it.sku}</div>
                                            </td>
                                            <td className="px-2 py-3">
                                                <div className="inline-flex items-center gap-1">
                                                    <button onClick={() => dispatch({ type: 'dec', id: it.product_id })} className="rounded bg-ink-100 px-2 py-1 hover:bg-ink-200 dark:bg-ink-800 dark:hover:bg-ink-700">
                                                        <Icon name="mdi:minus" className="h-4 w-4" />
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={it.stock_qty}
                                                        value={it.qty}
                                                        onChange={(e) => dispatch({ type: 'set_qty', id: it.product_id, qty: parseInt(e.target.value) || 1 })}
                                                        className="w-12 rounded border border-ink-300 bg-white px-1 py-1 text-center text-sm dark:border-ink-700 dark:bg-ink-900"
                                                    />
                                                    <button onClick={() => dispatch({ type: 'inc', id: it.product_id })} className="rounded bg-ink-100 px-2 py-1 hover:bg-ink-200 dark:bg-ink-800 dark:hover:bg-ink-700">
                                                        <Icon name="mdi:plus" className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-2 py-3 text-right font-mono">{brl(it.unit_price)}</td>
                                            <td className="px-2 py-3 text-right font-mono font-semibold">{brl(it.unit_price * it.qty)}</td>
                                            <td className="px-2 py-3 text-right">
                                                <button
                                                    onClick={() => dispatch({ type: 'remove', id: it.product_id })}
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
                        {customer ? (
                            <div className="mt-1 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">{customer.name}</div>
                                    <div className="text-xs text-ink-500">{customer.whatsapp ?? customer.phone ?? customer.document}</div>
                                </div>
                                <button
                                    onClick={() => setCustomer(null)}
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
                                <kbd className="ml-2 rounded border border-ink-300 bg-ink-50 px-1.5 py-0.5 text-[10px] dark:border-ink-600 dark:bg-ink-950">F2</kbd>
                            </Button>
                        )}
                    </div>

                    <div className="flex-1 rounded-xl border border-ink-200 bg-gradient-to-br from-brand-50 to-white p-5 dark:border-ink-800 dark:from-brand-600/10 dark:to-ink-900">
                        <div className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">Total da venda</div>
                        <div className="mt-1 text-5xl font-black text-ink-900 dark:text-ink-50 tabular-nums">{brl(total)}</div>
                        <div className="mt-3 space-y-1 text-sm">
                            <div className="flex justify-between text-ink-600 dark:text-ink-300">
                                <span>{itemsCount} item(ns)</span>
                                <span className="font-mono">{brl(subtotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-ink-600 dark:text-ink-300">
                                <span>Desconto (R$)</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    max={subtotal}
                                    value={discount}
                                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                                    className="w-24 rounded border border-ink-300 bg-white px-2 py-1 text-right font-mono text-sm dark:border-ink-700 dark:bg-ink-900"
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        size="xl"
                        block
                        disabled={cart.length === 0}
                        onClick={() => setPaymentOpen(true)}
                    >
                        <Icon name="mdi:credit-card-outline" className="h-5 w-5" />
                        Finalizar venda
                        <kbd className="ml-2 rounded border border-white/30 bg-black/30 px-1.5 py-0.5 text-[10px]">F4</kbd>
                    </Button>

                    <div className="grid grid-cols-2 gap-2 text-xs text-ink-500 dark:text-ink-400">
                        <div className="rounded border border-ink-200 px-2 py-2 text-center dark:border-ink-800"><kbd className="mr-1">F2</kbd> Cliente</div>
                        <div className="rounded border border-ink-200 px-2 py-2 text-center dark:border-ink-800"><kbd className="mr-1">F4</kbd> Pagar</div>
                        <div className="rounded border border-ink-200 px-2 py-2 text-center dark:border-ink-800"><kbd className="mr-1">F8</kbd> Limpar</div>
                        <div className="rounded border border-ink-200 px-2 py-2 text-center dark:border-ink-800"><kbd className="mr-1">Esc</kbd> Limpar busca</div>
                    </div>
                </div>
            </div>

            <PaymentModal
                open={paymentOpen}
                onClose={() => setPaymentOpen(false)}
                total={total}
                submitting={submitting}
                defaultDocument={customer?.document ?? ''}
                onConfirm={finalize}
            />
            <CustomerPicker open={customerOpen} onClose={() => setCustomerOpen(false)} onPick={(c) => { setCustomer(c); setCustomerOpen(false); }} />

            <PrintPrompt
                success={success}
                onPrint={() => {
                    if (success) window.open(`/sales/${success.id}/receipt?print=1`, '_blank', 'noopener,noreferrer');
                    setSuccess(null);
                }}
                onSkip={() => setSuccess(null)}
            />
        </AppLayout>
    );
}

// ---------- Modal "Deseja imprimir o cupom?" ----------
function PrintPrompt({
    success,
    onPrint,
    onSkip,
}: {
    success: { code: string; id: number; change: number | null; total: number } | null;
    onPrint: () => void;
    onSkip: () => void;
}) {
    useEffect(() => {
        if (!success) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Enter') { e.preventDefault(); onPrint(); }
            else if (e.key === 'Escape') { e.preventDefault(); onSkip(); }
            else if (e.key.toLowerCase() === 's') { e.preventDefault(); onPrint(); }
            else if (e.key.toLowerCase() === 'n') { e.preventDefault(); onSkip(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [success, onPrint, onSkip]);

    return (
        <Dialog open={!!success} onClose={onSkip} title={`Venda ${success?.code} registrada!`} size="sm">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
                    <Icon name="mdi:check-circle-outline" className="h-5 w-5 text-emerald-500" />
                    Estoque atualizado, garantias geradas (se aplicável).
                </div>

                <div className="rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-center dark:border-ink-700 dark:bg-ink-950/60">
                    <div className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">Valor da venda</div>
                    <div className="text-3xl font-black text-ink-900 dark:text-ink-50 tabular-nums">
                        {success ? brl(success.total) : '—'}
                    </div>
                </div>

                {success?.change != null && success.change > 0 && (
                    <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                        <div className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Troco</div>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-200 tabular-nums">{brl(success.change)}</div>
                    </div>
                )}

                <div className="pt-1">
                    <p className="text-center text-sm text-ink-700 dark:text-ink-200">
                        Deseja imprimir o cupom desta venda?
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="lg" onClick={onSkip} autoFocus={false}>
                        <Icon name="mdi:close" className="h-5 w-5" />
                        Não (N)
                    </Button>
                    <Button size="lg" onClick={onPrint} autoFocus>
                        <Icon name="mdi:printer-outline" className="h-5 w-5" />
                        Sim, imprimir (Enter)
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}

// ---------- Sub-componentes ----------

const PAYMENT_ICONS: Record<PaymentMethod, string> = {
    cash: 'mdi:cash',
    pix: 'mdi:qrcode',
    credit: 'mdi:credit-card-outline',
    debit: 'mdi:bank-outline',
};

function PaymentModal({
    open, onClose, total, submitting, defaultDocument, onConfirm,
}: {
    open: boolean;
    onClose: () => void;
    total: number;
    submitting: boolean;
    defaultDocument?: string;
    onConfirm: (method: PaymentMethod, received: number | null, customerDoc: string | null) => void;
}) {
    const [method, setMethod] = useState<PaymentMethod>('cash');
    const [received, setReceived] = useState<number>(total);
    const [doc, setDoc] = useState<string>('');
    const [showDocField, setShowDocField] = useState(false);
    const change = method === 'cash' ? Math.max(0, received - total) : 0;

    useEffect(() => {
        if (open) {
            setReceived(total);
            setDoc(defaultDocument ?? '');
            setShowDocField(!!defaultDocument);
        }
    }, [open, total, defaultDocument]);

    const submit = () => {
        if (method === 'cash' && received < total) { alert('Valor recebido é menor que o total!'); return; }
        onConfirm(method, method === 'cash' ? received : null, doc.trim() || null);
    };

    return (
        <Dialog open={open} onClose={onClose} title="Finalizar pagamento" size="md">
            <div className="space-y-4">
                <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-center dark:border-brand-500/30 dark:bg-brand-600/10">
                    <div className="text-xs uppercase tracking-wide text-brand-700 dark:text-brand-300">Total a pagar</div>
                    <div className="text-4xl font-black text-ink-900 dark:text-ink-50 tabular-nums">{brl(total)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {(['cash', 'pix', 'credit', 'debit'] as PaymentMethod[]).map((m) => (
                        <button
                            key={m}
                            type="button"
                            onClick={() => setMethod(m)}
                            className={`rounded-lg border px-4 py-3 text-left transition-colors ${
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
                            <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-100 tabular-nums">{brl(change)}</span>
                        </div>
                    </div>
                )}

                {/* --- CPF na nota --- */}
                <div className="rounded-lg border border-ink-200 bg-ink-50/60 p-3 dark:border-ink-800 dark:bg-ink-950/50">
                    {showDocField ? (
                        <Input
                            label="CPF / CNPJ na nota"
                            value={doc}
                            onChange={(e) => setDoc(e.target.value)}
                            placeholder="000.000.000-00"
                            hint="Opcional — aparece no cupom."
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => setShowDocField(true)}
                            className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:underline dark:text-brand-300"
                        >
                            <Icon name="mdi:card-account-details-outline" className="h-4 w-4" />
                            Incluir CPF / CNPJ na nota
                        </button>
                    )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancelar (Esc)</Button>
                    <Button onClick={submit} size="lg" disabled={submitting}>
                        <Icon name={submitting ? 'mdi:loading' : 'mdi:check'} className={`h-5 w-5 ${submitting ? 'animate-spin' : ''}`} />
                        {submitting ? 'Registrando…' : 'Confirmar pagamento'}
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
    onPick: (c: Customer) => void;
}) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState<Customer[]>([]);

    useEffect(() => {
        if (!open) return;
        const t = setTimeout(async () => {
            const r = await fetch(`/customers/search?q=${encodeURIComponent(q)}`, { headers: { Accept: 'application/json' } });
            if (r.ok) setResults(await r.json());
        }, 200);
        return () => clearTimeout(t);
    }, [q, open]);

    return (
        <Dialog open={open} onClose={onClose} title="Identificar cliente" size="md">
            <div className="space-y-3">
                <Input placeholder="Buscar por nome, doc ou telefone…" value={q} onChange={(e) => setQ(e.target.value)} sizeBig autoFocus />
                <div className="max-h-72 overflow-y-auto rounded-md border border-ink-200 dark:border-ink-800">
                    {results.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-ink-500">
                            {q ? 'Nenhum cliente encontrado.' : 'Comece a digitar para buscar.'}
                        </div>
                    ) : results.map((c) => (
                        <button
                            key={c.id}
                            onClick={() => onPick(c)}
                            className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-ink-50 border-b border-ink-200 last:border-0 dark:hover:bg-ink-800 dark:border-ink-800"
                        >
                            <div>
                                <div className="font-medium">{c.name}</div>
                                <div className="text-xs text-ink-500">{c.document || c.email}</div>
                            </div>
                            <Badge tone="default">{c.whatsapp ?? c.phone ?? '—'}</Badge>
                        </button>
                    ))}
                </div>
                <div className="flex justify-between">
                    <a href="/customers?new=1" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline dark:text-brand-300">
                        <Icon name="mdi:plus" className="h-4 w-4" />
                        Cadastrar novo cliente
                    </a>
                    <Button variant="ghost" onClick={onClose}>Continuar sem identificar</Button>
                </div>
            </div>
        </Dialog>
    );
}
