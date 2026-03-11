# Testing y Verificación del Endpoint

Guía para probar y verificar que el endpoint de API Key funciona correctamente.

---

## ✅ Checklist de Verificación

### 1. Verificar Instalación

```bash
# Navega a la carpeta del proyecto
cd /ruta/a/turnos-app

# Verifica que las migraciones se ejecutaron
php artisan migrate:status | grep api_keys

# Verifica que el modelo existe
php artisan tinker
> \App\Models\ApiKey::all()
> exit
```

### 2. Crear una API Key de Prueba

```bash
# Opción 1: Usando el comando artisan (recomendado)
php artisan api-key:create --name="Testing" --description="Para pruebas del endpoint"

# Opción 2: Manual con tinker
php artisan tinker
> $apiKey = \App\Models\ApiKey::create(['name' => 'Testing', 'key' => \App\Models\ApiKey::generateKey(), 'description' => 'Prueba', 'is_active' => true])
> echo $apiKey->key;  # Copia este valor
> exit
```

---

## 🧪 Pruebas Locales

### Test 1: Verificar Que el Endpoint Existe

```bash
# Sin API Key (debe fallar con 401)
curl http://192.168.1.20:8000/api/v1/employee-status-external

# Respuesta esperada:
# {"success":false,"message":"API Key no proporcionada",...}
```

### Test 2: Con API Key Válida (Hoy)

```bash
API_KEY="turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890"  # Reemplaza con tu API Key

curl -X GET \
  "http://192.168.1.20:8000/api/v1/employee-status-external" \
  -H "X-API-Key: $API_KEY"
```

**Respuesta esperada**: JSON con status:true y datos de empleados

### Test 3: Con API Key Válida y Fecha Específica

```bash
API_KEY="turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890"

curl -X GET \
  "http://192.168.1.20:8000/api/v1/employee-status-external?date=2026-03-11" \
  -H "X-API-Key: $API_KEY" | jq .
```

### Test 4: API Key Inválida (Debe Fallar)

```bash
curl -X GET \
  "http://192.168.1.20:8000/api/v1/employee-status-external" \
  -H "X-API-Key: invalid_key_12345"
```

**Respuesta esperada**: `{"success":false,"message":"API Key inválida"}`

### Test 5: API Key Como Parámetro Query

```bash
API_KEY="turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890"

curl "http://192.168.1.20:8000/api/v1/employee-status-external?api_key=$API_KEY&date=2026-03-11"
```

---

## 🔍 Testing con Postman

### 1. Crear Collection en Postman

**Request**: GET /api/v1/employee-status-external

**Headers**:
| Key | Value |
|-----|-------|
| X-API-Key | `{{api_key}}` |
| Accept | application/json |

**Query Params**:
| Key | Value |
|-----|-------|
| date | `{{date}}` |

**Variables de Collection**:
```json
{
  "api_key": "turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890",
  "base_url": "http://192.168.1.20:8000",
  "date": "2026-03-11"
}
```

---

## 🧬 Testing con Resto Client (VS Code)

Archivo: `test-api-key.rest`

```rest
### Test 1: Con API Key válida
GET http://192.168.1.20:8000/api/v1/employee-status-external?date=2026-03-11
X-API-Key: turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890

### Test 2: Sin API Key (debe fallar)
GET http://192.168.1.20:8000/api/v1/employee-status-external

### Test 3: API Key inválida (debe fallar)
GET http://192.168.1.20:8000/api/v1/employee-status-external
X-API-Key: invalid_key

### Test 4: Con API Key en query parameter
GET http://192.168.1.20:8000/api/v1/employee-status-external?api_key=turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890&date=2026-03-11
```

---

## 📝 Testing Automatizado

### Script en Bash

```bash
#!/bin/bash

API_KEY="turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890"
BASE_URL="http://192.168.1.20:8000"
TESTS_PASSED=0
TESTS_FAILED=0

echo "=========================================="
echo "Testing Endpoint /api/v1/employee-status-external"
echo "=========================================="
echo ""

# Test 1: Sin API Key
echo "Test 1: Sin API Key (debe fallar con 401)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/v1/employee-status-external")
if [ "$HTTP_CODE" == "401" ]; then
    echo "✓ PASS: Retornó 401"
    ((TESTS_PASSED++))
else
    echo "✗ FAIL: Retornó $HTTP_CODE (esperado 401)"
    ((TESTS_FAILED++))
fi
echo ""

# Test 2: Con API Key válida
echo "Test 2: Con API Key válida (hoy)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "$BASE_URL/api/v1/employee-status-external" \
  -H "X-API-Key: $API_KEY")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" == "200" ]; then
    if echo "$BODY" | jq -e '.success' > /dev/null 2>&1; then
        echo "✓ PASS: Retornó 200 con JSON válido"
        echo "  Respuesta sample:"
        echo "$BODY" | jq '.date, .data.counts' | head -5
        ((TESTS_PASSED++))
    else
        echo "✗ FAIL: JSON inválido"
        ((TESTS_FAILED++))
    fi
else
    echo "✗ FAIL: Retornó $HTTP_CODE (esperado 200)"
    ((TESTS_FAILED++))
fi
echo ""

# Test 3: Con fecha específica
echo "Test 3: Con fecha específica"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/v1/employee-status-external?date=2026-03-10" \
  -H "X-API-Key: $API_KEY")

if [ "$HTTP_CODE" == "200" ]; then
    echo "✓ PASS: Retornó 200"
    ((TESTS_PASSED++))
else
    echo "✗ FAIL: Retornó $HTTP_CODE"
    ((TESTS_FAILED++))
fi
echo ""

# Test 4: API Key inválida
echo "Test 4: API Key inválida (debe fallar con 401)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/v1/employee-status-external" \
  -H "X-API-Key: invalid_key_xyz")

if [ "$HTTP_CODE" == "401" ]; then
    echo "✓ PASS: Retornó 401"
    ((TESTS_PASSED++))
else
    echo "✗ FAIL: Retornó $HTTP_CODE"
    ((TESTS_FAILED++))
fi
echo ""

# Test 5: API Key en query parameter
echo "Test 5: API Key como query parameter"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  "$BASE_URL/api/v1/employee-status-external?api_key=$API_KEY")

if [ "$HTTP_CODE" == "200" ]; then
    echo "✓ PASS: Retornó 200"
    ((TESTS_PASSED++))
else
    echo "✗ FAIL: Retornó $HTTP_CODE"
    ((TESTS_FAILED++))
fi
echo ""

# Resumen
echo "=========================================="
echo "Resumen de Pruebas"
echo "=========================================="
echo "Pasaron: $TESTS_PASSED"
echo "Fallaron: $TESTS_FAILED"
echo "Total: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✓ Todas las pruebas pasaron!"
    exit 0
else
    echo "✗ Algunas pruebas fallaron"
    exit 1
fi
```

**Guardar como**: `test-api.sh`

**Ejecutar**:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🔐 Testing con Seguridad

### Verificar Registro de Acceso

```php
php artisan tinker

# Ver las últimas API Keys usadas
\App\Models\ApiKey::orderBy('last_used_at', 'desc')->get(['name', 'last_used_at']);

# Ver con más detalle
$apiKey = \App\Models\ApiKey::find(1);
echo $apiKey->last_used_at;  # Debe actualizar con cada uso
```

### Verificar Expiración

```php
php artisan tinker

# Crear API Key que expira mañana
$apiKey = \App\Models\ApiKey::create([
    'name' => 'Test - Expires Tomorrow',
    'key' => 'test_' . \Illuminate\Support\Str::random(32),
    'expired_at' => now()->addDay(),
    'is_active' => true
]);

# Probar (debe funcionar)
curl -H "X-API-Key: TEST_KEY" http://192.168.1.20:8000/api/v1/employee-status-external

# Cambiar expiración al pasado
$apiKey->update(['expired_at' => now()->subDay()]);

# Probar de nuevo (debe fallar con 401)
curl -H "X-API-Key: TEST_KEY" http://192.168.1.20:8000/api/v1/employee-status-external
```

---

## 📊 Testing de Rendimiento

### Prueba de Carga con Apache Bench

```bash
API_KEY="turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890"
BASE_URL="http://192.168.1.20:8000"

# 100 peticiones, 10 concurrentes
ab -n 100 -c 10 \
  -H "X-API-Key: $API_KEY" \
  "$BASE_URL/api/v1/employee-status-external?date=2026-03-11"
```

### Prueba de Carga con wrk

```bash
#!/bin/bash

API_KEY="turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890"

wrk -t4 -c40 -d30s \
  -H "X-API-Key: $API_KEY" \
  http://192.168.1.20:8000/api/v1/employee-status-external
```

---

## 🚀 Testing en Producción

### Verificación Pre-Despliegue

```bash
# 1. HTTPS está habilitado
curl -I https://tu-dominio.com/
# Debe mostrar "HTTP/2 200" o similar

# 2. Endpoint accesible desde internet
API_KEY="your_production_key"
curl -H "X-API-Key: $API_KEY" \
  https://tu-dominio.com/api/v1/employee-status-external

# 3. Certificado SSL válido
openssl s_client -connect tu-dominio.com:443
```

---

## 📋 Checklist Final

- [ ] Las migraciones se ejecutaron correctamente
- [ ] El modelo ApiKey fue creado
- [ ] El middleware ValidateApiKey fue registrado
- [ ] Las rutas están registradas en routes/api.php
- [ ] Puedo crear una API Key sin errores
- [ ] El endpoint retorna 401 sin API Key
- [ ] El endpoint retorna 200 con API Key válida
- [ ] El endpoint retorna 401 con API Key inválida
- [ ] La API Key se puede enviar en header y query parameter
- [ ] El campo last_used_at se actualiza con cada uso
- [ ] Las API Keys expiradas retornan 401
- [ ] Las respuestas tienen la estructura JSON esperada
- [ ] La documentación está en la carpeta `/docs`

---

## 🆘 Troubleshooting

### Error: "Middleware not found"
```
Solución: Asegúrate de que ValidateApiKey esté registrado en bootstrap/app.php
```

### Error: "Class ApiKey not found"
```
Solución: Verifica que el modelo esté en app/Models/ApiKey.php
Ejecuta: composer dumpautoload
```

### Error: "Table api_keys doesn't exist"
```
Solución: Ejecuta las migraciones
php artisan migrate
```

### Las API Keys no se crean
```
Solución: Verifica que tengas permisos de escritura en la base de datos
```

---

**Última actualización**: 11 de marzo de 2026
