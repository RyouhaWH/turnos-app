# Rutas API de Prueba

Este documento describe todas las rutas de prueba disponibles para verificar el funcionamiento de la API desde otras aplicaciones.

## 🚀 Rutas Disponibles

### 1. Prueba Básica
**GET** `/api/test`

Verifica que la API está funcionando correctamente.

**Respuesta:**
```json
{
    "success": true,
    "message": "API funcionando correctamente",
    "timestamp": "2024-01-15T10:30:00.000000Z",
    "server_time": "2024-01-15 10:30:00",
    "timezone": "UTC",
    "environment": "local"
}
```

### 2. Información del Servidor
**GET** `/api/test/server`

Obtiene información detallada del servidor y entorno.

**Respuesta:**
```json
{
    "success": true,
    "message": "Información del servidor",
    "data": {
        "php_version": "8.2.0",
        "laravel_version": "10.0.0",
        "server_software": "nginx/1.20.0",
        "server_name": "localhost",
        "request_method": "GET",
        "user_agent": "Mozilla/5.0...",
        "remote_addr": "127.0.0.1",
        "timestamp": "2024-01-15T10:30:00.000000Z",
        "memory_usage": 2097152,
        "memory_peak": 4194304
    }
}
```

### 3. Prueba de Base de Datos
**GET** `/api/test/database`

Verifica la conexión a la base de datos y obtiene estadísticas básicas.

**Respuesta exitosa:**
```json
{
    "success": true,
    "message": "Conexión a base de datos exitosa",
    "data": {
        "database_name": "turnos_app",
        "database_driver": "sqlite",
        "user_count": 25,
        "connection_status": "Connected",
        "timestamp": "2024-01-15T10:30:00.000000Z"
    }
}
```

**Respuesta con error:**
```json
{
    "success": false,
    "message": "Error de conexión a base de datos",
    "error": "SQLSTATE[HY000] [2002] Connection refused",
    "timestamp": "2024-01-15T10:30:00.000000Z"
}
```

### 4. Prueba de Caché
**GET** `/api/test/cache`

Verifica que el sistema de caché está funcionando correctamente.

**Respuesta:**
```json
{
    "success": true,
    "message": "Sistema de caché funcionando correctamente",
    "data": {
        "test_key": "api_test_1705312200",
        "stored_value": "test_value_1234",
        "retrieved_value": "test_value_1234",
        "cache_working": true,
        "timestamp": "2024-01-15T10:30:00.000000Z"
    }
}
```

### 5. Prueba de Headers HTTP
**GET** `/api/test/headers`

Muestra todos los headers HTTP recibidos en la petición.

**Respuesta:**
```json
{
    "success": true,
    "message": "Headers HTTP recibidos",
    "data": {
        "request_headers": {
            "host": ["localhost:8000"],
            "user-agent": ["Mozilla/5.0..."],
            "accept": ["application/json"],
            "content-type": ["application/json"]
        },
        "content_type": "application/json",
        "accept": "application/json",
        "authorization": "Not present",
        "user_agent": "Mozilla/5.0...",
        "origin": "http://localhost:3000",
        "referer": null,
        "timestamp": "2024-01-15T10:30:00.000000Z"
    }
}
```

### 6. Prueba de CORS
**GET** `/api/test/cors`

Verifica la configuración de CORS.

**Respuesta:**
```json
{
    "success": true,
    "message": "CORS configurado correctamente",
    "data": {
        "cors_enabled": true,
        "allowed_origins": ["http://localhost:3000", "https://mi-app.com"],
        "allowed_methods": ["GET", "POST", "PUT", "DELETE"],
        "allowed_headers": ["Content-Type", "Authorization", "Accept"],
        "timestamp": "2024-01-15T10:30:00.000000Z"
    }
}
```

### 7. Prueba Completa del Sistema
**GET** `/api/test/full`

Ejecuta todas las pruebas del sistema y devuelve un reporte completo.

**Respuesta exitosa:**
```json
{
    "success": true,
    "message": "Todos los sistemas funcionando correctamente",
    "data": {
        "tests": {
            "database": {
                "status": "OK",
                "message": "Conexión exitosa"
            },
            "cache": {
                "status": "OK",
                "message": "Sistema de caché funcionando"
            },
            "models": {
                "status": "OK",
                "message": "Usuarios en BD: 25"
            },
            "config": {
                "status": "OK",
                "message": "Configuración cargada",
                "app_name": "Turnos App",
                "app_env": "local",
                "app_debug": true
            }
        },
        "overall_status": "HEALTHY",
        "timestamp": "2024-01-15T10:30:00.000000Z"
    }
}
```

### 8. Prueba de Autenticación
**GET** `/api/test/auth`

**Headers requeridos:**
```
Authorization: Bearer tu_token_aqui
```

Verifica que la autenticación está funcionando correctamente.

**Respuesta:**
```json
{
    "success": true,
    "message": "Autenticación funcionando correctamente",
    "data": {
        "user": {
            "id": 1,
            "name": "Usuario Ejemplo",
            "email": "usuario@ejemplo.com",
            "roles": ["admin", "user"]
        },
        "token_valid": true,
        "timestamp": "2024-01-15T10:30:00.000000Z"
    }
}
```

## 🧪 Ejemplos de Uso

### Con curl
```bash
# Prueba básica
curl -X GET http://localhost:8000/api/test

# Prueba de base de datos
curl -X GET http://localhost:8000/api/test/database

# Prueba completa
curl -X GET http://localhost:8000/api/test/full

# Prueba de autenticación (requiere token)
curl -X GET http://localhost:8000/api/test/auth \
  -H "Authorization: Bearer tu_token_aqui"
```

### Con JavaScript/Fetch
```javascript
// Prueba básica
const response = await fetch('http://localhost:8000/api/test');
const data = await response.json();
console.log(data);

// Prueba de autenticación
const authResponse = await fetch('http://localhost:8000/api/test/auth', {
    headers: {
        'Authorization': 'Bearer tu_token_aqui',
        'Accept': 'application/json'
    }
});
const authData = await authResponse.json();
console.log(authData);
```

### Con Axios
```javascript
import axios from 'axios';

// Prueba básica
const testResponse = await axios.get('http://localhost:8000/api/test');
console.log(testResponse.data);

// Prueba de autenticación
const authResponse = await axios.get('http://localhost:8000/api/test/auth', {
    headers: {
        'Authorization': 'Bearer tu_token_aqui'
    }
});
console.log(authResponse.data);
```

## 🔧 Para Desarrollo

### Monitoreo de Salud
Puedes usar `/api/test/full` para crear un endpoint de health check que monitorees desde herramientas como:
- Uptime Robot
- Pingdom
- Tu propio sistema de monitoreo

### Testing Automatizado
```javascript
// Ejemplo de test automatizado
async function runApiTests() {
    const tests = [
        '/api/test',
        '/api/test/server',
        '/api/test/database',
        '/api/test/cache',
        '/api/test/cors'
    ];
    
    for (const test of tests) {
        try {
            const response = await fetch(`http://localhost:8000${test}`);
            const data = await response.json();
            console.log(`✅ ${test}: ${data.success ? 'PASS' : 'FAIL'}`);
        } catch (error) {
            console.log(`❌ ${test}: ERROR - ${error.message}`);
        }
    }
}

runApiTests();
```

## 📊 Códigos de Estado HTTP

- **200**: Prueba exitosa
- **401**: Error de autenticación (solo para `/test/auth`)
- **500**: Error interno del servidor

## 🚨 Notas Importantes

1. **Rutas de prueba**: Estas rutas están diseñadas para desarrollo y testing. Considera deshabilitarlas en producción.
2. **Información sensible**: Algunas rutas pueden exponer información del servidor. Úsalas con cuidado.
3. **Rate limiting**: Considera agregar rate limiting a estas rutas si las usas en producción.
4. **Logs**: Las pruebas se registran en los logs de Laravel para debugging.

## 🔒 Seguridad

Para deshabilitar las rutas de prueba en producción, puedes:

1. **Usar middleware de entorno:**
```php
Route::middleware(['env:local,testing'])->group(function () {
    Route::get('/test', [TestController::class, 'basic']);
    // ... otras rutas de prueba
});
```

2. **Usar variables de entorno:**
```php
if (config('app.debug')) {
    Route::get('/test', [TestController::class, 'basic']);
}
```

3. **Comentar las rutas en producción:**
```php
// Solo descomentar en desarrollo
// Route::get('/test', [TestController::class, 'basic']);
```

