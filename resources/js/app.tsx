import '../css/app.css';
import axios from 'axios';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';

// Configurar axios globalmente
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Configurar CSRF token
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.getAttribute('content');
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

// Función para refrescar el token CSRF
const refreshCsrfToken = async (): Promise<string | null> => {
    try {
        const response = await fetch(window.location.href, {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
            credentials: 'same-origin',
        });
        
        if (response.ok) {
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newToken = doc.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            if (newToken) {
                // Actualizar el token en el meta tag y en axios
                const metaTag = document.querySelector('meta[name="csrf-token"]');
                if (metaTag) {
                    metaTag.setAttribute('content', newToken);
                }
                window.axios.defaults.headers.common['X-CSRF-TOKEN'] = newToken;
                console.log('✅ Token CSRF refrescado correctamente');
                return newToken;
            }
        }
    } catch (error) {
        console.error('Error al refrescar token CSRF:', error);
    }
    return null;
};

// Interceptor para manejar errores 419 (CSRF token expired)
let isRefreshingToken = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    
    failedQueue = [];
};

window.axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Verificar si es un error 419
        if (error.response?.status === 419 && !originalRequest._retry) {
            if (isRefreshingToken) {
                // Si ya se está refrescando, esperar en la cola
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return window.axios(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshingToken = true;

            try {
                const newToken = await refreshCsrfToken();
                
                if (newToken) {
                    // Actualizar el token en la petición original
                    originalRequest.headers['X-CSRF-TOKEN'] = newToken;
                    
                    // Procesar la cola de peticiones pendientes
                    processQueue(null, newToken);
                    isRefreshingToken = false;
                    
                    // Reintentar la petición original
                    return window.axios(originalRequest);
                } else {
                    throw new Error('No se pudo refrescar el token CSRF');
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                isRefreshingToken = false;
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
