import { Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/format';
import type { PageProps } from '@/types';
import ToastContainer from '@/Components/ui/Toast';
import Badge from '@/Components/ui/Badge';
import Icon from '@/Components/ui/Icon';
import MotorcycleLogo from '@/Components/ui/MotorcycleLogo';
import { useFlash } from '@/hooks/use-flash';
import { useShortcut } from '@/hooks/use-shortcut';
import { useTheme } from '@/hooks/use-theme';

interface Props {
    title?: string;
    actions?: ReactNode;
}

const NAV = [
    { href: '/dashboard', label: 'Dashboard', icon: 'mdi:view-dashboard-outline' },
    { href: '/pdv',       label: 'PDV',       icon: 'mdi:cart-outline', accent: true, hint: 'F1' },
    { href: '/sales',     label: 'Vendas',    icon: 'mdi:receipt-text-outline' },
    { href: '/products',  label: 'Produtos',  icon: 'mdi:package-variant-closed' },
    { href: '/customers', label: 'Clientes',  icon: 'mdi:account-outline' },
    { href: '/warranties',label: 'Garantias', icon: 'mdi:shield-check-outline' },
];

export default function AppLayout({ title, actions, children }: PropsWithChildren<Props>) {
    const { props, url } = usePage<PageProps>();
    const user = props.auth?.user;
    const alerts = props.alerts;
    const { theme, toggle } = useTheme();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useFlash();

    const onPdv = url.startsWith('/pdv');
    useShortcut({
        f1: () => router.visit('/pdv'),
        ...(onPdv ? {} : {
            f2: () => router.visit('/customers'),
            f3: () => router.visit('/products'),
            f4: () => router.visit('/sales'),
        }),
        'shift+d': () => router.visit('/dashboard'),
    });

    // Fecha sidebar ao mudar de página no mobile
    useEffect(() => { setSidebarOpen(false); }, [url]);

    const totalAlerts = (alerts?.low_stock || 0) + (alerts?.warranties_near_expiry || 0);

    const sidebarContent = (
        <>
            <div className="px-4 py-4 border-b border-ink-200 dark:border-ink-800 flex items-center justify-between">
                <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
                    <MotorcycleLogo size={40} animated={false} />
                    <div className="min-w-0">
                        <div className="text-sm font-bold tracking-wide truncate">{props.store?.name}</div>
                        <div className="text-xs text-ink-500 dark:text-ink-400 truncate">{props.store?.tagline}</div>
                    </div>
                </Link>
                <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden -mr-1 p-1 text-ink-500 hover:text-ink-900 dark:hover:text-ink-100"
                    aria-label="Fechar menu"
                >
                    <Icon name="mdi:close" className="h-5 w-5" />
                </button>
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
                                    ? 'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-600/20 dark:text-brand-200 dark:border-brand-600/40'
                                    : 'text-ink-700 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-100',
                                item.accent && !active && 'text-brand-600 dark:text-brand-300'
                            )}
                        >
                            <span className="flex items-center gap-3">
                                <Icon name={item.icon} className="h-5 w-5" aria-hidden />
                                <span>{item.label}</span>
                            </span>
                            {item.hint && (
                                <kbd className="rounded border border-ink-300 bg-ink-50 px-1.5 py-0.5 text-[10px] text-ink-500 dark:border-ink-700 dark:bg-ink-950 dark:text-ink-400">
                                    {item.hint}
                                </kbd>
                            )}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-ink-200 px-4 py-3 text-xs dark:border-ink-800">
                <Link
                    href="/profile"
                    className="flex items-center gap-3 rounded-md p-2 hover:bg-ink-100 dark:hover:bg-ink-800"
                >
                    {user?.avatar_url ? (
                        <img
                            src={user.avatar_url}
                            alt={user.name}
                            className="h-9 w-9 rounded-full object-cover border border-ink-200 dark:border-ink-700"
                        />
                    ) : (
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-white font-bold">
                            {user?.name?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <div className="text-ink-900 dark:text-ink-100 font-medium text-sm truncate">{user?.name}</div>
                        <div className="capitalize text-[11px] text-ink-500">{user?.role}</div>
                    </div>
                    <Icon name="mdi:chevron-right" className="h-4 w-4 text-ink-400" />
                </Link>
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded border border-ink-300 px-2 py-1.5 text-ink-700 hover:bg-ink-100 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
                >
                    <Icon name="mdi:logout" className="h-4 w-4" />
                    Sair
                </Link>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-ink-50 text-ink-900 font-sans antialiased dark:bg-ink-950 dark:text-ink-100">
            <div className="flex h-screen overflow-hidden">
                {/* Sidebar desktop (fixa a partir de md) */}
                <aside className="hidden md:flex w-60 flex-col border-r border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900/60">
                    {sidebarContent}
                </aside>

                {/* Sidebar mobile (drawer) */}
                {sidebarOpen && (
                    <>
                        <div
                            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <aside className="md:hidden fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-ink-200 bg-white shadow-2xl animate-slide-up dark:border-ink-800 dark:bg-ink-900">
                            {sidebarContent}
                        </aside>
                    </>
                )}

                {/* Main */}
                <div className="flex flex-1 flex-col overflow-hidden">
                    {/* Topbar */}
                    <header className="flex items-center justify-between gap-2 border-b border-ink-200 bg-white/70 px-3 py-3 dark:border-ink-800 dark:bg-ink-900/40 md:px-4">
                        <div className="flex items-center gap-2 min-w-0">
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(true)}
                                className="md:hidden p-1 -ml-1 text-ink-700 dark:text-ink-200"
                                aria-label="Abrir menu"
                            >
                                <Icon name="mdi:menu" className="h-6 w-6" />
                            </button>
                            <h1 className="text-base md:text-lg font-semibold truncate">{title}</h1>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {totalAlerts > 0 && (
                                <Link
                                    href="/dashboard"
                                    className="hidden sm:flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs text-amber-800 hover:bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/15"
                                >
                                    <Icon name="mdi:bell-outline" className="h-4 w-4" />
                                    <span>
                                        {alerts.low_stock > 0 && <Badge tone="danger" className="mr-1">{alerts.low_stock} estoque</Badge>}
                                        {alerts.warranties_near_expiry > 0 && <Badge tone="warning">{alerts.warranties_near_expiry} garantias</Badge>}
                                    </span>
                                </Link>
                            )}
                            {actions}

                            <button
                                type="button"
                                onClick={toggle}
                                title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
                                aria-label="Alternar tema"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 bg-white text-ink-700 hover:bg-ink-100 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
                            >
                                <Icon name={theme === 'dark' ? 'mdi:weather-sunny' : 'mdi:weather-night'} className="h-5 w-5" />
                            </button>

                            <Link
                                href="/pdv"
                                className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-3 md:px-4 py-2 text-sm font-semibold text-white hover:bg-brand-500"
                            >
                                <Icon name="mdi:cart-outline" className="h-4 w-4" />
                                <span className="hidden sm:inline">Abrir PDV</span>
                                <kbd className="hidden md:inline rounded border border-white/30 bg-black/20 px-1.5 py-0.5 text-[10px]">F1</kbd>
                            </Link>
                        </div>
                    </header>

                    {/* Content */}
                    <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
                </div>
            </div>
            <ToastContainer />
        </div>
    );
}
