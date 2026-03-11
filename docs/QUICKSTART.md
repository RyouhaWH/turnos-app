# 🚀 Quick Start - Comenzar en 5 Minutos

Guía rápida para empezar a usar el endpoint de API Key.

---

## Para Administradores

### Paso 1: Crear una API Key

```bash
php artisan api-key:create
```

Responde las preguntas y copia la API Key generada.

### Paso 2: Probar el Endpoint

```bash
curl -H "X-API-Key: YOUR_API_KEY_HERE" \
  http://192.168.1.20:8000/api/v1/employee-status-external
```

**Listo!** 🎉

---

## Para Desarrolladores

### Instalación

El sistema está **listo para usar**. No hay instalación adicional.

### Obtener API Key

Solicita una API Key a tu administrador.

### Primer Test - JavaScript

```javascript
const API_KEY = 'YOUR_API_KEY';
const response = await fetch('/api/v1/employee-status-external', {
  headers: { 'X-API-Key': API_KEY }
});
const data = await response.json();
console.log(data);
```

### Primer Test - Python

```python
import requests

response = requests.get(
  'http://192.168.1.20:8000/api/v1/employee-status-external',
  headers={'X-API-Key': 'YOUR_API_KEY'}
)
print(response.json())
```

### Primer Test - cURL

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  http://192.168.1.20:8000/api/v1/employee-status-external
```

---

## Respuesta Típica

```json
{
  "success": true,
  "date": "2026-03-11",
  "data": {
    "counts": {
      "trabajando": {"total": 25},
      "descanso": {"total": 5},
      "ausente": {"total": 2},
      "sinTurno": {"total": 0}
    }
  }
}
```

---

## ¿Errores?

### "API Key no proporcionada"
→ Agrega el header `X-API-Key: YOUR_API_KEY`

### "API Key inválida"
→ Verifica que la API Key sea correcta

### Otros errores
→ Ver [`TESTING.md`](./TESTING.md) para troubleshooting

---

## 📚 Documentación Completa

- 📖 [API_KEY_EMPLOYEE_STATUS.md](./API_KEY_EMPLOYEE_STATUS.md) - Referencia completa
- 🔑 [MANAGING_API_KEYS.md](./MANAGING_API_KEYS.md) - Gestión de keys
- 💻 [INTEGRATION_EXAMPLES.md](./INTEGRATION_EXAMPLES.md) - Ejemplos por lenguaje
- 🧪 [TESTING.md](./TESTING.md) - Testing y verificación

---

## 🎯 Casos de Uso

**Para mostrar en pantalla pública**
```javascript
const status = await fetch('...', {headers: {'X-API-Key': 'key'}});
// Actualizar pantalla cada 5 minutos
setInterval(refreshDisplay, 5 * 60 * 1000);
```

**Para generar reportes**
```python
for date in date_range:
    data = get_status(date)
    save_to_report(data)
```

**Para notificaciones**
```php
if ($status['trabajando'] < $threshold) {
    sendAlert("Pocos empleados trabajando hoy");
}
```

---

¿Necesitas más ayuda? Consulta la documentación correspondiente.

**Última actualización**: 11 de marzo de 2026
