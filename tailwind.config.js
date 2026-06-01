import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'Figtree', ...defaultTheme.fontFamily.sans],
                mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
            },
            colors: {
                brand: {
                    50:  '#fff1f1',
                    100: '#ffe0e0',
                    200: '#ffc6c6',
                    300: '#ff9a9a',
                    400: '#ff5d5d',
                    500: '#ff2a2a',
                    600: '#ed1212',
                    700: '#c80b0b',
                    800: '#a40d0d',
                    900: '#881212',
                    950: '#4a0303',
                },
                ink: {
                    50:  '#f6f7f9',
                    100: '#eceef2',
                    200: '#d5dae3',
                    300: '#afb9c9',
                    400: '#8392ab',
                    500: '#637392',
                    600: '#4d5b78',
                    700: '#404a62',
                    800: '#363f53',
                    900: '#1f2330',
                    950: '#11141c',
                },
            },
            boxShadow: {
                glow: '0 0 0 4px rgba(237, 18, 18, 0.18)',
            },
            keyframes: {
                'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
                'slide-up': {
                    '0%': { transform: 'translateY(8px)', opacity: 0 },
                    '100%': { transform: 'translateY(0)', opacity: 1 },
                },
                // ---- Logo animada (Adega Responsa) ----
                'logo-bob': {
                    '0%, 100%': { transform: 'translateY(0) rotate(-2deg)' },
                    '50%': { transform: 'translateY(-8px) rotate(2deg)' },
                },
                'logo-glow': {
                    '0%, 100%': { transform: 'scale(1)', opacity: '0.35' },
                    '50%': { transform: 'scale(1.12)', opacity: '0.6' },
                },
                'logo-shine': {
                    '0%': { transform: 'translateX(-140%) skewX(-18deg)', opacity: '0' },
                    '35%': { opacity: '0.85' },
                    '65%': { opacity: '0.85' },
                    '100%': { transform: 'translateX(240%) skewX(-18deg)', opacity: '0' },
                },
                'bubble-rise': {
                    '0%': { transform: 'translateY(0) scale(0.4)', opacity: '0' },
                    '15%': { opacity: '0.9' },
                    '80%': { opacity: '0.7' },
                    '100%': { transform: 'translateY(var(--rise, -110px)) scale(1)', opacity: '0' },
                },
                'spin-slow': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                },
            },
            animation: {
                'fade-in': 'fade-in 150ms ease-out',
                'slide-up': 'slide-up 180ms ease-out',
                'logo-bob': 'logo-bob 4s ease-in-out infinite',
                'logo-glow': 'logo-glow 3.2s ease-in-out infinite',
                'logo-shine': 'logo-shine 3.8s ease-in-out infinite',
                'bubble-rise': 'bubble-rise 2.8s ease-in infinite',
                'spin-slow': 'spin-slow 14s linear infinite',
            },
        },
    },

    plugins: [forms],
};
