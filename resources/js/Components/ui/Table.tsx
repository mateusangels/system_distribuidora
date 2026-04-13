import { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { cn } from '@/lib/format';

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
    return (
        <div className="overflow-x-auto">
            <table className={cn('min-w-full text-left text-sm', className)} {...props} />
        </div>
    );
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
    return <thead className="bg-ink-900/80 text-xs uppercase tracking-wide text-ink-400" {...props} />;
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody className="divide-y divide-ink-800" {...props} />;
}

export function TR({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
    return <tr className={cn('hover:bg-ink-900/60', className)} {...props} />;
}

export function TH({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
    return <th className={cn('px-4 py-3 font-medium', className)} {...props} />;
}

export function TD({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn('px-4 py-3 text-ink-200', className)} {...props} />;
}
