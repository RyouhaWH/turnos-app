# 🧪 Guía de Pruebas WhatsApp

Esta guía te muestra cómo probar el sistema de WhatsApp en local sin enviar mensajes reales a las personas.

## 🎯 Opciones de Prueba

### 1. **Modo Automático (Recomendado)**
El sistema detecta automáticamente si estás en local y activa el modo de prueba:

```bash
# En local, automáticamente envía solo a tu número de prueba
php artisan serve
```

### 2. **Variables de Entorno**
Agrega estas variables a tu archivo `.env`:

```env
# Activar modo de prueba
WHATSAPP_TEST_MODE=true

# Tu número de teléfono para pruebas (sin +56)
WHATSAPP_TEST_NUMBER=951004035

# Solo logear, no enviar mensajes (opcional)
WHATSAPP_LOG_ONLY=false
```

### 3. **Comando de Prueba**
Usa el comando Artisan para probar manualmente:

```bash
# Prueba básica
php artisan whatsapp:test

# Prueba con número específico
php artisan whatsapp:test --number=987654321

# Prueba con mensaje personalizado
php artisan whatsapp:test --message="Hola, esto es una prueba"

# Solo simular (no enviar)
php artisan whatsapp:test --dry-run

# Listar todos los destinatarios
php artisan whatsapp:test --list-recipients
```

### 4. **Prueba Dinámica desde la Web**
Agrega `?test_mode=true` a la URL cuando modifiques turnos:

```
http://localhost:8000/shifts/createv3?test_mode=true
```

## 📱 Qué Recibirás en Modo Prueba

Cuando actives el modo de prueba, recibirás un mensaje como este:

```
🧪 MODO PRUEBA - WhatsApp

📋 Destinatarios que recibirían el mensaje:
• 964949887
• 981841759
• 975952121
• 985639782
• 987654321 (empleado)

📱 Mensaje original:
Se *Autoriza* el turno de: *Juan Pérez* _siendo modificado_ los días:
• *15/01/2025* de "*Mañana*" a "*Tarde*"
• *16/01/2025* de "*Franco*" a "*Noche*"
```

## 🔧 Configuración del Servicio WhatsApp

Asegúrate de que el servicio WhatsApp esté ejecutándose:

```bash
# El servicio debe estar en localhost:3001
# Verifica que esté funcionando
curl http://localhost:3001/health
```

## 📊 Logs de Prueba

Los logs se guardan en `storage/logs/laravel.log`:

```bash
# Ver logs en tiempo real
tail -f storage/logs/laravel.log | grep "🧪"

# Buscar logs de WhatsApp
grep "WhatsApp" storage/logs/laravel.log
```

## 🚀 Flujo de Prueba Completo

1. **Configurar variables de entorno:**
   ```env
   WHATSAPP_TEST_MODE=true
   WHATSAPP_TEST_NUMBER=tu_numero
   ```

2. **Probar comando:**
   ```bash
   php artisan whatsapp:test --dry-run
   ```

3. **Probar desde la web:**
   - Ir a `http://localhost:8000/shifts/createv3`
   - Modificar un turno
   - Verificar que recibes el mensaje de prueba

4. **Verificar logs:**
   ```bash
   tail -f storage/logs/laravel.log
   ```

## 🛡️ Modo de Producción

Para desactivar el modo de prueba en producción:

```env
WHATSAPP_TEST_MODE=false
APP_ENV=production
```

## 🔍 Troubleshooting

### Error: "Connection refused"
- Verifica que el servicio WhatsApp esté ejecutándose en `localhost:3001`
- Revisa los logs del servicio

### No recibes mensajes
- Verifica que `WHATSAPP_TEST_NUMBER` esté configurado correctamente
- Revisa los logs de Laravel
- Usa `--dry-run` para simular sin enviar

### Mensajes se envían a todos
- Verifica que `WHATSAPP_TEST_MODE=true` esté en tu `.env`
- Asegúrate de que `APP_ENV=local`

## 📝 Ejemplos de Uso

### Prueba Rápida
```bash
php artisan whatsapp:test --number=987654321 --message="Prueba rápida"
```

### Prueba Completa
```bash
# 1. Listar destinatarios
php artisan whatsapp:test --list-recipients

# 2. Simular envío
php artisan whatsapp:test --dry-run

# 3. Enviar prueba real
php artisan whatsapp:test --number=tu_numero
```

### Prueba desde Web
1. Ir a `http://localhost:8000/shifts/createv3?test_mode=true`
2. Modificar un turno
3. Verificar mensaje recibido

## 🎉 ¡Listo!

Con estas opciones puedes probar completamente el sistema de WhatsApp sin molestar a las personas reales. El sistema es inteligente y detecta automáticamente cuándo estás en modo de desarrollo.
