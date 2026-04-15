import { ReactNode, useEffect } from 'react';
import { cn } from '@/lib/format';

interface Props {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Dialog({ open, onClose, title, children, size = 'md' }: Props) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/70"
                onClick={onClose}
            />
            <div
                className={cn(
                    'relative w-full rounded-xl border shadow-2xl animate-slide-up',
                    'bg-white border-ink-200',
                    'dark:bg-ink-900 dark:border-ink-700',
                    size === 'sm' && 'max-w-md',
                    size === 'md' && 'max-w-xl',
                    size === 'lg' && 'max-w-3xl',
                    size === 'xl' && 'max-w-5xl'
                )}
            >
                {title && (
                    <div className="border-b border-ink-200 dark:border-ink-800 px-6 py-4">
                        <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-50">
                            {title}
                        </h2>
                    </div>
                )}
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}
