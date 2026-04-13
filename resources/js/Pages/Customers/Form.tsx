import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/Components/ui/Card';
import Input from '@/Components/ui/Input';
import Button from '@/Components/ui/Button';
import type { Customer } from '@/types';
import { FormEvent } from 'react';

interface Props { customer: Customer | null; }

export default function CustomerForm({ customer }: Props) {
    const isEdit = !!customer;
    const { data, setData, post, put, processing, errors } = useForm({
        name: customer?.name ?? '',
        document: customer?.document ?? '',
        phone: customer?.phone ?? '',
        whatsapp: customer?.whatsapp ?? '',
        email: customer?.email ?? '',
        address: customer?.address ?? '',
        notes: customer?.notes ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        isEdit ? put(`/customers/${customer!.id}`) : post('/customers');
    };

    return (
        <AppLayout title={isEdit ? `Editar: ${customer!.name}` : 'Novo cliente'}>
            <Head title={isEdit ? 'Editar cliente' : 'Novo cliente'} />
            <form onSubmit={submit} className="max-w-3xl mx-auto space-y-4">
                <Card>
                    <CardHeader><CardTitle>Dados do cliente</CardTitle></CardHeader>
                    <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <Input label="Nome *" value={data.name} onChange={(e)=>setData('name',e.target.value)} error={errors.name} required />
                        </div>
                        <Input label="CPF / CNPJ" value={data.document ?? ''} onChange={(e)=>setData('document',e.target.value)} error={errors.document} />
                        <Input label="Email" type="email" value={data.email ?? ''} onChange={(e)=>setData('email',e.target.value)} error={errors.email} />
                        <Input label="Telefone" value={data.phone ?? ''} onChange={(e)=>setData('phone',e.target.value)} error={errors.phone} />
                        <Input label="WhatsApp" value={data.whatsapp ?? ''} onChange={(e)=>setData('whatsapp',e.target.value)} error={errors.whatsapp} />
                        <div className="md:col-span-2">
                            <Input label="Endereço" value={data.address ?? ''} onChange={(e)=>setData('address',e.target.value)} error={errors.address} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-medium uppercase tracking-wide text-ink-300 mb-1.5">Observações</label>
                            <textarea
                                value={data.notes ?? ''}
                                onChange={(e) => setData('notes', e.target.value)}
                                rows={3}
                                className="block w-full rounded-md border border-ink-700 bg-ink-900 px-3 py-2 text-sm text-ink-50"
                            />
                        </div>
                    </CardBody>
                    <CardFooter className="flex justify-end gap-2">
                        <Link href="/customers"><Button type="button" variant="ghost">Cancelar</Button></Link>
                        <Button type="submit" disabled={processing}>{isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}</Button>
                    </CardFooter>
                </Card>
            </form>
        </AppLayout>
    );
}
