import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardBody } from '@/Components/ui/Card';
import { Table, TBody, TD, TH, THead, TR } from '@/Components/ui/Table';
import Button from '@/Components/ui/Button';
import Input from '@/Components/ui/Input';
import Icon from '@/Components/ui/Icon';
import CustomerFormDialog from './CustomerFormDialog';
import type { Customer, Paginated } from '@/types';
import { useEffect, useState } from 'react';

interface Props {
    customers: Paginated<Customer>;
    filters: { q: string };
}

export default function CustomersIndex({ customers, filters }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const [editing, setEditing] = useState<Customer | null | 'new'>(null);

    // Abre o modal automaticamente quando vem de /customers/create ou /customers/{id}/edit
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('new')) {
            setEditing('new');
            params.delete('new');
            const q = params.toString();
            window.history.replaceState({}, '', window.location.pathname + (q ? `?${q}` : ''));
        } else if (params.get('edit')) {
            const id = parseInt(params.get('edit') || '0');
            const c = customers.data.find((x) => x.id === id);
            if (c) setEditing(c);
            params.delete('edit');
            const q = params.toString();
            window.history.replaceState({}, '', window.location.pathname + (q ? `?${q}` : ''));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                    <form onSubmit={(e) => { e.preventDefault(); apply(); }} className="flex items-end gap-2">
                        <div className="w-72">
                            <Input placeholder="Buscar por nome, doc, telefone…" value={q} onChange={(e) => setQ(e.target.value)} />
                        </div>
                        <Button type="submit" variant="secondary">
                            <Icon name="mdi:filter-outline" className="h-4 w-4" />
                            Filtrar
                        </Button>
                    </form>
                    <Button onClick={() => setEditing('new')}>
                        <Icon name="mdi:account-plus-outline" className="h-4 w-4" />
                        Novo cliente
                    </Button>
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
                                        <TD className="text-ink-600 dark:text-ink-300">{c.document || '—'}</TD>
                                        <TD className="text-ink-600 dark:text-ink-300">{c.whatsapp || c.phone || '—'}</TD>
                                        <TD className="text-ink-600 dark:text-ink-300">{c.email || '—'}</TD>
                                        <TD className="text-right">
                                            <div className="inline-flex gap-1">
                                                <Link href={`/customers/${c.id}`}>
                                                    <Button size="sm" variant="ghost">
                                                        <Icon name="mdi:history" className="h-4 w-4" />
                                                        Histórico
                                                    </Button>
                                                </Link>
                                                <Button size="sm" variant="secondary" onClick={() => setEditing(c)}>
                                                    <Icon name="mdi:pencil-outline" className="h-4 w-4" />
                                                    Editar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => remove(c.id)}
                                                    title="Remover"
                                                    className="!text-red-600 hover:!bg-red-50 dark:!text-red-400 dark:hover:!bg-red-500/10"
                                                >
                                                    <Icon name="mdi:trash-can-outline" className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TD>
                                    </TR>
                                ))}
                                {customers.data.length === 0 && (
                                    <TR><TD colSpan={5} className="text-center py-10 text-ink-500">Nenhum cliente cadastrado.</TD></TR>
                                )}
                            </TBody>
                        </Table>
                    </CardBody>
                </Card>
            </div>

            <CustomerFormDialog
                open={editing !== null}
                customer={editing === 'new' ? null : editing}
                onClose={() => setEditing(null)}
            />
        </AppLayout>
    );
}
