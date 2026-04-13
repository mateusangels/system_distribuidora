import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import { Table, TBody, TD, TH, THead, TR } from '@/Components/ui/Table';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import type { Customer, Paginated } from '@/types';
import { useState } from 'react';

interface Props {
    customers: Paginated<Customer>;
    filters: { q: string };
}

export default function CustomersIndex({ customers, filters }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const apply = () => router.get('/customers', { q }, { preserveState: true, replace: true });
    const remove = (id: number) => {
        if (!confirm('Remover cliente?')) return;
        router.delete(`/customers/${id}`);
    };

    return (
        <AppLayout title="Clientes">
            <Head title="Clientes" />
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                    <form onSubmit={(e)=>{e.preventDefault(); apply();}} className="flex items-end gap-2">
                        <div className="w-72">
                            <Input placeholder="Buscar por nome, doc, telefone…" value={q} onChange={(e)=>setQ(e.target.value)} />
                        </div>
                        <Button type="submit" variant="secondary">Filtrar</Button>
                    </form>
                    <Link href="/customers/create"><Button>+ Novo cliente</Button></Link>
                </div>

                <Card>
                    <CardBody className="p-0">
                        <Table>
                            <THead>
                                <TR>
                                    <TH>Nome</TH>
                                    <TH>Documento</TH>
                                    <TH>Telefone / WhatsApp</TH>
                                    <TH>Email</TH>
                                    <TH className="text-right">Ações</TH>
                                </TR>
                            </THead>
                            <TBody>
                                {customers.data.map((c) => (
                                    <TR key={c.id}>
                                        <TD className="font-medium">{c.name}</TD>
                                        <TD className="text-ink-300">{c.document || '—'}</TD>
                                        <TD className="text-ink-300">{c.whatsapp || c.phone || '—'}</TD>
                                        <TD className="text-ink-300">{c.email || '—'}</TD>
                                        <TD className="text-right">
                                            <div className="inline-flex gap-1">
                                                <Link href={`/customers/${c.id}`}>
                                                    <Button size="sm" variant="ghost">Histórico</Button>
                                                </Link>
                                                <Link href={`/customers/${c.id}/edit`}>
                                                    <Button size="sm" variant="secondary">Editar</Button>
                                                </Link>
                                                <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>×</Button>
                                            </div>
                                        </TD>
                                    </TR>
                                ))}
                                {customers.data.length === 0 && (
                                    <TR><TD colSpan={5} className="text-center py-10 text-ink-400">Nenhum cliente cadastrado.</TD></TR>
                                )}
                            </TBody>
                        </Table>
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}
