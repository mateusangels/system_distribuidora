import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import type { PageProps } from '@/types';

/**
 * Toast simples baseado em alert() — substitua por uma lib real depois.
 * Para MVP, mostramos como banner via state local nas pages que importam.
 * Aqui hookamos o flash global pra logar e disparar evento custom.
 */
export function useFlash() {
    const { props } = usePage<PageProps>();
    const lastSuccess = useRef<string | null>(null);
    const lastError = useRef<string | null>(null);

    useEffect(() => {
        const s = props.flash?.success;
        const e = props.flash?.error;
        if (s && s !== lastSuccess.current) {
            lastSuccess.current = s;
            window.dispatchEvent(new CustomEvent('app:flash', { detail: { type: 'success', message: s } }));
        }
        if (e && e !== lastError.current) {
            lastError.current = e;
            window.dispatchEvent(new CustomEvent('app:flash', { detail: { type: 'error', message: e } }));
        }
    }, [props.flash?.success, props.flash?.error]);
}
