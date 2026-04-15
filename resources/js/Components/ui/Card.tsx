import { HTMLAttributes } from 'react';
import { cn } from '@/lib/format';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'rounded-xl border bg-white border-ink-200 shadow-sm',
                'dark:bg-ink-900/60 dark:border-ink-800 dark:backdrop-blur',
                className
            )}
            {...props}
        />
    );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('border-b border-ink-200 dark:border-ink-800 px-5 py-4', className)}
            {...props}
        />
    );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={cn('text-base font-semibold text-ink-900 dark:text-ink-100', className)}
            {...props}
        />
    );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('px-5 py-4', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'border-t border-ink-200 bg-ink-50/60 px-5 py-3',
                'dark:border-ink-800 dark:bg-ink-950/50',
                className
            )}
            {...props}
        />
    );
}
