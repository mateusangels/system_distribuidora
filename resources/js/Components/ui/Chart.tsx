import { brl } from '@/lib/format';

export const CHART_COLORS = {
    brand: '#ed1212',
    brandLight: '#ff5d5d',
    brandDark: '#a40d0d',
    ink: '#637392',
    inkLight: '#afb9c9',
    amber: '#f59e0b',
    emerald: '#10b981',
    sky: '#0ea5e9',
    violet: '#8b5cf6',
    rose: '#f43f5e',
} as const;

export const CATEGORY_PALETTE = [
    CHART_COLORS.brand,
    CHART_COLORS.sky,
    CHART_COLORS.emerald,
    CHART_COLORS.amber,
    CHART_COLORS.violet,
    CHART_COLORS.rose,
    CHART_COLORS.brandLight,
    CHART_COLORS.ink,
];

type TooltipItem = {
    name?: string;
    value?: number;
    color?: string;
    dataKey?: string;
    payload?: Record<string, unknown>;
};

type ChartTooltipProps = {
    active?: boolean;
    payload?: TooltipItem[];
    label?: string;
    formatter?: (value: number, name?: string) => string;
    labelFormatter?: (label: string) => string;
};

export function ChartTooltip({ active, payload, label, formatter, labelFormatter }: ChartTooltipProps) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const fmt = formatter ?? ((v) => brl(v));

    return (
        <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-ink-700 dark:bg-ink-900">
            {label && (
                <div className="mb-1.5 font-medium text-ink-900 dark:text-ink-100">
                    {labelFormatter ? labelFormatter(label) : label}
                </div>
            )}
            <div className="space-y-1">
                {payload.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span
                            className="inline-block h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: item.color }}
                        />
                        <span className="text-ink-500 dark:text-ink-400">{item.name}:</span>
                        <span className="font-mono font-semibold text-ink-900 dark:text-ink-100">
                            {item.value !== undefined ? fmt(item.value, item.name) : '—'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

type PieTooltipItem = {
    name?: string;
    value?: number;
    payload?: { name?: string; revenue?: number; qty?: number; percent?: number };
};

export function PieTooltip({ active, payload }: { active?: boolean; payload?: PieTooltipItem[] }) {
    if (!active || !payload || payload.length === 0) return null;
    const item = payload[0];
    const data = item.payload;
    const qty = data?.qty ?? 0;
    const revenue = data?.revenue ?? item.value ?? 0;

    return (
        <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-ink-700 dark:bg-ink-900">
            <div className="mb-1 font-medium text-ink-900 dark:text-ink-100">{data?.name ?? item.name}</div>
            <div className="flex items-center justify-between gap-4">
                <span className="text-ink-500 dark:text-ink-400">Receita:</span>
                <span className="font-mono font-semibold text-ink-900 dark:text-ink-100">{brl(revenue)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
                <span className="text-ink-500 dark:text-ink-400">Qtd:</span>
                <span className="font-mono font-semibold text-ink-900 dark:text-ink-100">{qty}</span>
            </div>
        </div>
    );
}
