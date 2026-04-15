import { useEffect, useState } from 'react';
import { cn } from '@/lib/format';

interface ToastItem {
    id: number;
    type: 'success' | 'error';
    message: string;
}

let counter = 0;

export default function ToastContainer() {
    const [items, setItems] = useState<ToastItem[]>([]);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail as { type: 'success' | 'error'; message: string };
            const id = ++counter;
            setItems((curr) => [...curr, { id, ...detail }]);
            setTimeout(() => {
                setItems((curr) => curr.filter((i) => i.id !== id));
            }, 4000);
        };
        window.addEventListener('app:flash', handler);
        return () => window.removeEventListener('app:flash', handler);
    }, []);

    return (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[999] flex flex-col gap-2">
            {items.map((it) => (
                <div
                    key={it.id}
                    className={cn(
                        'pointer-events-auto min-w-[260px] rounded-lg border px-4 py-3 text-sm shadow-lg animate-slide-up',
                        it.type === 'success'
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200'
                            : 'border-brand-300 bg-brand-50 text-brand-800 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-brand-200'
                    )}
                >
                    {it.message}
                </div>
            ))}
        </div>
    );
}
