import { useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import Dialog from '@/Components/ui/Dialog';
import Input from '@/Components/ui/Input';
import Button from '@/Components/ui/Button';
import Icon from '@/Components/ui/Icon';
import type { Customer } from '@/types';

interface Props {
    open: boolean;
    customer: Customer | null;
    onClose: () => void;
}

export default function CustomerFormDialog({ open, customer, onClose }: Props) {
    const isEdit = !!customer;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        document: '',
        phone: '',
        whatsapp: '',
        email: '',
        address: '',
        notes: '',
    });

    useEffect(() => {
        if (!open) return;
        clearErrors();
        if (customer) {
            setData({
                name: customer.name ?? '',
                document: customer.document ?? '',
                phone: customer.phone ?? '',
                whatsapp: customer.whatsapp ?? '',
                email: customer.email ?? '',
                address: customer.address ?? '',
                notes: customer.notes ?? '',
            });
        } else {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, customer?.id]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => onClose(),
        };
        if (isEdit) put(`/customers/${customer!.id}`, options);
        else post('/customers', options);
    };

    return (
        <Dialog open={open} onClose={onClose} title={isEdit ? `Editar: ${customer!.name}` : 'Novo cliente'} size="lg">
            <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                        <Input label="Nome *" value={data.name} onChange={(e) => setData('name', e.target.value)} error={errors.name} required autoFocus />
                    </div>
                    <Input label="CPF / CNPJ" value={data.document ?? ''} onChange={(e) => setData('document', e.target.value)} error={errors.document} />
                    <Input label="Email" type="email" value={data.email ?? ''} onChange={(e) => setData('email', e.target.value)} error={errors.email} />
                    <Input label="Telefone" value={data.phone ?? ''} onChange={(e) => setData('phone', e.target.value)} error={errors.phone} />
                    <Input label="WhatsApp" value={data.whatsapp ?? ''} onChange={(e) => setData('whatsapp', e.target.value)} error={errors.whatsapp} />
                    <div className="md:col-span-2">
                        <Input label="Endereço" value={data.address ?? ''} onChange={(e) => setData('address', e.target.value)} error={errors.address} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-600 dark:text-ink-300">Observações</label>
                        <textarea
                            value={data.notes ?? ''}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={3}
                            className="block w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-50"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-ink-200 dark:border-ink-800">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                    <Button type="submit" disabled={processing}>
                        <Icon name={isEdit ? 'mdi:content-save-outline' : 'mdi:plus'} className="h-4 w-4" />
                        {isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}
