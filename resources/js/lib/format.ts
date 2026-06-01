export function brl(value: number | string | null | undefined): string {
    const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    if (isNaN(n)) return 'R$ 0,00';
    return n.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });
}

export function num(value: number | string | null | undefined): number {
    if (value === null || value === undefined) return 0;
    return typeof value === 'string' ? parseFloat(value) || 0 : value;
}

export function dateBr(iso: string | null | undefined): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('pt-BR');
}

export function dateTimeBr(iso: string | null | undefined): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function cn(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(' ');
}

export function paymentLabel(method: string): string {
    return ({
        cash: 'Dinheiro',
        pix: 'PIX',
        credit: 'Cartão Crédito',
        debit: 'Cartão Débito',
        fiado: 'Fiado',
        other: 'Outro',
    } as Record<string, string>)[method] ?? method;
}

export function saleStatusLabel(s: string): string {
    return ({
        open: 'Aberta',
        paid: 'Paga',
        pending: 'Fiado em aberto',
        cancelled: 'Cancelada',
    } as Record<string, string>)[s] ?? s;
}
