import { useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'moto-pecas-theme';

function getInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    return 'light';
}

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    root.style.colorScheme = theme;
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme);

    useEffect(() => {
        applyTheme(theme);
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch {
            /* ignore storage errors */
        }
    }, [theme]);

    const setTheme = useCallback((next: Theme) => setThemeState(next), []);
    const toggle = useCallback(() => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')), []);

    return { theme, setTheme, toggle };
}

/** Aplica o tema o mais cedo possível, antes do React hidratar, pra evitar flash. */
export function bootstrapTheme() {
    if (typeof window === 'undefined') return;
    applyTheme(getInitialTheme());
}
