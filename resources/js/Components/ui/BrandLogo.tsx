import type { CSSProperties } from 'react';
import { cn } from '@/lib/format';

interface Props {
    className?: string;
    /** Tamanho (lado do quadrado) em px. Default 120. */
    size?: number;
    /** Liga a animação completa (flutuação, brilho, bolhas). Use na tela de login. */
    animated?: boolean;
}

/** Bolhas de "bebida gaseificada" que sobem ao redor da logo. */
const BUBBLES = [
    { left: '16%', size: 0.085, delay: '0s',    rise: 0.95 },
    { left: '30%', size: 0.055, delay: '0.7s',  rise: 1.05 },
    { left: '46%', size: 0.10,  delay: '1.2s',  rise: 0.9 },
    { left: '60%', size: 0.05,  delay: '0.35s', rise: 1.1 },
    { left: '72%', size: 0.07,  delay: '1.6s',  rise: 1.0 },
    { left: '84%', size: 0.05,  delay: '0.95s', rise: 0.95 },
    { left: '24%', size: 0.05,  delay: '2.0s',  rise: 1.0 },
    { left: '54%', size: 0.07,  delay: '2.3s',  rise: 1.05 },
];

/**
 * Emblema da marca — Adega Responsa (public/logo.png).
 * Quando `animated`, ganha flutuação, anel girando, glow pulsante,
 * bolhas subindo e um brilho que passa por cima (gloss sweep).
 */
export default function BrandLogo({ className, size = 120, animated = false }: Props) {
    if (!animated) {
        return (
            <img
                src="/logo.png"
                width={size}
                height={size}
                alt="Adega Responsa"
                className={cn('select-none rounded-full object-contain', className)}
                draggable={false}
            />
        );
    }

    return (
        <div
            className={cn('relative grid place-items-center', className)}
            style={{ width: size, height: size }}
        >
            {/* Halo / glow pulsante */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-teal-400/40 via-emerald-400/30 to-brand-500/30 blur-2xl animate-logo-glow" />

            {/* Anel pontilhado girando lentamente */}
            <svg className="absolute inset-[-6%] animate-spin-slow text-teal-400/50" viewBox="0 0 100 100" fill="none" aria-hidden>
                <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="1" strokeDasharray="3 7" />
            </svg>

            {/* Bolhas subindo */}
            <div className="pointer-events-none absolute inset-0 overflow-visible">
                {BUBBLES.map((b, i) => {
                    const px = Math.max(3, Math.round(size * b.size));
                    const style: CSSProperties = {
                        left: b.left,
                        width: px,
                        height: px,
                        animationDelay: b.delay,
                    };
                    (style as Record<string, string | number>)['--rise'] = `${-Math.round(size * b.rise)}px`;
                    return (
                        <span
                            key={i}
                            className="absolute bottom-1 rounded-full bg-white/75 shadow-[0_0_6px_rgba(255,255,255,0.7)] ring-1 ring-teal-200/60 animate-bubble-rise dark:bg-teal-100/75"
                            style={style}
                        />
                    );
                })}
            </div>

            {/* Logo flutuando */}
            <img
                src="/logo.png"
                width={size}
                height={size}
                alt="Adega Responsa"
                draggable={false}
                className="relative z-10 select-none rounded-full object-contain animate-logo-bob drop-shadow-[0_10px_22px_rgba(13,148,136,0.4)]"
            />

            {/* Brilho passando por cima (clipado no círculo) */}
            <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-full">
                <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/65 to-transparent animate-logo-shine" />
            </div>
        </div>
    );
}
