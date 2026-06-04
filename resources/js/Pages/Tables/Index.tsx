import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Dialog from '@/Components/ui/Dialog';
import Icon from '@/Components/ui/Icon';
import { brl } from '@/lib/format';
import type { RestaurantTable } from '@/types';

interface Props {
    tables: RestaurantTable[];
}

export default function TablesIndex({ tables }: Props) {
    const [newOpen, setNewOpen] = useState(false);

    const occupied = tables.filter((t) => t.status === 'occupied');
    const totalOpen = occupied.reduce((s, t) => s + (t.order?.subtotal ?? 0), 0);

    return (
        <AppLayout
            title="Mesas"
            actions={
                <Button variant="secondary" onClick={() => setNewOpen(true)}>
                    <Icon name="mdi:plus" className="h-4 w-4" />
                    Nova mesa
                </Button>
            }
        >
            <Head title="Mesas" />

            {/* Resumo */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <SummaryCard label="Mesas" value={String(tables.length)} icon="mdi:table-furniture" />
                <SummaryCard label="Ocupadas" value={String(occupied.length)} icon="mdi:account-group-outline" tone="amber" />
                <SummaryCard label="Em aberto" value={brl(totalOpen)} icon="mdi:cash-multiple" tone="emerald" />
            </div>

            {tables.length === 0 ? (
                <div className="grid place-items-center rounded-xl border border-dashed border-ink-300 bg-white py-16 text-center dark:border-ink-700 dark:bg-ink-900/40">
                    <Icon name="mdi:table-furniture" className="h-16 w-16 text-ink-300 dark:text-ink-600" />
                    <div className="mt-2 text-lg text-ink-600 dark:text-ink-300">Nenhuma mesa cadastrada</div>
                    <div className="text-sm text-ink-500">Crie a primeira mesa para começar a atender.</div>
                    <Button className="mt-4" onClick={() => setNewOpen(true)}>
                        <Icon name="mdi:plus" className="h-4 w-4" />
                        Nova mesa
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {tables.map((t) => (
                        <TableCard key={t.id} table={t} />
                    ))}
                </div>
            )}

            <NewTableDialog open={newOpen} onClose={() => setNewOpen(false)} />
        </AppLayout>
    );
}

function SummaryCard({ label, value, icon, tone }: { label: string; value: string; icon: string; tone?: 'amber' | 'emerald' }) {
    const toneCls =
        tone === 'amber'
            ? 'text-amber-600 dark:text-amber-300'
            : tone === 'emerald'
            ? 'text-emerald-600 dark:text-emerald-300'
            : 'text-brand-600 dark:text-brand-300';
    return (
        <div className="rounded-xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900/60">
            <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">{label}</span>
                <Icon name={icon} className={`h-5 w-5 ${toneCls}`} />
            </div>
            <div className={`mt-1 text-2xl font-black tabular-nums ${toneCls}`}>{value}</div>
        </div>
    );
}

function TableCard({ table }: { table: RestaurantTable }) {
    const occupied = table.status === 'occupied';
    const order = table.order;

    return (
        <button
            type="button"
            onClick={() => router.visit(`/tables/${table.id}`)}
            className={`group relative flex min-h-[150px] flex-col rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                occupied
                    ? 'border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10'
                    : 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10'
            }`}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <span
                        className={`grid h-9 w-9 place-items-center rounded-lg ${
                            occupied
                                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-200'
                                : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-200'
                        }`}
                    >
                        <Icon name="mdi:table-furniture" className="h-5 w-5" />
                    </span>
                    <div>
                        <div className="font-bold text-ink-900 dark:text-ink-50">{table.name}</div>
                        {table.capacity ? (
                            <div className="text-[11px] text-ink-500 dark:text-ink-400">{table.capacity} lugares</div>
                        ) : null}
                    </div>
                </div>
                <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        occupied
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-500 text-white'
                    }`}
                >
                    {occupied ? 'Ocupada' : 'Livre'}
                </span>
            </div>

            <div className="mt-auto pt-3">
                {occupied && order ? (
                    <>
                        <div className="text-xs text-ink-600 dark:text-ink-300">
                            {order.customer ? order.customer.name : 'Sem cliente'} · {order.items_count} item(ns)
                        </div>
                        <div className="text-xl font-black tabular-nums text-ink-900 dark:text-ink-50">{brl(order.subtotal)}</div>
                    </>
                ) : (
                    <div className="flex items-center gap-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        <Icon name="mdi:play-circle-outline" className="h-4 w-4" />
                        Abrir comanda
                    </div>
                )}
            </div>
        </button>
    );
}

function NewTableDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        capacity: '',
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/tables', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onClose={onClose} title="Nova mesa" size="sm">
            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Nome / número"
                    placeholder="Ex.: Mesa 1"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    error={errors.name}
                    autoFocus
                />
                <Input
                    label="Capacidade (lugares)"
                    type="number"
                    min={1}
                    placeholder="Opcional"
                    value={data.capacity}
                    onChange={(e) => setData('capacity', e.target.value)}
                    error={errors.capacity}
                />
                <Input
                    label="Observações"
                    placeholder="Opcional"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    error={errors.notes}
                />
                <div className="flex justify-end gap-2 pt-1">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={processing}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={processing || !data.name.trim()}>
                        <Icon name={processing ? 'mdi:loading' : 'mdi:check'} className={`h-5 w-5 ${processing ? 'animate-spin' : ''}`} />
                        Criar mesa
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}
