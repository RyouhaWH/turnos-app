# Ejemplos de Integración - Endpoint de Estado de Empleados

Este documento contiene ejemplos prácticos de cómo integrar el endpoint `/api/v1/employee-status-external` en diferentes plataformas y lenguajes.

---

## 🔧 Ejemplos por Lenguaje/Framework

### 1. JavaScript/Node.js

#### Ejemplo Básico con Fetch

```javascript
const apiKey = 'turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890';
const baseUrl = 'http://192.168.1.20:8000';

async function getEmployeeStatus(date = null) {
  const url = new URL(`${baseUrl}/api/v1/employee-status-external`);
  
  if (date) {
    url.searchParams.append('date', date);
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching employee status:', error);
    throw error;
  }
}

// Uso
getEmployeeStatus('2026-03-11')
  .then(data => {
    console.log(`Empleados trabajando: ${data.data.counts.trabajando.total}`);
    console.log(`Empleados en descanso: ${data.data.counts.descanso.total}`);
    console.log(`Empleados ausentes: ${data.data.counts.ausente.total}`);
  })
  .catch(error => console.error('Error:', error));
```

#### Ejemplo con Axios

```javascript
import axios from 'axios';

const apiKey = 'turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890';
const client = axios.create({
  baseURL: 'http://192.168.1.20:8000/api/v1',
  headers: {
    'X-API-Key': apiKey
  }
});

async function getEmployeeStatusAxios(date = null) {
  try {
    const response = await client.get('/employee-status-external', {
      params: date ? { date } : {}
    });
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Uso
await getEmployeeStatusAxios('2026-03-11');
```

#### Ejemplo en React

```javascript
import { useState, useEffect } from 'react';

function EmployeeStatus({ date = null }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_KEY = process.env.REACT_APP_API_KEY;
  const BASE_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const url = `${BASE_URL}/api/v1/employee-status-external`;
        const params = new URLSearchParams();
        if (date) params.append('date', date);

        const response = await fetch(`${url}?${params}`, {
          headers: {
            'X-API-Key': API_KEY
          }
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [date]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Estado de Empleados - {data.date}</h2>
      <p>Trabajando: {data.data.counts.trabajando.total}</p>
      <p>Descanso: {data.data.counts.descanso.total}</p>
      <p>Ausentes: {data.data.counts.ausente.total}</p>
      <p>Sin turno: {data.data.counts.sinTurno.total}</p>
    </div>
  );
}

export default EmployeeStatus;
```

---

### 2. Python

#### Ejemplo Básico

```python
import requests
from datetime import date

API_KEY = 'turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890'
BASE_URL = 'http://192.168.1.20:8000'

def get_employee_status(date_str=None):
    """Obtener estado de empleados"""
    url = f'{BASE_URL}/api/v1/employee-status-external'
    
    headers = {
        'X-API-Key': API_KEY,
        'Accept': 'application/json'
    }
    
    params = {}
    if date_str:
        params['date'] = date_str
    
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error: {e}')
        raise

# Uso
try:
    data = get_employee_status('2026-03-11')
    print(f"Trabajando: {data['data']['counts']['trabajando']['total']}")
    print(f"Descanso: {data['data']['counts']['descanso']['total']}")
except Exception as e:
    print(f"Error: {e}")
```

#### Ejemplo Avanzado con Caching

```python
import requests
import json
from datetime import date, timedelta
from functools import lru_cache

class EmployeeStatusClient:
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({'X-API-Key': api_key})
    
    def get_status(self, date_str=None, use_cache=True):
        """Obtener estado con caché opcional"""
        cache_key = f'status_{date_str}'
        
        # Intentar desde cache
        if use_cache and hasattr(self, '_cache'):
            if cache_key in self._cache:
                return self._cache[cache_key]
        else:
            self._cache = {}
        
        url = f'{self.base_url}/api/v1/employee-status-external'
        params = {'date': date_str} if date_str else {}
        
        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            self._cache[cache_key] = data
            return data
        except requests.exceptions.RequestException as e:
            print(f'Error: {e}')
            raise
    
    def get_employees_by_status(self, date_str=None):
        """Obtener resumen de empleados por estado"""
        data = self.get_status(date_str)
        return {
            'trabajando': data['data']['counts']['trabajando']['total'],
            'descanso': data['data']['counts']['descanso']['total'],
            'ausente': data['data']['counts']['ausente']['total'],
            'sin_turno': data['data']['counts']['sinTurno']['total']
        }

# Uso
client = EmployeeStatusClient(
    api_key='turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890',
    base_url='http://192.168.1.20:8000'
)

status = client.get_employees_by_status('2026-03-11')
print(f"Resumen: {status}")
```

#### Integración con Django

```python
# models.py
from django.db import models
from django.utils import timezone
import requests

class EmployeeStatusCache(models.Model):
    date = models.DateField()
    data = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('date',)

# services.py
class EmployeeStatusService:
    API_KEY = 'turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890'
    BASE_URL = 'http://192.168.1.20:8000'
    
    @classmethod
    def get_status(cls, date_str=None):
        """Obtener estado con caché en DB"""
        # Convertir a date si es string
        if date_str:
            date_obj = timezone.datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            date_obj = timezone.now().date()
        
        # Buscar en cache
        cache = EmployeeStatusCache.objects.filter(date=date_obj).first()
        if cache:
            return cache.data
        
        # Obtener de la API
        url = f'{cls.BASE_URL}/api/v1/employee-status-external'
        response = requests.get(url, headers={'X-API-Key': cls.API_KEY}, params={'date': str(date_obj)})
        
        if response.status_code == 200:
            data = response.json()
            # Guardar en cache
            EmployeeStatusCache.objects.update_or_create(
                date=date_obj,
                defaults={'data': data}
            )
            return data
        
        raise Exception(f'Error: {response.status_code}')

# views.py
from django.http import JsonResponse
from .services import EmployeeStatusService

def employee_status_view(request):
    date = request.GET.get('date')
    try:
        data = EmployeeStatusService.get_status(date)
        return JsonResponse(data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
```

---

### 3. PHP

#### Ejemplo Básico

```php
<?php

$apiKey = 'turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890';
$baseUrl = 'http://192.168.1.20:8000';
$date = $_GET['date'] ?? date('Y-m-d');

function getEmployeeStatus($apiKey, $baseUrl, $date) {
    $url = $baseUrl . '/api/v1/employee-status-external?date=' . urlencode($date);
    
    $options = [
        'http' => [
            'method' => 'GET',
            'header' => "X-API-Key: $apiKey\r\n"
        ]
    ];
    
    $context = stream_context_create($options);
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        return ['success' => false, 'error' => 'Error fetching data'];
    }
    
    return json_decode($response, true);
}

try {
    $data = getEmployeeStatus($apiKey, $baseUrl, $date);
    
    if ($data['success']) {
        echo json_encode([
            'date' => $data['date'],
            'trabajando' => $data['data']['counts']['trabajando']['total'],
            'descanso' => $data['data']['counts']['descanso']['total'],
            'ausente' => $data['data']['counts']['ausente']['total'],
            'sin_turno' => $data['data']['counts']['sinTurno']['total']
        ]);
    } else {
        http_response_code(400);
        echo json_encode(['error' => $data['message']]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
```

#### Ejemplo con cURL y Clases

```php
<?php

class TurnosApiClient {
    private $apiKey;
    private $baseUrl;
    private $ch;
    
    public function __construct($apiKey, $baseUrl) {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
        $this->ch = curl_init();
    }
    
    public function getEmployeeStatus($date = null) {
        $url = $this->baseUrl . '/api/v1/employee-status-external';
        
        if ($date) {
            $url .= '?date=' . urlencode($date);
        }
        
        curl_setopt_array($this->ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'X-API-Key: ' . $this->apiKey,
                'Accept: application/json'
            ]
        ]);
        
        $response = curl_exec($this->ch);
        $httpCode = curl_getinfo($this->ch, CURLINFO_HTTP_CODE);
        
        if ($httpCode !== 200) {
            throw new Exception("HTTP Error: $httpCode");
        }
        
        return json_decode($response, true);
    }
    
    public function __destruct() {
        curl_close($this->ch);
    }
}

// Uso
try {
    $client = new TurnosApiClient(
        'turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890',
        'http://192.168.1.20:8000'
    );
    
    $status = $client->getEmployeeStatus('2026-03-11');
    echo "Trabajando: " . $status['data']['counts']['trabajando']['total'];
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
```

---

### 4. C# / .NET

#### Ejemplo Básico

```csharp
using System;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;

class EmployeeStatusClient
{
    private readonly string apiKey = "turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890";
    private readonly string baseUrl = "http://192.168.1.20:8000";
    private readonly HttpClient httpClient;

    public EmployeeStatusClient()
    {
        httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Add("X-API-Key", apiKey);
    }

    public async Task<dynamic> GetEmployeeStatus(string date = null)
    {
        var url = $"{baseUrl}/api/v1/employee-status-external";
        
        if (date != null)
        {
            url += $"?date={Uri.EscapeDataString(date)}";
        }

        try
        {
            var response = await httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            return JsonConvert.DeserializeObject(content);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            throw;
        }
    }
}

// Uso
class Program
{
    static async Task Main()
    {
        var client = new EmployeeStatusClient();
        
        try
        {
            dynamic result = await client.GetEmployeeStatus("2026-03-11");
            Console.WriteLine($"Trabajando: {result.data.counts.trabajando.total}");
            Console.WriteLine($"Descanso: {result.data.counts.descanso.total}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}
```

---

### 5. cURL / Bash

#### Test Rápido

```bash
#!/bin/bash

API_KEY="turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890"
BASE_URL="http://192.168.1.20:8000"
DATE="2026-03-11"

# Petición GET simple
curl -X GET \
  "${BASE_URL}/api/v1/employee-status-external?date=${DATE}" \
  -H "X-API-Key: ${API_KEY}" \
  -H "Accept: application/json"

# Guardar respuesta en archivo
curl -X GET \
  "${BASE_URL}/api/v1/employee-status-external?date=${DATE}" \
  -H "X-API-Key: ${API_KEY}" \
  -o response.json

# Con pretty print
curl -X GET \
  "${BASE_URL}/api/v1/employee-status-external?date=${DATE}" \
  -H "X-API-Key: ${API_KEY}" | jq .
```

#### Script con Error Handling

```bash
#!/bin/bash

API_KEY="turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890"
BASE_URL="http://192.168.1.20:8000"
DATE="${1:-$(date +%Y-%m-%d)}"

echo "Obteniendo información de turnos para $DATE..."

RESPONSE=$(curl -s -X GET \
  "${BASE_URL}/api/v1/employee-status-external?date=${DATE}" \
  -H "X-API-Key: ${API_KEY}" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo "✓ Éxito!"
    echo "$BODY" | jq .
else
    echo "✗ Error HTTP: $HTTP_CODE"
    echo "$BODY" | jq .
    exit 1
fi
```

---

## 📊 Casos de Uso Comunes

### 1. Dashboard de Monitoreo

```javascript
// Actualizar dashboard cada 5 minutos
setInterval(async () => {
  const status = await getEmployeeStatus();
  updateDashboard(status.data);
}, 5 * 60 * 1000);
```

### 2. Notificación de Cambios

```python
import schedule
import time

def check_status_changes():
    current = get_employee_status()
    if has_significant_change(current):
        send_notification(current)

schedule.every(30).minutes.do(check_status_changes)

while True:
    schedule.run_pending()
    time.sleep(60)
```

### 3. Reportes Automáticos

```php
// Generar reporte mensual
function generateMonthlyReport($apiKey, $baseUrl, $month, $year) {
    $dates = getDatesInMonth($month, $year);
    $report = [];
    
    foreach ($dates as $date) {
        $data = getEmployeeStatus($apiKey, $baseUrl, $date->format('Y-m-d'));
        $report[] = [
            'date' => $date,
            'summary' => extractSummary($data)
        ];
    }
    
    return generatePDF($report);
}
```

---

## ⚠️ Consideraciones de Rendimiento

1. **Caché**: Implementa caché local para reducir llamadas API
2. **Paginación**: Aunque no está implementada, considera fragmentar datos grandes
3. **Compresión**: Usa `Accept-Encoding: gzip` en headers
4. **Reintentos**: Implementa reintentos con backoff exponencial en caso de error

---

## 🔒 Variables de Entorno

### .env (JavaScript/Node)
```
REACT_APP_API_KEY=turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890
REACT_APP_API_URL=http://192.168.1.20:8000
```

### .env (Python)
```python
API_KEY=turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890
API_URL=http://192.168.1.20:8000
```

### .env (PHP)
```
TURNOS_API_KEY=turnos_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx_1234567890
TURNOS_API_URL=http://192.168.1.20:8000
```

---

**Última actualización**: 11 de marzo de 2026
