import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardBody, CardHeader, CardTitle } from '@/Components/ui/Card';
import { Table, TBody, TD, TH, THead, TR } from '@/Components/ui/Table';
import Badge from '@/Components/ui/Badge';
import Button from '@/Components/ui/Button';
import Icon from '@/Components/ui/Icon';
import { brl, dateBr, dateTimeBr, num, paymentLabel, saleStatusLabel } from '@/lib/format';
import type { Sale } from '@/types';

interface Props { sale: Sale; }

export default function SaleShow({ sale }: Props) {
    const cancel = () => {
        if (!confirm(`Cancelar venda ${sale.code}? Estoque será devolvido.`)) return;
        router.post(`/sales/${sale.id}/cancel`);
    };

    return (
        <AppLayout title={`Venda ${sale.code}`}>
            <Head title={`Venda ${sale.code}`} />
            <div className="space-y-4 max-w-5xl mx-auto">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <Badge tone={sale.status === 'paid' ? 'success' : sale.status === 'cancelled' ? 'danger' : 'warning'}>
                            {saleStatusLabel(sale.status)}
                        </Badge>
                        <span className="ml-2 text-sm text-ink-500 dark:text-ink-400">{dateTimeBr(sale.paid_at ?? sale.created_at ?? null)}</span>
                    </div>
                    <div className="flex gap-2">
                        <a href={`/sales/${sale.id}/receipt`} target="_blank" rel="noreferrer">
                            <Button variant="secondary">
                                <Icon name="mdi:receipt-text-outline" className="h-4 w-4" />
                                Cupom HTML
                            </Button>
                        </a>
                        <a href={`/sales/${sale.id}/receipt?format=escpos`}>
                            <Button variant="ghost">
                                <Icon name="mdi:download-outline" className="h-4 w-4" />
                                Cupom ESC/POS
                            </Button>
                        </a>
                        {(sale.status === 'paid' || sale.status === 'pending') && (
                            <Button variant="danger" onClick={cancel}>
                                <Icon name="mdi:close-circle-outline" className="h-4 w-4" />
                                Cancelar venda
                            </Button>
                        )}
                    </div>
                </div>

                <Card>
                    <CardHeader><CardTitle>Itens</CardTitle></CardHeader>
                    <CardBody className="p-0">
                        <Table>
                            <THead>
                                <TR>
                                    <TH>Produto</TH>
                                    <TH className="text-center">Qtd</TH>
                                    <TH className="text-right">Unit.</TH>
                                    <TH className="text-right">Total</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {sale.items?.map((it) => (
                                    <TR key={it.id}>
                                        <TD>
                                            <div className="font-medium text-ink-900 dark:text-ink-100">{it.product_name}</div>
                                            <div className="text-xs text-ink-500">{it.product_sku}</div>
                                        </TD>
                                        <TD className="text-center">{it.qty}</TD>
                                        <TD className="text-right font-mono">{brl(it.unit_price)}</TD>
                                        <TD className="text-right font-mono">{brl(it.total)}</TD>
                                    </TR>
                                ))}
                            </TBody>
                        </Table>
                    </CardBody>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
                        <CardBody>
                            {sale.customer ? (
                                <div className="space-y-1 text-sm">
                                    <div className="font-medium text-ink-900 dark:text-ink-100">{sale.customer.name}</div>
                                    <div className="text-ink-500 dark:text-ink-400">{sale.customer.document}</div>
                                    <div className="text-ink-500 dark:text-ink-400">{sale.customer.whatsapp || sale.customer.phone}</div>
                                    <Link href={`/customers/${sale.customer.id}`} className="text-xs text-brand-600 hover:underline dark:text-brand-300">ver perfil</Link>
                                </div>
                            ) : (
                                <span className="text-ink-500 text-sm">Consumidor não identificado</span>
                            )}
                        </CardBody>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Pagamento</CardTitle></CardHeader>
                        <CardBody className="space-y-1 text-sm">
                            <Row label="Subtotal" value={brl(sale.subtotal)} />
                            {parseFloat(sale.discount) > 0 && <Row label="Desconto" value={`- ${brl(sale.discount)}`} />}
                            <Row label="TOTAL" value={brl(sale.total)} bold />
                            <Row label="Método" value={paymentLabel(sale.payment_method)} />
                            {sale.payment_method === 'cash' && sale.amount_received != null && (
                                <>
                                    <Row label="Recebido" value={brl(sale.amount_received)} />
                                    <Row label="Troco" value={brl(sale.change_due ?? 0)} bold />
                                </>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {sale.payment_method === 'fiado' && (
                    <Card className={sale.status === 'pending' ? 'border-amber-300 dark:border-amber-500/40' : undefined}>
                        <CardHeader><CardTitle>Fiado</CardTitle></CardHeader>
                        <CardBody className="space-y-1 text-sm">
                            <Row label="Vencimento" value={dateBr(sale.due_date)} />
                            <Row label="Pago" value={brl(sale.amount_paid)} />
                            <Row
                                label="Saldo devedor"
                                value={brl(Math.max(0, num(sale.total) - num(sale.amount_paid)))}
                                bold
                            />
                            {sale.customer && (
                                <Link href={`/customers/${sale.customer.id}`} className="inline-block pt-1 text-xs text-brand-600 hover:underline dark:text-brand-300">
                                    Registrar recebimento / cobrar →
                                </Link>
                            )}
                        </CardBody>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div className={`flex justify-between ${bold ? 'text-base font-semibold text-ink-900 dark:text-ink-50' : ''}`}>
            <span className="text-ink-500 dark:text-ink-400">{label}</span>
            <span className="font-mono">{value}</span>
        </div>
    );
}
