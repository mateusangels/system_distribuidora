import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Table, TBody, TD, TH, THead, TR } from '@/Components/ui/Table';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Dialog from '@/Components/ui/Dialog';
import Input from '@/Components/ui/Input';
import Select from '@/Components/ui/Select';
import Icon from '@/Components/ui/Icon';
import { brl, dateBr, dateTimeBr, num, paymentLabel } from '@/lib/format';
import type { Customer, Payment, Sale } from '@/types';

interface PendingSale {
    id: number;
    code: string;
    total: number;
    amount_paid: number;
    remaining: number;
    due_date: string | null;
    overdue: boolean;
    created_at: string | null;
}

interface FiadoData {
    outstanding: number;
    available_credit: number | null;
    pending_sales: PendingSale[];
    whatsapp: { phone: string | null; text: string; url: string | null; has_phone: boolean };
}

interface Props {
    customer: Customer & { sales: Sale[]; payments: Payment[] };
    fiado: FiadoData;
}

export default function CustomerShow({ customer, fiado }: Props) {
    const [payOpen, setPayOpen] = useState(false);
    const hasDebt = fiado.outstanding > 0;

    return (
        <AppLayout title={customer.name}>
            <Head title={customer.name} />
            <div className="space-y-4 max-w-5xl mx-auto">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{customer.name}</CardTitle>
                            <Link href="/customers" className="text-xs text-brand-600 hover:underline dark:text-brand-300">Voltar à lista</Link>
                        </div>
                    </CardHeader>
                    <CardBody className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <Info label="Documento" value={customer.document} />
                        <Info label="Telefone" value={customer.phone} />
                        <Info label="WhatsApp" value={customer.whatsapp} />
                        <Info label="Email" value={customer.email} />
                        <Info label="Limite de crédito" value={num(customer.credit_limit) > 0 ? brl(customer.credit_limit) : 'sem limite'} />
                        <div className="col-span-full">
                            <Info label="Endereço" value={customer.address} />
                        </div>
                        {customer.notes && (
                            <div className="col-span-full">
                                <Info label="Observações" value={customer.notes} />
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* ---- Fiado ---- */}
                <Card className={hasDebt ? 'border-amber-300 dark:border-amber-500/40' : undefined}>
                    <CardHeader><CardTitle>Fiado / saldo devedor</CardTitle></CardHeader>
                    <CardBody className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Metric
                                label="Saldo devedor"
                                value={brl(fiado.outstanding)}
                                tone={hasDebt ? 'danger' : 'ok'}
                            />
                            <Metric
                                label="Crédito disponível"
                                value={fiado.available_credit !== null ? brl(fiado.available_credit) : '—'}
                                tone="default"
                            />
                            <Metric
                                label="Vendas em aberto"
                                value={String(fiado.pending_sales.length)}
                                tone="default"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button onClick={() => setPayOpen(true)} disabled={!hasDebt}>
                                <Icon name="mdi:cash-plus" className="h-4 w-4" />
                                Registrar recebimento
                            </Button>
                            {fiado.whatsapp.has_phone ? (
                                <a href={fiado.whatsapp.url!} target="_blank" rel="noreferrer">
                                    <Button variant="secondary" disabled={!hasDebt}>
                                        <Icon name="mdi:whatsapp" className="h-4 w-4" />
                                        Cobrar via WhatsApp
                                    </Button>
                                </a>
                            ) : (
                                <Button variant="secondary" disabled title="Cliente sem telefone/WhatsApp cadastrado">
                                    <Icon name="mdi:whatsapp" className="h-4 w-4" />
                                    Sem WhatsApp
                                </Button>
                            )}
                        </div>

                        {fiado.pending_sales.length > 0 && (
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Venda</TH>
                                        <TH>Origem</TH>
                                        <TH>Vencimento</TH>
                                        <TH className="text-right">Total</TH>
                                        <TH className="text-right">Pago</TH>
                                        <TH className="text-right">Resta</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {fiado.pending_sales.map((s) => (
                                        <TR key={s.id}>
                                            <TD>
                                                <Link href={`/sales/${s.id}`} className="font-mono text-brand-600 hover:underline dark:text-brand-300">{s.code}</Link>
                                            </TD>
                                            <TD>{dateBr(s.created_at)}</TD>
                                            <TD>
                                                <span className={s.overdue ? 'text-red-600 dark:text-red-300 font-medium' : ''}>
                                                    {dateBr(s.due_date)}
                                                </span>
                                                {s.overdue && <Badge tone="danger" className="ml-2">vencido</Badge>}
                                            </TD>
                                            <TD className="text-right font-mono">{brl(s.total)}</TD>
                                            <TD className="text-right font-mono text-ink-500">{brl(s.amount_paid)}</TD>
                                            <TD className="text-right font-mono font-semibold">{brl(s.remaining)}</TD>
                                        </TR>
                                    ))}
                                </TBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>

                {/* ---- Recebimentos ---- */}
                {customer.payments.length > 0 && (
                    <Card>
                        <CardHeader><CardTitle>Recebimentos</CardTitle></CardHeader>
                        <CardBody className="p-0">
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Recibo</TH>
                                        <TH>Data</TH>
                                        <TH>Forma</TH>
                                        <TH>Operador</TH>
                                        <TH className="text-right">Valor</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {customer.payments.map((p) => (
                                        <TR key={p.id}>
                                            <TD className="font-mono">{p.code}</TD>
                                            <TD>{dateTimeBr(p.paid_at)}</TD>
                                            <TD>{paymentLabel(p.method)}</TD>
                                            <TD>{p.user?.name ?? '—'}</TD>
                                            <TD className="text-right font-mono text-emerald-600 dark:text-emerald-300">{brl(p.amount)}</TD>
                                        </TR>
                                    ))}
                                </TBody>
                            </Table>
                        </CardBody>
                    </Card>
                )}

                {/* ---- Histórico de compras ---- */}
                <Card>
                    <CardHeader><CardTitle>Histórico de compras</CardTitle></CardHeader>
                    <CardBody className="p-0">
                        {customer.sales.length === 0 ? (
                            <div className="px-5 py-8 text-center text-sm text-ink-500">Nenhuma compra registrada.</div>
                        ) : (
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Código</TH>
                                        <TH>Data</TH>
                                        <TH>Itens</TH>
                                        <TH>Pagamento</TH>
                                        <TH className="text-right">Total</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {customer.sales.map((s) => (
                                        <TR key={s.id}>
                                            <TD>
                                                <Link href={`/sales/${s.id}`} className="font-mono text-brand-600 hover:underline dark:text-brand-300">{s.code}</Link>
                                            </TD>
                                            <TD>{dateTimeBr(s.paid_at ?? s.created_at)}</TD>
                                            <TD>{s.items?.length ?? 0}</TD>
                                            <TD>
                                                {paymentLabel(s.payment_method)}
                                                {s.status === 'pending' && <Badge tone="warning" className="ml-2">em aberto</Badge>}
                                            </TD>
                                            <TD className="text-right font-mono">{brl(s.total)}</TD>
                                        </TR>
                                    ))}
                                </TBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </div>

            <ReceivePaymentDialog
                open={payOpen}
                onClose={() => setPayOpen(false)}
                customer={customer}
                outstanding={fiado.outstanding}
            />
        </AppLayout>
    );
}

function ReceivePaymentDialog({
    open, onClose, customer, outstanding,
}: {
    open: boolean;
    onClose: () => void;
    customer: Customer;
    outstanding: number;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: outstanding.toFixed(2),
        method: 'cash',
        notes: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/customers/${customer.id}/payments`, {
            preserveScroll: true,
            onSuccess: () => { reset(); onClose(); },
        });
    };

    return (
        <Dialog open={open} onClose={onClose} title="Registrar recebimento" size="md">
            <form onSubmit={submit} className="space-y-4">
                <div className="rounded-lg border border-ink-200 bg-ink-50/60 p-3 text-sm dark:border-ink-800 dark:bg-ink-950/50">
                    <div className="flex items-center justify-between">
                        <span className="text-ink-600 dark:text-ink-300">Saldo devedor</span>
                        <span className="font-mono font-semibold">{brl(outstanding)}</span>
                    </div>
                </div>

                <Input
                    label="Valor recebido (R$)"
                    type="number"
                    step="0.01"
                    min={0.01}
                    max={outstanding}
                    value={data.amount}
                    onChange={(e) => setData('amount', e.target.value)}
                    error={errors.amount}
                    sizeBig
                    autoFocus
                />

                <Select
                    label="Forma de recebimento"
                    value={data.method}
                    onChange={(e) => setData('method', e.target.value)}
                >
                    <option value="cash">Dinheiro</option>
                    <option value="pix">PIX</option>
                    <option value="credit">Cartão Crédito</option>
                    <option value="debit">Cartão Débito</option>
                    <option value="other">Outro</option>
                </Select>

                <Input
                    label="Observações (opcional)"
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                />

                <div className="flex justify-end gap-2 pt-2 border-t border-ink-200 dark:border-ink-800">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={processing}>Cancelar</Button>
                    <Button type="submit" disabled={processing}>
                        <Icon name="mdi:check" className="h-4 w-4" />
                        Confirmar recebimento
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'ok' | 'danger' | 'default' }) {
    const color = tone === 'danger'
        ? 'text-red-600 dark:text-red-300'
        : tone === 'ok'
            ? 'text-emerald-600 dark:text-emerald-300'
            : 'text-ink-900 dark:text-ink-50';
    return (
        <div className="rounded-lg border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900/40">
            <div className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">{label}</div>
            <div className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{value}</div>
        </div>
    );
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <div className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">{label}</div>
            <div className="mt-1 text-ink-900 dark:text-ink-100">{value || <span className="text-ink-400">—</span>}</div>
        </div>
    );
}
