import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Table, TBody, TD, TH, THead, TR } from '@/Components/ui/Table';
import Badge from '@/Components/ui/Badge';
import { brl, dateBr, dateTimeBr, paymentLabel, warrantyStatusLabel } from '@/lib/format';
import type { Customer, Sale, Warranty } from '@/types';

interface Props {
    customer: Customer & { sales: Sale[]; warranties: Warranty[] };
}

export default function CustomerShow({ customer }: Props) {
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
                                            <TD>{dateTimeBr(s.paid_at)}</TD>
                                            <TD>{s.items?.length ?? 0}</TD>
                                            <TD>{paymentLabel(s.payment_method)}</TD>
                                            <TD className="text-right font-mono">{brl(s.total)}</TD>
                                        </TR>
                                    ))}
                                </TBody>
                            </Table>
                        )}
                    </CardBody>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Garantias</CardTitle></CardHeader>
                    <CardBody className="p-0">
                        {customer.warranties.length === 0 ? (
                            <div className="px-5 py-8 text-center text-sm text-ink-500">Nenhuma garantia.</div>
                        ) : (
                            <Table>
                                <THead>
                                    <TR>
                                        <TH>Produto</TH>
                                        <TH>Início</TH>
                                        <TH>Vence</TH>
                                        <TH>Status</TH>
                                    </TR>
                                </THead>
                                <TBody>
                                    {customer.warranties.map((w) => (
                                        <TR key={w.id}>
                                            <TD>{w.product?.name}</TD>
                                            <TD>{dateBr(w.starts_at)}</TD>
                                            <TD>{dateBr(w.ends_at)}</TD>
                                            <TD>
                                                <Badge tone={w.status === 'active' ? 'success' : w.status === 'expired' ? 'default' : 'info'}>
                                                    {warrantyStatusLabel(w.status)}
                                                </Badge>
                                            </TD>
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

function Info({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div>
            <div className="text-xs uppercase tracking-wide text-ink-500 dark:text-ink-400">{label}</div>
            <div className="mt-1 text-ink-900 dark:text-ink-100">{value || <span className="text-ink-400">—</span>}</div>
        </div>
    );
}
