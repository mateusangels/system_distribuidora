import { Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';
import { cn } from '@/lib/format';
import type { PageProps } from '@/types';
import ToastContainer from '@/Components/ui/Toast';
import Badge from '@/Components/ui/Badge';
import { useFlash } from '@/hooks/use-flash';
import { useShortcut } from '@/hooks/use-shortcut';

interface Props {
    title?: string;
    actions?: ReactNode;
}

const NAV = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/pdv',       label: 'PDV',       icon: '🛒', accent: true, hint: 'F1' },
    { href: '/sales',     label: 'Vendas',    icon: '🧾' },
    { href: '/products',  label: 'Produtos',  icon: '📦' },
    { href: '/customers', label: 'Clientes',  icon: '👤' },
    { href: '/warranties',label: 'Garantias', icon: '🛡️' },
];

export default function AppLayout({ title, actions, children }: PropsWithChildren<Props>) {
    const { props, url } = usePage<PageProps>();
    const user = props.auth?.user;
    const alerts = props.alerts;

    useFlash();
    useShortcut({
        f1: () => router.visit('/pdv'),
        f2: () => router.visit('/customers'),
        f3: () => router.visit('/products'),
        f4: () => router.visit('/sales'),
        'shift+d': () => router.visit('/dashboard'),
    });

    const totalAlerts = (alerts?.low_stock || 0) + (alerts?.warranties_near_expiry || 0);

    return (
        <div className="min-h-screen bg-ink-950 text-ink-100 font-sans antialiased dark">
            <div className="flex h-screen overflow-hidden">
                {/* Sidebar */}
                <aside className="hidden md:flex w-60 flex-col border-r border-ink-800 bg-ink-900/60">
                    <div className="px-5 py-5 border-b border-ink-800">
                        <Link href="/dashboard" className="flex items-center gap-2">
                            <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-600 text-white font-black">DR</span>
                            <div>
                                <div className="text-sm font-bold tracking-wide">{props.store?.name}</div>
                                <div className="text-xs text-ink-400">{props.store?.tagline}</div>
                            </div>
                        </Link>
                    </div>
                    <nav className="flex-1 overflow-y-auto py-3">
                        {NAV.map((item) => {
                            const active = url.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'mx-2 mb-1 flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                                        active
                                            ? 'bg-brand-600/20 text-brand-200 border border-brand-600/40'
                                            : 'text-ink-300 hover:bg-ink-800 hover:text-ink-100',
                                        item.accent && !active && 'text-brand-300'
                                    )}
                                >
                                    <span className="flex items-center gap-3">
                                        <span aria-hidden>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </span>
                                    {item.hint && (
                                        <kbd className="rounded border border-ink-700 bg-ink-950 px-1.5 py-0.5 text-[10px] text-ink-400">
                                            {item.hint}
                                        </kbd>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="border-t border-ink-800 px-4 py-3 text-xs text-ink-400">
                        <div>Operador</div>
                        <div className="text-ink-200 font-medium">{user?.name}</div>
                        <div className="capitalize text-[11px] text-ink-500">{user?.role}</div>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            className="mt-2 w-full rounded border border-ink-700 px-2 py-1 text-left hover:bg-ink-800"
                        >
                            Sair
                        </Link>
                    </div>
                </aside>

                {/* Main */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Topbar */}
                    <header className="flex items-center justify-between border-b border-ink-800 bg-ink-900/40 px-4 py-3">
                        <div className="flex items-center gap-3">
                            <h1 className="text-lg font-semibold">{title}</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            {totalAlerts > 0 && (
                                <Link href="/dashboard" className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200 hover:bg-amber-500/15">
                                    🔔
                                    <span>
                                        {alerts.low_stock > 0 && <Badge tone="danger" className="mr-1">{alerts.low_stock} estoque</Badge>}
                                        {alerts.warranties_near_expiry > 0 && <Badge tone="warning">{alerts.warranties_near_expiry} garantias</Badge>}
                                    </span>
                                </Link>
                            )}
                            {actions}
                            <Link
                                href="/pdv"
                                className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
                            >
                                Abrir PDV (F1)
                            </Link>
                        </div>
                    </header>

                    {/* Content */}
                    <main className="flex-1 overflow-y-auto p-6">{children}</main>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}
