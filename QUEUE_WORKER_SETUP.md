# Configuración del Worker de Colas - Laravel

## 📋 Resumen

Este documento explica cómo configurar y mantener el worker de colas de Laravel para procesar los jobs de WhatsApp de forma asíncrona en producción.

## 🚀 Instalación Rápida

### Opción 1: Instalación Automática (Recomendada)

```bash
# 1. Subir los archivos al servidor
scp scripts/install-queue-worker.sh user@servidor:/tmp/
scp scripts/queue-worker.sh user@servidor:/tmp/
scp scripts/laravel-queue-worker.service user@servidor:/tmp/

# 2. Ejecutar en el servidor
ssh user@servidor
sudo bash /tmp/install-queue-worker.sh
```

### Opción 2: Instalación Manual

```bash
# 1. Copiar archivos
sudo cp scripts/laravel-queue-worker.service /etc/systemd/system/
sudo cp scripts/queue-worker.sh /usr/local/bin/

# 2. Configurar permisos
sudo chmod +x /usr/local/bin/queue-worker.sh
sudo chmod 644 /etc/systemd/system/laravel-queue-worker.service

# 3. Habilitar servicio
sudo systemctl daemon-reload
sudo systemctl enable laravel-queue-worker
sudo systemctl start laravel-queue-worker
```

## ⚙️ Configuración

### Variables de Entorno (.env)

```bash
QUEUE_CONNECTION=database
DB_QUEUE_TABLE=jobs
DB_QUEUE=default
DB_QUEUE_RETRY_AFTER=90
QUEUE_FAILED_DRIVER=database-uuids
```

### Parámetros del Worker

- `--queue=default`: Procesa la cola por defecto
- `--tries=3`: Reintenta hasta 3 veces en caso de fallo
- `--timeout=60`: Timeout de 60 segundos por job
- `--memory=512`: Límite de memoria de 512MB
- `--sleep=3`: Espera 3 segundos entre jobs
- `--max-jobs=1000`: Reinicia después de 1000 jobs
- `--max-time=3600`: Reinicia después de 1 hora

## 📊 Comandos de Monitoreo

### Estado del Servicio

```bash
# Ver estado del servicio
sudo systemctl status laravel-queue-worker

# Ver logs en tiempo real
sudo journalctl -u laravel-queue-worker -f

# Ver logs de las últimas 100 líneas
sudo journalctl -u laravel-queue-worker -n 100
```

### Gestión del Servicio

```bash
# Iniciar servicio
sudo systemctl start laravel-queue-worker

# Detener servicio
sudo systemctl stop laravel-queue-worker

# Reiniciar servicio
sudo systemctl restart laravel-queue-worker

# Habilitar inicio automático
sudo systemctl enable laravel-queue-worker

# Deshabilitar inicio automático
sudo systemctl disable laravel-queue-worker
```

### Monitoreo de Colas

```bash
# Ver jobs en cola
php artisan queue:monitor

# Ver jobs fallidos
php artisan queue:failed

# Reintentar jobs fallidos
php artisan queue:retry all

# Limpiar jobs fallidos
php artisan queue:flush

# Ver estadísticas de la base de datos
php artisan queue:work --once --verbose
```

### Script de Supervisión

```bash
# Usar el script personalizado
./scripts/queue-worker.sh status
./scripts/queue-worker.sh start
./scripts/queue-worker.sh stop
./scripts/queue-worker.sh restart
./scripts/queue-worker.sh logs
```

## 🔧 Mantenimiento

### Limpieza Regular

```bash
# Limpiar jobs fallidos antiguos (ejecutar semanalmente)
php artisan queue:flush

# Limpiar jobs completados (opcional, si usas Redis)
# redis-cli FLUSHDB
```

### Monitoreo de Recursos

```bash
# Ver uso de memoria del worker
ps aux | grep "queue:work"

# Ver logs de errores
tail -f /var/log/laravel-queue-worker.log

# Verificar espacio en disco
df -h
```

### Reinicio Programado

Para reiniciar el worker automáticamente cada día a las 2 AM:

```bash
# Agregar a crontab
sudo crontab -e

# Agregar esta línea:
0 2 * * * systemctl restart laravel-queue-worker
```

## 🚨 Solución de Problemas

### El Worker No Inicia

1. Verificar permisos:
```bash
sudo chown -R www-data:www-data /var/www/turnos-app
sudo chmod -R 755 /var/www/turnos-app
```

2. Verificar configuración:
```bash
php artisan config:cache
php artisan route:cache
```

3. Verificar logs:
```bash
sudo journalctl -u laravel-queue-worker -n 50
```

### Jobs No Se Procesan

1. Verificar que el worker está ejecutándose:
```bash
sudo systemctl status laravel-queue-worker
```

2. Verificar la tabla de jobs:
```bash
php artisan tinker
>>> DB::table('jobs')->count()
```

3. Verificar jobs fallidos:
```bash
php artisan queue:failed
```

### Alto Uso de Memoria

1. Reducir `--max-jobs` en el servicio
2. Reducir `--memory` en el servicio
3. Aumentar `--max-time` para reiniciar más frecuentemente

## 📈 Optimización

### Para Alto Volumen

```bash
# Ejecutar múltiples workers
sudo systemctl start laravel-queue-worker@1
sudo systemctl start laravel-queue-worker@2
sudo systemctl start laravel-queue-worker@3
```

### Para Bajo Volumen

```bash
# Configurar con menos recursos
--memory=256 --max-jobs=500 --max-time=1800
```

## 🔒 Seguridad

- El worker se ejecuta con el usuario web (www-data)
- Los logs se almacenan en `/var/log/`
- Los jobs fallidos se almacenan en la base de datos
- No exponer información sensible en los logs

## 📞 Soporte

Si encuentras problemas:

1. Revisar logs del sistema: `sudo journalctl -u laravel-queue-worker`
2. Revisar logs de Laravel: `tail -f storage/logs/laravel.log`
3. Verificar configuración: `php artisan config:show queue`
4. Probar manualmente: `php artisan queue:work --once --verbose`
