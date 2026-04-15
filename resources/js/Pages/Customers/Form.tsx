import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '@/Components/ui/Card';
import Input from '@/Components/ui/Input';
import Button from '@/Components/ui/Button';
import type { Customer } from '@/types';
import { FormEvent, useEffect } from 'react';

interface Props { customer: Customer | null; }

function onlyDigits(value: string) {
    return value.replace(/\D/g, '');
}

function formatDocument(value: string) {
    const digits = onlyDigits(value).slice(0, 14);
    if (digits.length <= 11) {
        return digits
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function formatPhone(value: string) {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length <= 2) {
        return digits;
    }
    if (digits.length <= 6) {
        return digits.replace(/^(\d{2})(\d+)/, '($1) $2');
    }
    if (digits.length <= 10) {
        return digits.replace(/^(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    }
    return digits.replace(/^(\d{2})(\d{5})(\d{1,4})/, '($1) $2-$3');
}

export default function CustomerForm({ customer }: Props) {
    const isEdit = !!customer;
    const { data, setData, post, put, processing, errors } = useForm({
        name: customer?.name ?? '',
        document: customer?.document ? formatDocument(customer.document) : '',
        phone: customer?.phone ? formatPhone(customer.phone) : '',
        whatsapp: customer?.whatsapp ? formatPhone(customer.whatsapp) : '',
        email: customer?.email ?? '',
        address: customer?.address ?? '',
        notes: customer?.notes ?? '',
    });

    // Inertia reusa o componente entre /customers/{id}/edit e /customers/create.
    // Como useForm só roda uma vez, sincronizamos os dados sempre que a prop mudar.
    useEffect(() => {
        setData({
            name: customer?.name ?? '',
            document: customer?.document ? formatDocument(customer.document) : '',
            phone: customer?.phone ? formatPhone(customer.phone) : '',
            whatsapp: customer?.whatsapp ? formatPhone(customer.whatsapp) : '',
            email: customer?.email ?? '',
            address: customer?.address ?? '',
            notes: customer?.notes ?? '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [customer?.id]);

    const submit = (e: FormEvent) => {
        e.preventDefault();
        isEdit ? put(`/customers/${customer!.id}`) : post('/customers');
    };

    const handleDocumentChange = (value: string) => {
        setData('document', formatDocument(value));
    };

    const handlePhoneChange = (value: string) => {
        setData('phone', formatPhone(value));
    };

    const handleWhatsappChange = (value: string) => {
        setData('whatsapp', formatPhone(value));
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
                        <Input label="CPF / CNPJ" value={data.document ?? ''} onChange={(e)=>handleDocumentChange(e.target.value)} error={errors.document} />
                        <Input label="Email" type="email" value={data.email ?? ''} onChange={(e)=>setData('email',e.target.value)} error={errors.email} />
                        <Input label="Telefone" value={data.phone ?? ''} onChange={(e)=>handlePhoneChange(e.target.value)} error={errors.phone} />
                        <Input label="WhatsApp" value={data.whatsapp ?? ''} onChange={(e)=>handleWhatsappChange(e.target.value)} error={errors.whatsapp} />
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
