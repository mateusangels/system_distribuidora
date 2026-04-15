import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/format';
import Icon from './Icon';

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    hint?: string;
}

/**
 * Select estilizado com seta customizada (evita o bug da seta nativa
 * sobrepondo o texto em alguns browsers/temas).
 */
const Select = forwardRef<HTMLSelectElement, Props>(function Select(
    { label, error, hint, className, id, children, ...props },
    ref
) {
    const selectId = id || props.name;
    return (
        <div className="space-y-1.5">
            {label && (
                <label
                    htmlFor={selectId}
                    className="block text-xs font-medium uppercase tracking-wide text-ink-600 dark:text-ink-300"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    ref={ref}
                    id={selectId}
                    className={cn(
                        // appearance-none tira a seta nativa (que sobrepõe texto em vários browsers)
                        'block w-full appearance-none rounded-md border bg-white text-ink-900 border-ink-300',
                        'dark:bg-ink-900 dark:text-ink-50 dark:border-ink-700',
                        'focus:border-brand-500 focus:ring-1 focus:ring-brand-500/40 focus:outline-none',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        'px-3 py-2 pr-9 text-sm',
                        error && 'border-red-500 focus:border-red-500 focus:ring-red-500/40',
                        className
                    )}
                    {...props}
                >
                    {children}
                </select>
                {/* Seta customizada — absoluta, não interfere no texto */}
                <Icon
                    name="mdi:chevron-down"
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-500 dark:text-ink-400"
                />
            </div>
            {hint && !error && <p className="text-xs text-ink-500 dark:text-ink-400">{hint}</p>}
            {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
});

export default Select;
