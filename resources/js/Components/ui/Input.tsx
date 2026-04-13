import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/format';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
    sizeBig?: boolean;
}

const Input = forwardRef<HTMLInputElement, Props>(function Input(
    { label, error, hint, sizeBig, className, id, ...props },
    ref
) {
    const inputId = id || props.name;
    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={inputId} className="block text-xs font-medium uppercase tracking-wide text-ink-300">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                id={inputId}
                className={cn(
                    'block w-full rounded-md border border-ink-700 bg-ink-900 text-ink-50 placeholder-ink-500',
                    'focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    sizeBig ? 'px-4 py-3 text-lg' : 'px-3 py-2 text-sm',
                    error && 'border-red-500 focus:border-red-500 focus:ring-red-500/40',
                    className
                )}
                {...props}
            />
            {hint && !error && <p className="text-xs text-ink-400">{hint}</p>}
            {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
    );
});

export default Input;
