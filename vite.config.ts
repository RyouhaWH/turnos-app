import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import os from 'node:os';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const VITE_HOST = process.env.VITE_HMR_HOST || process.env.VITE_HOST || '192.168.1.20';
const VITE_PORT = parseInt(process.env.VITE_PORT || '5173');

export default defineConfig({
    server: {
        host: '0.0.0.0',
        port: VITE_PORT,
        strictPort: false,
        hmr: {
            host: VITE_HOST,
            port: VITE_PORT,
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
});
