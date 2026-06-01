import { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import Dialog from '@/Components/ui/Dialog';
import Input from '@/Components/ui/Input';
import Button from '@/Components/ui/Button';
import Icon from '@/Components/ui/Icon';
import { brl, dateTimeBr } from '@/lib/format';
import type { Product } from '@/types';

interface Movement {
    id: number;
    type: string;
    type_label: string;
    qty: number;
    balance_after: number;
    reason: string;
    user: string | null;
    created_at: string | null;
}

type MoveType = 'in' | 'out' | 'adjust';

const TYPE_META: Record<MoveType, { label: string; icon: string; reason: string }> = {
    in:     { label: 'Entrada',  icon: 'mdi:tray-arrow-down', reason: 'Entrada de mercadoria' },
    out:    { label: 'Saída',    icon: 'mdi:tray-arrow-up',   reason: 'Baixa manual' },
    adjust: { label: 'Ajuste',   icon: 'mdi:tune-variant',    reason: 'Ajuste de inventário' },
};

export default function StockDialog({ open, product, onClose }: { open: boolean; product: Product | null; onClose: () => void }) {
    const hasPack = !!product?.pack_label && Number(product?.pack_size) > 1;
    const packSize = Number(product?.pack_size) || 1;
    const unitLabel = product?.unit_label || 'un';

    const [type, setType] = useState<MoveType>('in');
    const [um, setUm] = useState<'unit' | 'pack'>('unit');
    const [currentStock, setCurrentStock] = useState<number>(product?.stock_qty ?? 0);
    const [movements, setMovements] = useState<Movement[]>([]);

    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'in' as MoveType,
        um: 'unit' as 'unit' | 'pack',
        qty: '' as string | number,
        reason: TYPE_META.in.reason,
    });

    const fetchMovements = async () => {
        if (!product) return;
        const r = await fetch(`/products/${product.id}/movements`, { headers: { Accept: 'application/json' } });
        if (r.ok) {
            const m: Movement[] = await r.json();
            setMovements(m);
            if (m[0]) setCurrentStock(m[0].balance_after);
        }
    };

    useEffect(() => {
        if (!open || !product) return;
        setType('in');
        setUm('unit');
        setCurrentStock(product.stock_qty ?? 0);
        reset();
        setData({ type: 'in', um: 'unit', qty: '', reason: TYPE_META.in.reason });
        fetchMovements();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, product?.id]);

    if (!product) return null;

    const multiplier = type !== 'adjust' && um === 'pack' && hasPack ? packSize : 1;
    const qtyNum = parseInt(String(data.qty)) || 0;
    const baseQty = qtyNum * multiplier;
    const newStock = type === 'in' ? currentStock + baseQty
        : type === 'out' ? currentStock - baseQty
        : qtyNum; // ajuste é absoluto em unidades

    const chooseType = (t: MoveType) => {
        setType(t);
        setData('type', t);
        setData('reason', TYPE_META[t].reason);
        if (t === 'adjust') { setUm('unit'); setData('um', 'unit'); }
    };

    const chooseUm = (u: 'unit' | 'pack') => { setUm(u); setData('um', u); };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/products/${product.id}/stock`, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => { setData('qty', ''); fetchMovements(); },
        });
    };

    return (
        <Dialog open={open} onClose={onClose} title={`Estoque — ${product.name}`} size="lg">
            <div className="space-y-4">
                {/* Estoque atual */}
                <div className="rounded-lg border border-ink-200 bg-ink-50/60 p-3 dark:border-ink-800 dark:bg-ink-950/50">
                    <div className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">Estoque atual</div>
                    <div className="text-2xl font-bold tabular-nums">
                        {currentStock} {unitLabel}
                        {hasPack && (
                            <span className="ml-2 text-sm font-normal text-ink-500">
                                ≈ {Math.floor(currentStock / packSize)} {product.pack_label}{currentStock % packSize > 0 ? ` + ${currentStock % packSize} ${unitLabel}` : ''}
                            </span>
                        )}
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-3">
                    {/* Tipo */}
                    <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(TYPE_META) as MoveType[]).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => chooseType(t)}
                                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                                    type === t
                                        ? 'border-brand-500 bg-brand-50 text-ink-900 dark:bg-brand-500/15 dark:text-ink-50'
                                        : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300 dark:hover:bg-ink-800'
                                }`}
                            >
                                <Icon name={TYPE_META[t].icon} className="mx-auto h-5 w-5" />
                                <div className="mt-0.5">{TYPE_META[t].label}</div>
                            </button>
                        ))}
                    </div>

                    {/* Unidade de medida (só p/ entrada/saída e se tem caixa) */}
                    {hasPack && type !== 'adjust' && (
                        <div>
                            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-600 dark:text-ink-300">
                                Movimentar em
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button type="button" onClick={() => chooseUm('unit')}
                                    className={`rounded-lg border px-3 py-2 text-sm ${um === 'unit' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15' : 'border-ink-200 dark:border-ink-700'}`}>
                                    {unitLabel} (avulso)
                                </button>
                                <button type="button" onClick={() => chooseUm('pack')}
                                    className={`rounded-lg border px-3 py-2 text-sm ${um === 'pack' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/15' : 'border-ink-200 dark:border-ink-700'}`}>
                                    {product.pack_label} ({packSize} {unitLabel})
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                            label={type === 'adjust' ? `Novo estoque (em ${unitLabel})` : `Quantidade (${um === 'pack' && hasPack ? product.pack_label : unitLabel})`}
                            type="number"
                            min={0}
                            value={data.qty as any}
                            onChange={(e) => setData('qty', e.target.value)}
                            error={errors.qty}
                            autoFocus
                        />
                        <Input
                            label="Motivo"
                            value={data.reason}
                            onChange={(e) => setData('reason', e.target.value)}
                            error={errors.reason}
                        />
                    </div>

                    {/* Preview */}
                    {qtyNum > 0 && (
                        <div className="rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm dark:border-brand-500/30 dark:bg-brand-600/10">
                            <Icon name="mdi:information-outline" className="mr-1 inline h-4 w-4 text-brand-600 dark:text-brand-300" />
                            {type === 'adjust' ? (
                                <>Estoque será definido para <strong>{qtyNum} {unitLabel}</strong>.</>
                            ) : (
                                <>
                                    {um === 'pack' && hasPack ? <>{qtyNum} {product.pack_label} = </> : null}
                                    <strong>{type === 'in' ? '+' : '−'}{baseQty} {unitLabel}</strong> → novo estoque: <strong>{newStock} {unitLabel}</strong>
                                </>
                            )}
                            {newStock < 0 && <span className="ml-2 text-red-600 dark:text-red-300">(estoque ficaria negativo!)</span>}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button type="submit" disabled={processing || qtyNum < 0 || (type !== 'adjust' && qtyNum === 0) || newStock < 0}>
                            <Icon name="mdi:content-save-outline" className="h-4 w-4" />
                            Registrar movimentação
                        </Button>
                    </div>
                </form>

                {/* Histórico */}
                {movements.length > 0 && (
                    <div>
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">Últimas movimentações</div>
                        <div className="max-h-48 overflow-y-auto rounded-md border border-ink-200 dark:border-ink-800">
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-ink-200 dark:divide-ink-800">
                                    {movements.map((m) => (
                                        <tr key={m.id}>
                                            <td className="px-3 py-1.5">
                                                <span className={`font-medium ${m.type === 'in' ? 'text-emerald-600 dark:text-emerald-300' : m.type === 'out' ? 'text-red-600 dark:text-red-300' : 'text-ink-600 dark:text-ink-300'}`}>
                                                    {m.type_label}
                                                </span>
                                                <span className="ml-2 text-ink-500">{m.reason}</span>
                                            </td>
                                            <td className="px-3 py-1.5 text-right font-mono">{m.type === 'in' ? '+' : m.type === 'out' ? '−' : '='}{m.qty}</td>
                                            <td className="px-3 py-1.5 text-right text-ink-500">→ {m.balance_after}</td>
                                            <td className="px-3 py-1.5 text-right text-xs text-ink-400">{dateTimeBr(m.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Dialog>
    );
}
