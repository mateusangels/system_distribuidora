import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import { Table, TBody, TD, TH, THead, TR } from '@/Components/ui/Table';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Select from '@/Components/ui/Select';
import Icon from '@/Components/ui/Icon';
import { brl, dateTimeBr, paymentLabel, saleStatusLabel } from '@/lib/format';
import type { Paginated, Sale, Customer, User } from '@/types';
import { useState } from 'react';

interface Props {
    sales: Paginated<Sale & { customer?: Customer | null; user?: User }>;
    filters: { q: string; status: string | null };
}

export default function SalesIndex({ sales, filters }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const apply = () => router.get('/sales', { q, status: status || undefined }, { preserveState: true, replace: true });

    return (
        <AppLayout title="Vendas">
            <Head title="Vendas" />
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <form onSubmit={(e)=>{e.preventDefault();apply();}} className="flex items-end gap-2">
                        <div className="w-72">
                            <Input placeholder="Buscar por código ou cliente…" value={q} onChange={(e)=>setQ(e.target.value)} />
                        </div>
                        <Select value={status} onChange={(e) => setStatus(e.target.value)} title="Status">
                            <option value="">Todos status</option>
                            <option value="paid">Pagas</option>
                            <option value="pending">Fiado em aberto</option>
                            <option value="cancelled">Canceladas</option>
                        </Select>
                        <Button type="submit" variant="secondary">Filtrar</Button>
                    </form>
                    <Link href="/pdv"><Button>Nova venda (PDV)</Button></Link>
                </div>

                <Card>
                    <CardBody className="p-0">
                        <Table>
                            <THead>
                                <TR>
                                    <TH>Código</TH>
                                    <TH>Data</TH>
                                    <TH>Cliente</TH>
                                    <TH>Caixa</TH>
                                    <TH>Pagamento</TH>
                                    <TH>Status</TH>
                                    <TH className="text-right">Total</TH>
                                    <TH className="text-center w-20">Cupom</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {sales.data.map((s) => (
                                    <TR key={s.id}>
                                        <TD>
                                            <Link href={`/sales/${s.id}`} className="font-mono text-brand-600 hover:underline dark:text-brand-300">{s.code}</Link>
                                        </TD>
                                        <TD>{dateTimeBr(s.paid_at ?? s.created_at ?? null)}</TD>
                                        <TD>{s.customer?.name ?? <span className="text-ink-400">consumidor</span>}</TD>
                                        <TD>{s.user?.name}</TD>
                                        <TD>{paymentLabel(s.payment_method)}</TD>
                                        <TD>
                                            <Badge tone={s.status === 'paid' ? 'success' : s.status === 'cancelled' ? 'danger' : 'warning'}>
                                                {saleStatusLabel(s.status)}
                                            </Badge>
                                        </TD>
                                        <TD className="text-right font-mono">{brl(s.total)}</TD>
                                        <TD className="text-center">
                                            <a
                                                href={`/sales/${s.id}/receipt?print=1`}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="Reimprimir cupom"
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-600 hover:bg-ink-100 hover:text-brand-600 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-brand-300"
                                            >
                                                <Icon name="mdi:printer-outline" className="h-5 w-5" />
                                            </a>
                                        </TD>
                                    </TR>
                                ))}
                                {sales.data.length === 0 && (
                                    <TR><TD colSpan={8} className="text-center py-10 text-ink-500">Nenhuma venda registrada.</TD></TR>
                                )}
                            </TBody>
                        </Table>
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}
