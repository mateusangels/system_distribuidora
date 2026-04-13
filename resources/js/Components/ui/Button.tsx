import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/format';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    block?: boolean;
}

const variants: Record<Variant, string> = {
    primary:
        'bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700 disabled:bg-brand-700/50 shadow-sm focus:shadow-glow',
    secondary:
        'bg-ink-800 text-ink-100 hover:bg-ink-700 border border-ink-700 disabled:opacity-50',
    ghost:
        'bg-transparent text-ink-200 hover:bg-ink-800 disabled:opacity-50',
    danger:
        'bg-red-600 text-white hover:bg-red-500 disabled:opacity-50',
    success:
        'bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50',
};

const sizes: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base',
    xl: 'px-6 py-4 text-lg font-semibold',
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
    { variant = 'primary', size = 'md', block, className, ...props },
    ref
) {
    return (
        <button
            ref={ref}
            className={cn(
                'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none disabled:cursor-not-allowed',
                variants[variant],
                sizes[size],
                block && 'w-full',
                className
            )}
            {...props}
        />
    );
});

export default Button;
