import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import { Table, TBody, TD, TH, THead, TR } from '@/Components/ui/Table';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import { dateBr, warrantyStatusLabel } from '@/lib/format';
import type { Paginated, Warranty } from '@/types';
import { useState } from 'react';

interface Props {
    warranties: Paginated<Warranty>;
    filters: { q: string; status: string | null };
    nearExpiryDays: number;
}

export default function WarrantiesIndex({ warranties, filters, nearExpiryDays }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const apply = () => router.get('/warranties', { q, status: status || undefined }, { preserveState: true, replace: true });

    const markUsed = (id: number) => {
        if (!confirm('Marcar como utilizada?')) return;
        router.post(`/warranties/${id}/used`);
    };
    const notify = (id: number) => {
        if (!confirm('Enviar notificação simulada (WhatsApp) ao cliente?')) return;
        router.post(`/warranties/${id}/notify`);
    };

    return (
        <AppLayout title="Garantias">
            <Head title="Garantias" />
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <form onSubmit={(e)=>{e.preventDefault();apply();}} className="flex items-end gap-2">
                        <div className="w-72">
                            <Input placeholder="Buscar por produto, cliente ou venda…" value={q} onChange={(e)=>setQ(e.target.value)} />
                        </div>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-100"
                        >
                            <option value="">Todos</option>
                            <option value="active">Ativas</option>
                            <option value="expired">Vencidas</option>
                            <option value="used">Utilizadas</option>
                        </select>
                        <Button type="submit" variant="secondary">Filtrar</Button>
                    </form>
                    <div className="text-xs text-ink-400">
                        Vencimento próximo: <span className="text-amber-300 font-medium">≤ {nearExpiryDays} dias</span>
                    </div>
                </div>

                <Card>
                    <CardBody className="p-0">
                        <Table>
                            <THead>
                                <TR>
                                    <TH>Produto</TH>
                                    <TH>Cliente</TH>
                                    <TH>Venda</TH>
                                    <TH>Início</TH>
                                    <TH>Vence</TH>
                                    <TH>Status</TH>
                                    <TH className="text-right">Ações</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {warranties.data.map((w) => {
                                    const daysLeft = Math.ceil((new Date(w.ends_at).getTime() - Date.now()) / 86400000);
                                    return (
                                        <TR key={w.id}>
                                            <TD className="font-medium">{w.product?.name}</TD>
                                            <TD>{w.customer?.name ?? <span className="text-ink-500">consumidor</span>}</TD>
                                            <TD>
                                                {w.sale && (
                                                    <Link href={`/sales/${w.sale.id}`} className="font-mono text-brand-300 hover:underline">
                                                        {w.sale.code}
                                                    </Link>
                                                )}
                                            </TD>
                                            <TD>{dateBr(w.starts_at)}</TD>
                                            <TD>
                                                {dateBr(w.ends_at)}
                                                {w.status === 'active' && daysLeft >= 0 && daysLeft <= nearExpiryDays && (
                                                    <Badge tone="warning" className="ml-2">{daysLeft}d</Badge>
                                                )}
                                            </TD>
                                            <TD>
                                                <Badge tone={w.status === 'active' ? 'success' : w.status === 'expired' ? 'default' : 'info'}>
                                                    {warrantyStatusLabel(w.status)}
                                                </Badge>
                                            </TD>
                                            <TD className="text-right">
                                                {w.status === 'active' && (
                                                    <div className="inline-flex gap-1">
                                                        {w.customer && (
                                                            <Button size="sm" variant="ghost" onClick={() => notify(w.id)}>📲 Notificar</Button>
                                                        )}
                                                        <Button size="sm" variant="secondary" onClick={() => markUsed(w.id)}>Marcar usada</Button>
                                                    </div>
                                                )}
                                            </TD>
                                        </TR>
                                    );
                                })}
                                {warranties.data.length === 0 && (
                                    <TR><TD colSpan={7} className="text-center py-10 text-ink-400">Nenhuma garantia encontrada.</TD></TR>
                                )}
                            </TBody>
                        </Table>
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}
