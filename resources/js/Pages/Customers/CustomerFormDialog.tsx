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

// ---------- Máscaras ----------
function onlyDigits(value: string) {
    return value.replace(/\D/g, '');
}

function formatDocument(value: string) {
    const digits = onlyDigits(value).slice(0, 14);
    if (digits.length <= 11) {
        // CPF: 000.000.000-00
        return digits
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    // CNPJ: 00.000.000/0000-00
    return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

function formatPhone(value: string) {
    const digits = onlyDigits(value).slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return digits.replace(/^(\d{2})(\d+)/, '($1) $2');
    if (digits.length <= 10) return digits.replace(/^(\d{2})(\d{4})(\d+)/, '($1) $2-$3');
    // celular: (00) 00000-0000
    return digits.replace(/^(\d{2})(\d{5})(\d{1,4})/, '($1) $2-$3');
}

const EMPTY = {
    name: '',
    document: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    notes: '',
    credit_limit: '' as string,
};

export default function CustomerFormDialog({ open, customer, onClose }: Props) {
    const isEdit = !!customer;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({ ...EMPTY });

    // Sincroniza a cada abertura do modal. A dependência em `open` garante que
    // mesmo reabrindo pra "Novo cliente" em sequência os dados antigos sumam.
    useEffect(() => {
        if (!open) {
            // Ao fechar, limpa totalmente o estado pra não "vazar" dados pra próxima abertura.
            reset();
            clearErrors();
            return;
        }
        clearErrors();
        if (customer) {
            setData({
                name: customer.name ?? '',
                document: customer.document ? formatDocument(customer.document) : '',
                phone: customer.phone ? formatPhone(customer.phone) : '',
                whatsapp: customer.whatsapp ? formatPhone(customer.whatsapp) : '',
                email: customer.email ?? '',
                address: customer.address ?? '',
                notes: customer.notes ?? '',
                credit_limit: customer.credit_limit != null ? String(customer.credit_limit) : '',
            });
        } else {
            setData({ ...EMPTY });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, customer?.id]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                clearErrors();
                onClose();
            },
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
                    <Input
                        label="CPF / CNPJ"
                        value={data.document ?? ''}
                        onChange={(e) => setData('document', formatDocument(e.target.value))}
                        error={errors.document}
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                    />
                    <Input label="Email" type="email" value={data.email ?? ''} onChange={(e) => setData('email', e.target.value)} error={errors.email} />
                    <Input
                        label="Telefone"
                        value={data.phone ?? ''}
                        onChange={(e) => setData('phone', formatPhone(e.target.value))}
                        error={errors.phone}
                        placeholder="(00) 00000-0000"
                        inputMode="tel"
                    />
                    <Input
                        label="WhatsApp"
                        value={data.whatsapp ?? ''}
                        onChange={(e) => setData('whatsapp', formatPhone(e.target.value))}
                        error={errors.whatsapp}
                        placeholder="(00) 00000-0000"
                        inputMode="tel"
                    />
                    <div className="md:col-span-2">
                        <Input label="Endereço" value={data.address ?? ''} onChange={(e) => setData('address', e.target.value)} error={errors.address} />
                    </div>
                    <Input
                        label="Limite de crédito (fiado)"
                        type="number"
                        step="0.01"
                        min={0}
                        value={data.credit_limit ?? ''}
                        onChange={(e) => setData('credit_limit', e.target.value)}
                        error={errors.credit_limit}
                        placeholder="0,00"
                        hint="0 ou vazio = sem limite definido"
                    />
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
