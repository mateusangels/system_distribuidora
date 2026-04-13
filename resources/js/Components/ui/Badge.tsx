import { HTMLAttributes } from 'react';
import { cn } from '@/lib/format';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

interface Props extends HTMLAttributes<HTMLSpanElement> {
    tone?: Tone;
}

const tones: Record<Tone, string> = {
    default: 'bg-ink-800 text-ink-200 border-ink-700',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    danger:  'bg-red-500/15 text-red-300 border-red-500/30',
    info:    'bg-sky-500/15 text-sky-300 border-sky-500/30',
    brand:   'bg-brand-500/15 text-brand-300 border-brand-500/30',
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
