import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
    ],
    build: {
        target: 'es2015',
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    agGrid: ['ag-grid-community', 'ag-grid-react'],
                    ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
                },
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash].[ext]',
            },
        },
        cssCodeSplit: true,
        cssMinify: true,
        assetsInlineLimit: 4096,
        sourcemap: false,
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'ag-grid-community', 'ag-grid-react'],
    },
    server: {
        hmr: {
            host: 'localhost',
        },
        watch: {
            usePolling: true,
        },
    },
    define: {
        __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    },
    css: {
        postcss: {
            plugins: [
                require('autoprefixer'),
                require('cssnano')({
                    preset: 'default',
                }),
            ],
        },
    },
    ssr: {
        noExternal: ['@inertiajs/react', '@inertiajs/server'],
    },
});
