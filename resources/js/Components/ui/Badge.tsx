import { HTMLAttributes } from 'react';
import { cn } from '@/lib/format';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

interface Props extends HTMLAttributes<HTMLSpanElement> {
    tone?: Tone;
}

const tones: Record<Tone, string> = {
    default:
        'bg-ink-100 text-ink-700 border-ink-200 dark:bg-ink-800 dark:text-ink-200 dark:border-ink-700',
    success:
        'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    warning:
        'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
    danger:
        'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
    info:
        'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
    brand:
        'bg-brand-100 text-brand-700 border-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:border-brand-500/30',
};

export default function Badge({ tone = 'default', className, ...props }: Props) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
                tones[tone],
                className
            )}
            {...props}
        />
    );
}
