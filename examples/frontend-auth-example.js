/**
 * Ejemplo completo de implementación de autenticación
 * para aplicaciones frontend (JavaScript/React/Vue/etc)
 *
 * Este archivo muestra una implementación lista para usar
 * del sistema de autenticación con manejo de tokens.
 */

// ==========================================
// Configuración Base
// ==========================================

const API_BASE_URL = 'http://localhost:8000/api';

// ==========================================
// Servicio de Autenticación
// ==========================================

class AuthService {
    constructor() {
        this.token = localStorage.getItem('token') || null;
        this.user = JSON.parse(localStorage.getItem('user')) || null;
    }

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated() {
        return !!this.token;
    }

    /**
     * Obtener el token actual
     */
    getToken() {
        return this.token;
    }

    /**
     * Obtener el usuario actual
     */
    getUser() {
        return this.user;
    }

    /**
     * Registrar nuevo usuario
     */
    async register(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al registrar usuario');
            }

            if (data.success) {
                this.token = data.data.access_token;
                this.user = data.data.user;

                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));

                return { success: true, data: data.data };
            }

            throw new Error(data.message || 'Error desconocido');
        } catch (error) {
            console.error('Error en registro:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Iniciar sesión
     */
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al iniciar sesión');
            }

            if (data.success) {
                this.token = data.data.access_token;
                this.user = data.data.user;

                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));

                return { success: true, data: data.data };
            }

            throw new Error(data.message || 'Error desconocido');
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cerrar sesión
     */
    async logout() {
        try {
            if (this.token) {
                await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Accept': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        } finally {
            // Limpiar datos locales sin importar si la petición falló
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }

    /**
     * Obtener información del usuario actual
     */
    async getCurrentUser() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    // Token inválido o expirado
                    this.logout();
                }
                throw new Error(data.message || 'Error al obtener usuario');
            }

            if (data.success) {
                this.user = data.data.user;
                localStorage.setItem('user', JSON.stringify(this.user));
                return { success: true, data: data.data.user };
            }

            throw new Error(data.message || 'Error desconocido');
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Renovar token
     */
    async refreshToken() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                }
                throw new Error(data.message || 'Error al renovar token');
            }

            if (data.success) {
                this.token = data.data.access_token;
                localStorage.setItem('token', this.token);
                return { success: true, data: data.data };
            }

            throw new Error(data.message || 'Error desconocido');
        } catch (error) {
            console.error('Error al renovar token:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cambiar contraseña
     */
    async changePassword(currentPassword, newPassword, newPasswordConfirmation) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    new_password_confirmation: newPasswordConfirmation
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al cambiar contraseña');
            }

            if (data.success) {
                // Actualizar token (se genera uno nuevo por seguridad)
                this.token = data.data.access_token;
                localStorage.setItem('token', this.token);
                return { success: true, data: data.data };
            }

            throw new Error(data.message || 'Error desconocido');
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            return { success: false, error: error.message };
        }
    }
}

// ==========================================
// Servicio de API (para peticiones autenticadas)
// ==========================================

class APIService {
    constructor(authService) {
        this.authService = authService;
    }

    /**
     * Realizar petición autenticada
     */
    async request(endpoint, options = {}) {
        const token = this.authService.getToken();

        if (!token) {
            throw new Error('No hay token de autenticación');
        }

        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const finalOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, finalOptions);
            const data = await response.json();

            // Si el token es inválido, cerrar sesión
            if (response.status === 401) {
                this.authService.logout();
                // Puedes redirigir al login aquí
                window.location.href = '/login';
                throw new Error('Sesión expirada');
            }

            if (!response.ok) {
                throw new Error(data.message || 'Error en la petición');
            }

            return { success: true, data };
        } catch (error) {
            console.error('Error en petición API:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * GET request
     */
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    /**
     * POST request
     */
    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// ==========================================
// Ejemplo de Uso
// ==========================================

// Inicializar servicios
const auth = new AuthService();
const api = new APIService(auth);

// Ejemplo: Registro
async function ejemploRegistro() {
    const result = await auth.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        rol: 'vendedor',
        departamento: 'ventas'
    });

    if (result.success) {
        console.log('Registro exitoso:', result.data.user);
        console.log('Token:', result.data.access_token);
    } else {
        console.error('Error en registro:', result.error);
    }
}

// Ejemplo: Login
async function ejemploLogin() {
    const result = await auth.login('test@example.com', 'password123');

    if (result.success) {
        console.log('Login exitoso:', result.data.user);
        console.log('Token guardado en localStorage');

        // Redirigir al dashboard
        // window.location.href = '/dashboard';
    } else {
        console.error('Error en login:', result.error);
        alert('Credenciales incorrectas');
    }
}

// Ejemplo: Obtener datos con autenticación
async function ejemploObtenerItems() {
    const result = await api.get('/v1/items');

    if (result.success) {
        console.log('Items obtenidos:', result.data);
    } else {
        console.error('Error al obtener items:', result.error);
    }
}

// Ejemplo: Crear un movimiento
async function ejemploCrearMovimiento() {
    const movimiento = {
        tipo_movimiento: 'entrada',
        cantidad: 10,
        item_id: 1,
        user_id: auth.getUser().id
        // ... otros campos
    };

    const result = await api.post('/v1/movements', movimiento);

    if (result.success) {
        console.log('Movimiento creado:', result.data);
    } else {
        console.error('Error al crear movimiento:', result.error);
    }
}

// Ejemplo: Verificar autenticación en cada página
function verificarAutenticacion() {
    if (!auth.isAuthenticated()) {
        // Redirigir al login si no está autenticado
        window.location.href = '/login';
        return false;
    }
    return true;
}

// Ejemplo: Logout
async function ejemploLogout() {
    await auth.logout();
    console.log('Sesión cerrada');
    window.location.href = '/login';
}

// Exportar para usar en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthService, APIService };
}

// ==========================================
// Uso en HTML
// ==========================================

/*

<!DOCTYPE html>
<html>
<head>
    <title>Login Example</title>
</head>
<body>
    <h1>Login</h1>
    <form id="loginForm">
        <input type="email" id="email" placeholder="Email" required>
        <input type="password" id="password" placeholder="Password" required>
        <button type="submit">Login</button>
    </form>

    <script src="frontend-auth-example.js"></script>
    <script>
        const auth = new AuthService();
        const api = new APIService(auth);

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const result = await auth.login(email, password);

            if (result.success) {
                alert('Login exitoso!');
                window.location.href = '/dashboard.html';
            } else {
                alert('Error: ' + result.error);
            }
        });
    </script>
</body>
</html>

*/

// ==========================================
// Uso en React
// ==========================================

/*

// hooks/useAuth.js
import { useState, useEffect } from 'react';

export function useAuth() {
    const [auth] = useState(() => new AuthService());
    const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated());
    const [user, setUser] = useState(auth.getUser());

    const login = async (email, password) => {
        const result = await auth.login(email, password);
        if (result.success) {
            setIsAuthenticated(true);
            setUser(result.data.user);
        }
        return result;
    };

    const logout = async () => {
        await auth.logout();
        setIsAuthenticated(false);
        setUser(null);
    };

    return {
        isAuthenticated,
        user,
        login,
        logout,
        register: auth.register.bind(auth),
        changePassword: auth.changePassword.bind(auth)
    };
}

// Componente LoginPage.jsx
import { useAuth } from './hooks/useAuth';
import { useState } from 'react';

function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const result = await login(email, password);

        if (result.success) {
            // Redirigir al dashboard
            window.location.href = '/dashboard';
        } else {
            setError(result.error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h1>Login</h1>
            {error && <div className="error">{error}</div>}
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
            />
            <button type="submit">Login</button>
        </form>
    );
}

*/


