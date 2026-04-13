import { useEffect } from 'react';

type ShortcutMap = Record<string, (e: KeyboardEvent) => void>;

/**
 * Registra atalhos de teclado globais.
 * Chave: nome simplificado da tecla (em lowercase).
 *  - F1..F12      -> "f1", "f2", ...
 *  - Escape       -> "esc"
 *  - Enter        -> "enter"
 *  - "+"          -> "plus"
 *  - "-"          -> "minus"
 *  - Modifier+key -> "ctrl+s", "shift+enter" etc
 */
export function useShortcut(map: ShortcutMap, opts?: { enabled?: boolean }) {
    const enabled = opts?.enabled ?? true;

    useEffect(() => {
        if (!enabled) return;
        const handler = (e: KeyboardEvent) => {
            const key = normalizeKey(e);
            const fn = map[key];
            if (fn) {
                e.preventDefault();
                fn(e);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [map, enabled]);
}

function normalizeKey(e: KeyboardEvent): string {
    let k = e.key.toLowerCase();
    if (k === 'escape') k = 'esc';
    if (k === '+') k = 'plus';
    if (k === '-') k = 'minus';
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    parts.push(k);
    return parts.join('+');
}
