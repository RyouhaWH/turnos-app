# Guía: Gestión de API Keys

## 🔑 ¿Qué es una API Key?

Una API Key es una cadena única de caracteres que actúa como contraseña para autenticar peticiones a la API desde sistemas externos. A diferencia de las contraseñas de usuario, las API Keys:

- Son específicas para integración con sistema...
- Pueden desactivarse sin afectar las cuentas de usuario
- Pueden expirar automáticamente
- Registran cuándo fueron usadas por última vez
- No requieren autenticación de sesión en la aplicación

---

## 📦 Requisitos

- Acceso a línea de comandos (terminal/SSH)
- Permisos de administrador del sistema
- PHP y Laravel instalados

---

## 🚀 Crear una API Key

### Opción 1: Usando Artisan (Recomendado)

```bash
# Accede al servidor
ssh usuario@tuservidor.com

# Navega a la carpeta del proyecto
cd /ruta/a/turnos-app

# Ejecuta el comando
php artisan tinker
```

Dentro de tinker:
```php
$apiKey = \App\Models\ApiKey::create([
    'name' => 'Mi Sistema Externo',
    'key' => \App\Models\ApiKey::generateKey(),
    'description' => 'Descripción de para qué sirve esta API Key',
    'is_active' => true,
    'expired_at' => null
]);

echo $apiKey->key;  // Muestra la API Key generada
```

**Guarda la API Key en un lugar seguro. No podrás verla de nuevo.**

### Opción 2: Directamente en la Base de Datos

```sql
INSERT INTO api_keys (name, `key`, description, is_active, expired_at, created_at, updated_at)
VALUES (
    'Mi Sistema Externo',
    'turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890',
    'Descripción del uso',
    1,
    NULL,
    NOW(),
    NOW()
);
```

---

## 📋 Listar Todas las API Keys

```php
php artisan tinker

# Dentro de tinker:
\App\Models\ApiKey::all();

# Para una salida más legible:
\App\Models\ApiKey::select('id', 'name', 'key', 'is_active', 'expired_at', 'last_used_at')->get();
```

---

## 🔍 Ver Detalles de una API Key Específica

```php
php artisan tinker

# Por ID:
\App\Models\ApiKey::find(1);

# Por nombre:
\App\Models\ApiKey::where('name', 'Mi Sistema Externo')->first();

# Acceder a propiedades:
$apiKey = \App\Models\ApiKey::find(1);
echo $apiKey->name;
echo $apiKey->is_active;
echo $apiKey->last_used_at;
```

---

## 🔧 Modificar una API Key

### Desactivar una API Key

```php
$apiKey = \App\Models\ApiKey::find(1);
$apiKey->update(['is_active' => false]);

// O en una línea:
\App\Models\ApiKey::find(1)->update(['is_active' => false]);
```

### Reactivar una API Key

```php
\App\Models\ApiKey::find(1)->update(['is_active' => true]);
```

### Cambiar el nombre

```php
\App\Models\ApiKey::find(1)->update([
    'name' => 'Nuevo nombre'
]);
```

### Actualizar la descripción

```php
\App\Models\ApiKey::find(1)->update([
    'description' => 'Nueva descripción del uso'
]);
```

### Establecer una fecha de expiración

```php
// Expira en 3 meses
\App\Models\ApiKey::find(1)->update([
    'expired_at' => now()->addMonths(3)
]);

// Expira en una fecha específica
\App\Models\ApiKey::find(1)->update([
    'expired_at' => '2026-12-31 23:59:59'
]);

// Quitar expiración
\App\Models\ApiKey::find(1)->update([
    'expired_at' => null
]);
```

---

## 🗑️ Eliminar una API Key

```php
// Por ID:
\App\Models\ApiKey::find(1)->delete();

// Por nombre:
\App\Models\ApiKey::where('name', 'Mi Sistema Externo')->delete();

// Eliminar todas (¡cuidado!):
\App\Models\ApiKey::truncate();
```

---

## 📊 Monitorizar Uso de API Keys

### Ver cuándo fue usada por última vez

```php
$apiKey = \App\Models\ApiKey::find(1);
echo $apiKey->last_used_at;  // Ejemplo: 2026-03-11 14:30:45
```

### Listar todas las API Keys con su último uso

```php
\App\Models\ApiKey::select('id', 'name', 'is_active', 'last_used_at')
    ->orderBy('last_used_at', 'desc')
    ->get();
```

### Encontrar API Keys nunca usadas

```php
\App\Models\ApiKey::whereNull('last_used_at')->get();
```

### Encontrar API Keys expiradas

```php
\App\Models\ApiKey::where('expired_at', '<', now())->get();
```

---

## 🔐 Mejores Prácticas de Seguridad

### ✅ Haz esto:

1. **Almacena las API Keys de forma segura**
   - Usa variables de entorno en sistemas externos
   - Guárdalo en bóvedas de secretos (Vault, AWS Secrets Manager, etc.)
   - Nunca lo commits en GitHub o repositorios públicos

2. **Rota las API Keys regularmente**
   - Crea una nueva y desactiva la antigua
   - Especifica una fecha de expiración cuando sea posible

3. **Usa HTTPS siempre**
   - Las API Keys viajan en los headers/query
   - HTTPS encripta la comunicación

4. **Monitorea el uso**
   - Revisa regularmente el campo `last_used_at`
   - Detecta API Keys que no se están usando

5. **Limita los permisos**
   - En el futuro, podríamos limitar qué datos puede ver cada API Key
   - Usa API Keys diferentes para diferentes sistemas

### ❌ No hagas esto:

1. ❌ Compartir API Keys por email o chat sin encriptar
2. ❌ Guardarlas en archivos de configuración versionados
3. ❌ Usar la misma API Key para múltiples sistemas
4. ❌ Mostrar la API Key completa en logs o errores
5. ❌ Mantener API Keys activas sin usar durante años

---

## 📈 Escenarios de Uso Comunes

### Escenario 1: Sistema de Recursos Humanos Externo

```php
// Crear API Key para HR system
$apiKey = \App\Models\ApiKey::create([
    'name' => 'Sistema RH Externo',
    'key' => \App\Models\ApiKey::generateKey(),
    'description' => 'Integración con sistema de nómina y recursos humanos',
    'is_active' => true,
    'expired_at' => now()->addYear()  // Expira en 1 año
]);
```

### Escenario 2: Dashboard de Terceros

```php
// Crear API Key para dashboard externo
$apiKey = \App\Models\ApiKey::create([
    'name' => 'Dashboard Público',
    'key' => \App\Models\ApiKey::generateKey(),
    'description' => 'Mostrar estado de turnos en pantallas públicas',
    'is_active' => true,
    'expired_at' => now()->addMonths(3)  // Expira en 3 meses
]);
```

### Escenario 3: Testing y Desarrollo

```php
// Crear API Key temporal para testing
$apiKey = \App\Models\ApiKey::create([
    'name' => 'Testing - Developing',
    'key' => \App\Models\ApiKey::generateKey(),
    'description' => 'Uso temporal para testing de integraciones',
    'is_active' => true,
    'expired_at' => now()->addWeeks(1)  // Expira en 1 semana
]);
```

---

## 🐛 Solución de Problemas

### "API Key inválida"
- Verifica que la API Key sea exacta (sin espacios)
- Confirma que esté activa: `$apiKey->is_active`
- Verifica que no esté expirada: `$apiKey->expired_at`

### "API Key no proporcionada"
- Asegúrate de incluir el header `X-API-Key` o parámetro `?api_key=`
- Verifica que el header esté correctamente formateado

### No veo cambios después de actualizar una API Key
- Los cambios se guardan en tiempo real en la base de datos
- Recuerda que el middleware valida en cada petición

---

## 📞 Comando de Referencia Rápida

```bash
php artisan tinker

# Crear
$apiKey = \App\Models\ApiKey::create([
    'name' => 'Nombre',
    'key' => \App\Models\ApiKey::generateKey(),
    'description' => 'Descripción',
    'is_active' => true,
    'expired_at' => null
]);

# Listar
\App\Models\ApiKey::all();

# Ver detalles
\App\Models\ApiKey::find(1);

# Desactivar
\App\Models\ApiKey::find(1)->update(['is_active' => false]);

# Eliminar
\App\Models\ApiKey::find(1)->delete();

# Ver último uso
\App\Models\ApiKey::find(1)->last_used_at;

# Salir
exit
```

---

## 📚 Documentación Relacionada

- [Documentación del Endpoint](./API_KEY_EMPLOYEE_STATUS.md)
- [API Reference](./API_REFERENCE.md) (si existe)

---

**Última actualización**: 11 de marzo de 2026
