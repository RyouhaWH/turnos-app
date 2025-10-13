# 🚀 Inicio Rápido - API de Autenticación

## Pasos para Comenzar

### 1. Verificar que la API esté funcionando

```bash
curl http://localhost:8000/api/test
```

**Respuesta esperada:**
```json
{
    "success": true,
    "message": "API funcionando correctamente",
    "timestamp": "2025-10-10T..."
}
```

---

### 2. Registrar un nuevo usuario

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

**Respuesta esperada:**
```json
{
    "success": true,
    "message": "Usuario registrado exitosamente",
    "data": {
        "user": {
            "id": 1,
            "name": "Test User",
            "email": "test@example.com",
            ...
        },
        "access_token": "1|AbCdEfGh...",
        "token_type": "Bearer"
    }
}
```

**💡 Guarda el `access_token` para los siguientes pasos!**

---

### 3. Iniciar sesión

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

### 4. Obtener información del usuario autenticado

Reemplaza `TU_TOKEN` con el token obtenido en el paso anterior:

```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Accept: application/json" \
  -H "Authorization: Bearer TU_TOKEN"
```

---

### 5. Acceder a rutas protegidas

```bash
curl -X GET http://localhost:8000/api/v1/items \
  -H "Accept: application/json" \
  -H "Authorization: Bearer TU_TOKEN"
```

---

### 6. Cerrar sesión

```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -H "Accept: application/json" \
  -H "Authorization: Bearer TU_TOKEN"
```

---

## Importar Colección en Postman

1. Abre Postman
2. Click en "Import"
3. Selecciona el archivo `API_POSTMAN_COLLECTION.json`
4. Configura la variable `base_url` con tu URL (ej: `http://localhost:8000/api`)
5. Ejecuta la petición "Login" - el token se guardará automáticamente
6. Prueba las demás peticiones

---

## Endpoints Disponibles

### 🔓 Públicos (No requieren autenticación)
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/test` - Verificar que la API funciona

### 🔒 Protegidos (Requieren token)
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/logout-all` - Cerrar todas las sesiones
- `POST /api/auth/refresh` - Renovar token
- `POST /api/auth/change-password` - Cambiar contraseña
- `GET /api/v1/*` - Todas las rutas de la versión 1 de la API

---

## Solución de Problemas

### Error: "Unauthenticated"
- Verifica que el token esté en el header `Authorization: Bearer TU_TOKEN`
- Asegúrate de que el token sea válido (no haya expirado)

### Error: "Credenciales incorrectas"
- Verifica email y password
- Asegúrate de que el usuario esté registrado

### Error: "Usuario inactivo"
- El usuario debe tener `activo = true` en la base de datos

### Error: CORS
- Si estás haciendo peticiones desde un frontend en otro dominio, configura CORS en `config/cors.php`

---

## Próximos Pasos

📖 Lee la documentación completa en `API_AUTHENTICATION.md` para:
- Ver todos los endpoints disponibles
- Ejemplos en JavaScript, React, PHP, Python
- Mejores prácticas de seguridad
- Manejo de errores

🧪 Prueba la API con:
- Postman (importa `API_POSTMAN_COLLECTION.json`)
- Thunder Client (VS Code)
- Tu aplicación frontend

---

**¡Listo para usar! 🎉**


