# 🔐 Documentación de Autenticación API

## Índice
1. [Introducción](#introducción)
2. [Configuración Inicial](#configuración-inicial)
3. [Endpoints Disponibles](#endpoints-disponibles)
4. [Ejemplos de Uso](#ejemplos-de-uso)
5. [Manejo de Errores](#manejo-de-errores)
6. [Seguridad](#seguridad)

---

## Introducción

Esta API utiliza **Laravel Sanctum** para la autenticación basada en tokens. Todos los endpoints protegidos requieren un token de acceso válido que se obtiene al iniciar sesión.

### URL Base
```
http://tu-dominio.com/api
```

### Formato de Respuestas
Todas las respuestas de la API están en formato JSON y siguen esta estructura:

```json
{
    "success": true|false,
    "message": "Mensaje descriptivo",
    "data": {
        // Datos de respuesta
    },
    "errors": {
        // Errores de validación (solo si hay errores)
    }
}
```

---

## Configuración Inicial

### 1. Verificar que Sanctum esté instalado

```bash
php artisan migrate
```

### 2. Configurar CORS (opcional)

Si vas a consumir la API desde un frontend en otro dominio, asegúrate de configurar CORS correctamente en `config/cors.php`.

---

## Endpoints Disponibles

### 📝 Registro de Usuario

**POST** `/api/auth/register`

Crea un nuevo usuario y devuelve un token de acceso.

#### Request Body
```json
{
    "name": "Juan Pérez",
    "email": "juan@ejemplo.com",
    "password": "password123",
    "password_confirmation": "password123",
    "rol": "vendedor",           // opcional
    "departamento": "ventas"      // opcional
}
```

#### Validaciones
- `name`: requerido, string, máximo 255 caracteres
- `email`: requerido, email válido, único en la base de datos
- `password`: requerido, mínimo 8 caracteres, debe coincidir con password_confirmation
- `rol`: opcional, string, máximo 100 caracteres
- `departamento`: opcional, string, máximo 100 caracteres

#### Respuesta Exitosa (201)
```json
{
    "success": true,
    "message": "Usuario registrado exitosamente",
    "data": {
        "user": {
            "id": 1,
            "name": "Juan Pérez",
            "email": "juan@ejemplo.com",
            "rol": "vendedor",
            "departamento": "ventas",
            "activo": true
        },
        "access_token": "1|AbCdEfGhIjKlMnOpQrStUvWxYz...",
        "token_type": "Bearer"
    }
}
```

---

### 🔑 Inicio de Sesión

**POST** `/api/auth/login`

Autentica a un usuario y devuelve un token de acceso.

#### Request Body
```json
{
    "email": "juan@ejemplo.com",
    "password": "password123"
}
```

#### Validaciones
- `email`: requerido, formato email válido
- `password`: requerido

#### Respuesta Exitosa (200)
```json
{
    "success": true,
    "message": "Inicio de sesión exitoso",
    "data": {
        "user": {
            "id": 1,
            "name": "Juan Pérez",
            "email": "juan@ejemplo.com",
            "rol": "vendedor",
            "departamento": "ventas",
            "activo": true,
            "items_asignados": []
        },
        "access_token": "1|AbCdEfGhIjKlMnOpQrStUvWxYz...",
        "token_type": "Bearer"
    }
}
```

#### Errores Comunes
- **401 Unauthorized**: Credenciales incorrectas
- **403 Forbidden**: Usuario inactivo

---

### 👤 Obtener Usuario Autenticado

**GET** `/api/auth/me`

Obtiene la información del usuario actualmente autenticado.

#### Headers Requeridos
```
Authorization: Bearer {token}
```

#### Respuesta Exitosa (200)
```json
{
    "success": true,
    "data": {
        "user": {
            "id": 1,
            "name": "Juan Pérez",
            "email": "juan@ejemplo.com",
            "rol": "vendedor",
            "departamento": "ventas",
            "activo": true,
            "items_asignados": [],
            "email_verified_at": null
        }
    }
}
```

---

### 🔄 Renovar Token

**POST** `/api/auth/refresh`

Renueva el token de acceso. El token anterior se revoca.

#### Headers Requeridos
```
Authorization: Bearer {token}
```

#### Respuesta Exitosa (200)
```json
{
    "success": true,
    "message": "Token renovado exitosamente",
    "data": {
        "access_token": "2|XyZaBcDeFgHiJkLmNoPqRsTuVw...",
        "token_type": "Bearer"
    }
}
```

---

### 🚪 Cerrar Sesión (Token Actual)

**POST** `/api/auth/logout`

Revoca el token actual utilizado para la petición.

#### Headers Requeridos
```
Authorization: Bearer {token}
```

#### Respuesta Exitosa (200)
```json
{
    "success": true,
    "message": "Sesión cerrada exitosamente"
}
```

---

### 🚪🚪 Cerrar Todas las Sesiones

**POST** `/api/auth/logout-all`

Revoca todos los tokens del usuario autenticado (cierra sesión en todos los dispositivos).

#### Headers Requeridos
```
Authorization: Bearer {token}
```

#### Respuesta Exitosa (200)
```json
{
    "success": true,
    "message": "Todas las sesiones han sido cerradas"
}
```

---

### 🔒 Cambiar Contraseña

**POST** `/api/auth/change-password`

Cambia la contraseña del usuario autenticado. Por seguridad, revoca todos los tokens anteriores y devuelve uno nuevo.

#### Headers Requeridos
```
Authorization: Bearer {token}
```

#### Request Body
```json
{
    "current_password": "password123",
    "new_password": "newpassword456",
    "new_password_confirmation": "newpassword456"
}
```

#### Validaciones
- `current_password`: requerido
- `new_password`: requerido, mínimo 8 caracteres, debe coincidir con new_password_confirmation

#### Respuesta Exitosa (200)
```json
{
    "success": true,
    "message": "Contraseña actualizada exitosamente",
    "data": {
        "access_token": "3|NuEvOtOkEnXyZ...",
        "token_type": "Bearer"
    }
}
```

#### Errores Comunes
- **401 Unauthorized**: La contraseña actual es incorrecta

---

## Ejemplos de Uso

### JavaScript (Fetch)

#### 1. Registro de Usuario
```javascript
async function register() {
    try {
        const response = await fetch('http://tu-dominio.com/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                name: 'Juan Pérez',
                email: 'juan@ejemplo.com',
                password: 'password123',
                password_confirmation: 'password123',
                rol: 'vendedor',
                departamento: 'ventas'
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Guardar token en localStorage
            localStorage.setItem('token', data.data.access_token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            console.log('Registro exitoso');
        } else {
            console.error('Error:', data.message);
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
}
```

#### 2. Inicio de Sesión
```javascript
async function login() {
    try {
        const response = await fetch('http://tu-dominio.com/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: 'juan@ejemplo.com',
                password: 'password123'
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Guardar token y usuario en localStorage
            localStorage.setItem('token', data.data.access_token);
            localStorage.setItem('user', JSON.stringify(data.data.user));
            console.log('Login exitoso');
        } else {
            console.error('Error:', data.message);
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
}
```

#### 3. Hacer Peticiones Autenticadas
```javascript
async function obtenerDatos() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('http://tu-dominio.com/api/v1/items', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log('Datos obtenidos:', data);
        } else if (response.status === 401) {
            // Token expirado o inválido
            console.log('Sesión expirada, redirigir a login');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirigir a página de login
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
}
```

#### 4. Cerrar Sesión
```javascript
async function logout() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('http://tu-dominio.com/api/auth/logout', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();
        
        if (data.success) {
            // Limpiar localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            console.log('Logout exitoso');
        }
    } catch (error) {
        console.error('Error de red:', error);
    }
}
```

---

### React con Axios

#### Configuración de Axios
```javascript
import axios from 'axios';

// Configurar base URL
const api = axios.create({
    baseURL: 'http://tu-dominio.com/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expirado o inválido
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
```

#### Ejemplo de Uso en Componentes
```javascript
import api from './api';

// Login
async function handleLogin(email, password) {
    try {
        const response = await api.post('/auth/login', { email, password });
        
        if (response.data.success) {
            localStorage.setItem('token', response.data.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.data.user));
            // Redirigir al dashboard
        }
    } catch (error) {
        console.error('Error de login:', error.response?.data?.message);
    }
}

// Obtener datos autenticados
async function fetchItems() {
    try {
        const response = await api.get('/v1/items');
        console.log('Items:', response.data);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Logout
async function handleLogout() {
    try {
        await api.post('/auth/logout');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirigir al login
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}
```

---

### PHP (cURL)

#### Inicio de Sesión
```php
<?php

function login($email, $password) {
    $url = 'http://tu-dominio.com/api/auth/login';
    
    $data = [
        'email' => $email,
        'password' => $password
    ];
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    if ($httpCode === 200 && $result['success']) {
        return $result['data']['access_token'];
    }
    
    return null;
}

// Uso
$token = login('juan@ejemplo.com', 'password123');
if ($token) {
    echo "Token obtenido: " . $token;
    // Guardar token en sesión o base de datos
} else {
    echo "Error al iniciar sesión";
}
?>
```

#### Petición Autenticada
```php
<?php

function getItems($token) {
    $url = 'http://tu-dominio.com/api/v1/items';
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $token,
        'Accept: application/json'
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return json_decode($response, true);
    }
    
    return null;
}

// Uso
$items = getItems($token);
if ($items) {
    print_r($items);
}
?>
```

---

### Python (Requests)

#### Instalación
```bash
pip install requests
```

#### Ejemplo de Uso
```python
import requests

API_URL = "http://tu-dominio.com/api"

class APIClient:
    def __init__(self):
        self.token = None
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    
    def login(self, email, password):
        url = f"{API_URL}/auth/login"
        data = {
            'email': email,
            'password': password
        }
        
        response = requests.post(url, json=data, headers=self.headers)
        
        if response.status_code == 200:
            result = response.json()
            if result['success']:
                self.token = result['data']['access_token']
                self.headers['Authorization'] = f"Bearer {self.token}"
                return True
        return False
    
    def get_items(self):
        url = f"{API_URL}/v1/items"
        response = requests.get(url, headers=self.headers)
        
        if response.status_code == 200:
            return response.json()
        return None
    
    def logout(self):
        url = f"{API_URL}/auth/logout"
        response = requests.post(url, headers=self.headers)
        
        if response.status_code == 200:
            self.token = None
            self.headers.pop('Authorization', None)
            return True
        return False

# Uso
client = APIClient()

# Login
if client.login('juan@ejemplo.com', 'password123'):
    print("Login exitoso")
    
    # Obtener items
    items = client.get_items()
    if items:
        print("Items:", items)
    
    # Logout
    client.logout()
    print("Logout exitoso")
else:
    print("Error en login")
```

---

## Manejo de Errores

### Códigos de Estado HTTP

| Código | Significado | Descripción |
|--------|-------------|-------------|
| 200 | OK | Petición exitosa |
| 201 | Created | Recurso creado exitosamente |
| 401 | Unauthorized | Token inválido o expirado / Credenciales incorrectas |
| 403 | Forbidden | Usuario inactivo o sin permisos |
| 422 | Unprocessable Entity | Error de validación |
| 500 | Internal Server Error | Error del servidor |

### Estructura de Errores de Validación (422)

```json
{
    "success": false,
    "message": "Error de validación",
    "errors": {
        "email": [
            "El campo email es obligatorio."
        ],
        "password": [
            "El campo password debe tener al menos 8 caracteres."
        ]
    }
}
```

### Manejo de Token Expirado/Inválido

Cuando un token es inválido o ha expirado, la API responde con código **401**:

```json
{
    "message": "Unauthenticated."
}
```

**Acciones recomendadas:**
1. Eliminar el token almacenado
2. Limpiar la información del usuario
3. Redirigir al usuario a la página de login

---

## Seguridad

### Buenas Prácticas

1. **Almacenamiento del Token**
   - ✅ **Recomendado**: localStorage o sessionStorage para aplicaciones SPA
   - ✅ **Recomendado**: Cookies HTTP-only para aplicaciones web tradicionales
   - ❌ **No recomendado**: Almacenar en variables globales de JavaScript

2. **Transmisión del Token**
   - ✅ Siempre usar HTTPS en producción
   - ✅ Enviar token en header `Authorization: Bearer {token}`
   - ❌ No enviar token en URL o query parameters

3. **Gestión de Tokens**
   - ✅ Implementar renovación de tokens periódicamente
   - ✅ Cerrar sesión al detectar actividad sospechosa
   - ✅ Revocar tokens al cambiar contraseña
   - ✅ Usar `/logout-all` cuando el usuario reporte actividad sospechosa

4. **Validación de Contraseñas**
   - ✅ Mínimo 8 caracteres
   - ✅ Considerar agregar validación de complejidad (mayúsculas, números, símbolos)

5. **Protección contra Ataques**
   - ✅ CORS configurado correctamente
   - ✅ Rate limiting en endpoints de autenticación
   - ✅ Validación de entrada en todos los endpoints

### Configuración de CORS

Si tu frontend está en un dominio diferente al backend, configura CORS en `config/cors.php`:

```php
'paths' => ['api/*', 'sanctum/csrf-cookie'],

'allowed_origins' => [
    'http://localhost:3000',
    'https://tu-frontend.com'
],

'allowed_headers' => ['*'],

'allowed_methods' => ['*'],

'supports_credentials' => true,
```

### Expiración de Tokens

Por defecto, los tokens de Sanctum no expiran. Para configurar expiración, edita `config/sanctum.php`:

```php
'expiration' => 60, // Tokens expiran en 60 minutos
```

---

## Preguntas Frecuentes

### ¿Cómo pruebo la API?

Puedes usar herramientas como:
- **Postman**: https://www.postman.com/
- **Insomnia**: https://insomnia.rest/
- **Thunder Client** (extensión de VS Code)
- **cURL** desde la terminal

### ¿Puedo tener múltiples tokens activos?

Sí, por defecto un usuario puede tener múltiples tokens activos (útil para múltiples dispositivos). Si quieres limitar a un solo token, descomenta esta línea en el método `login` del `AuthController`:

```php
$user->tokens()->delete();
```

### ¿Los tokens expiran?

Por defecto, los tokens de Sanctum no expiran. Puedes configurar la expiración en `config/sanctum.php`.

### ¿Cómo protejo otros endpoints?

Agrega el middleware `auth:sanctum` a las rutas que quieras proteger:

```php
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/protected', function () {
        return response()->json(['message' => 'Acceso autorizado']);
    });
});
```

---

## Soporte

Para más información sobre Laravel Sanctum:
- Documentación oficial: https://laravel.com/docs/sanctum
- GitHub: https://github.com/laravel/sanctum

---

**Última actualización**: Octubre 2025


