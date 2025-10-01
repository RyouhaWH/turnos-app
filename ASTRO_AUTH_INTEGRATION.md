# Integración de Autenticación con Astro

Este documento explica cómo integrar la autenticación de Laravel con tu aplicación Astro.

## Endpoints Disponibles

### 1. Login (Iniciar Sesión)
**POST** `/api/auth/login`

**Body:**
```json
{
    "email": "usuario@ejemplo.com",
    "password": "tu_password"
}
```

**Respuesta exitosa:**
```json
{
    "success": true,
    "message": "Inicio de sesión exitoso",
    "data": {
        "user": {
            "id": 1,
            "name": "Nombre Usuario",
            "email": "usuario@ejemplo.com",
            "roles": ["admin", "user"]
        },
        "token": "1|abcdef123456...",
        "token_type": "Bearer"
    }
}
```

### 2. Logout (Cerrar Sesión)
**POST** `/api/auth/logout`

**Headers:**
```
Authorization: Bearer tu_token_aqui
```

**Respuesta:**
```json
{
    "success": true,
    "message": "Sesión cerrada exitosamente"
}
```

### 3. Obtener Usuario Actual
**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer tu_token_aqui
```

**Respuesta:**
```json
{
    "success": true,
    "data": {
        "user": {
            "id": 1,
            "name": "Nombre Usuario",
            "email": "usuario@ejemplo.com",
            "roles": ["admin", "user"]
        }
    }
}
```

### 4. Verificar Token
**GET** `/api/auth/verify`

**Headers:**
```
Authorization: Bearer tu_token_aqui
```

**Respuesta:**
```json
{
    "success": true,
    "message": "Token válido",
    "data": {
        "user": {
            "id": 1,
            "name": "Nombre Usuario",
            "email": "usuario@ejemplo.com",
            "roles": ["admin", "user"]
        }
    }
}
```

## Ejemplo de Uso en Astro

### 1. Servicio de Autenticación

Crea un archivo `src/lib/auth.ts`:

```typescript
interface User {
    id: number;
    name: string;
    email: string;
    roles: string[];
}

interface AuthResponse {
    success: boolean;
    message: string;
    data?: {
        user: User;
        token: string;
        token_type: string;
    };
}

class AuthService {
    private baseUrl = 'http://tu-dominio-laravel.com/api';
    private tokenKey = 'auth_token';

    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        
        if (data.success && data.data?.token) {
            // Guardar token en localStorage
            localStorage.setItem(this.tokenKey, data.data.token);
        }
        
        return data;
    }

    async logout(): Promise<AuthResponse> {
        const token = this.getToken();
        if (!token) {
            return { success: false, message: 'No hay sesión activa' };
        }

        const response = await fetch(`${this.baseUrl}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json',
            },
        });

        const data = await response.json();
        
        if (data.success) {
            localStorage.removeItem(this.tokenKey);
        }
        
        return data;
    }

    async getCurrentUser(): Promise<User | null> {
        const token = this.getToken();
        if (!token) return null;

        try {
            const response = await fetch(`${this.baseUrl}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            return data.success ? data.data.user : null;
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            return null;
        }
    }

    async verifyToken(): Promise<boolean> {
        const token = this.getToken();
        if (!token) return false;

        try {
            const response = await fetch(`${this.baseUrl}/auth/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });

            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('Error al verificar token:', error);
            return false;
        }
    }

    getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(this.tokenKey);
    }

    isAuthenticated(): boolean {
        return this.getToken() !== null;
    }
}

export const authService = new AuthService();
```

### 2. Componente de Login

Crea un archivo `src/components/LoginForm.astro`:

```astro
---
// LoginForm.astro
---

<div class="login-form">
    <h2>Iniciar Sesión</h2>
    <form id="loginForm">
        <div>
            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>
        </div>
        <div>
            <label for="password">Contraseña:</label>
            <input type="password" id="password" name="password" required>
        </div>
        <button type="submit">Iniciar Sesión</button>
    </form>
    <div id="message"></div>
</div>

<script>
    import { authService } from '../lib/auth.ts';

    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        
        const messageDiv = document.getElementById('message');
        
        try {
            const response = await authService.login(email, password);
            
            if (response.success) {
                messageDiv.textContent = '¡Inicio de sesión exitoso!';
                messageDiv.className = 'success';
                // Redirigir o actualizar la UI
                window.location.href = '/dashboard';
            } else {
                messageDiv.textContent = response.message;
                messageDiv.className = 'error';
            }
        } catch (error) {
            messageDiv.textContent = 'Error de conexión';
            messageDiv.className = 'error';
        }
    });
</script>

<style>
    .login-form {
        max-width: 400px;
        margin: 0 auto;
        padding: 20px;
    }
    
    .success {
        color: green;
    }
    
    .error {
        color: red;
    }
</style>
```

### 3. Middleware de Autenticación

Crea un archivo `src/middleware/auth.ts`:

```typescript
import { authService } from '../lib/auth.ts';

export async function checkAuth() {
    if (typeof window === 'undefined') return false;
    
    const isAuthenticated = authService.isAuthenticated();
    if (!isAuthenticated) return false;
    
    // Verificar que el token sigue siendo válido
    const isValid = await authService.verifyToken();
    if (!isValid) {
        // Token expirado, limpiar
        await authService.logout();
        return false;
    }
    
    return true;
}
```

## Configuración de CORS

Asegúrate de que tu aplicación Laravel tenga configurado CORS para permitir requests desde tu dominio de Astro. En `config/cors.php`:

```php
'allowed_origins' => [
    'http://localhost:4321', // Para desarrollo
    'https://tu-dominio-astro.com', // Para producción
],
```

## Notas Importantes

1. **Seguridad**: Los tokens de Sanctum tienen una duración configurable. Por defecto duran 24 horas.
2. **HTTPS**: En producción, asegúrate de usar HTTPS para proteger los tokens.
3. **Almacenamiento**: El ejemplo usa localStorage, pero podrías usar cookies para mayor seguridad.
4. **Refresh Tokens**: Si necesitas renovar tokens automáticamente, puedes implementar un sistema de refresh tokens.

## Testing

Puedes probar los endpoints usando curl o Postman:

```bash
# Login
curl -X POST http://tu-dominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@ejemplo.com","password":"tu_password"}'

# Verificar usuario
curl -X GET http://tu-dominio.com/api/auth/me \
  -H "Authorization: Bearer tu_token_aqui"
```

