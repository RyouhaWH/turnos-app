#!/bin/bash

# Script de instalación para el worker de colas de Laravel
# Ejecutar como root o con sudo

set -e

echo "🚀 Instalando y configurando el worker de colas de Laravel..."

# Variables configurables
APP_DIR="/var/www/amzoma/current"
SERVICE_NAME="laravel-queue-worker"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Verificar que el directorio de la aplicación existe
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Error: El directorio de la aplicación no existe: $APP_DIR"
    echo "Por favor, actualiza la variable APP_DIR en este script"
    exit 1
fi

# Verificar que Laravel está instalado
if [ ! -f "$APP_DIR/artisan" ]; then
    echo "❌ Error: No se encontró el archivo artisan en $APP_DIR"
    echo "Asegúrate de que Laravel esté correctamente instalado"
    exit 1
fi

echo "📁 Directorio de la aplicación: $APP_DIR"

# 1. Hacer el script ejecutable
echo "🔧 Configurando permisos del script..."
chmod +x "$SCRIPT_DIR/queue-worker.sh"

# 2. Instalar el servicio de systemd
echo "⚙️  Instalando servicio de systemd..."

# Copiar el archivo de servicio
cp "$SCRIPT_DIR/laravel-queue-worker.service" "$SERVICE_FILE"

# Actualizar la ruta en el archivo de servicio
sed -i "s|/var/www/amzoma/current|$APP_DIR|g" "$SERVICE_FILE"

# Configurar el usuario correcto (detectar automáticamente)
WEB_USER=$(stat -c '%U' "$APP_DIR")
echo "👤 Usuario web detectado: $WEB_USER"
sed -i "s|User=www-data|User=$WEB_USER|g" "$SERVICE_FILE"
sed -i "s|Group=www-data|Group=$WEB_USER|g" "$SERVICE_FILE"

# Recargar systemd
systemctl daemon-reload

# 3. Verificar configuración de colas
echo "🔍 Verificando configuración de colas..."
cd "$APP_DIR"

# Verificar que las tablas de colas existen
if ! php artisan migrate:status | grep -q "jobs"; then
    echo "⚠️  Ejecutando migraciones de colas..."
    php artisan migrate --force
fi

# 4. Configurar logs
echo "📝 Configurando logs..."
mkdir -p /var/log
touch /var/log/laravel-queue-worker.log
chown $WEB_USER:$WEB_USER /var/log/laravel-queue-worker.log

# 5. Habilitar y iniciar el servicio
echo "🚀 Habilitando e iniciando el servicio..."
systemctl enable "$SERVICE_NAME"
systemctl start "$SERVICE_NAME"

# 6. Verificar que está funcionando
sleep 3
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ Servicio instalado y ejecutándose correctamente"
    echo ""
    echo "📊 Comandos útiles:"
    echo "  Ver estado:     systemctl status $SERVICE_NAME"
    echo "  Ver logs:       journalctl -u $SERVICE_NAME -f"
    echo "  Reiniciar:      systemctl restart $SERVICE_NAME"
    echo "  Detener:        systemctl stop $SERVICE_NAME"
    echo "  Iniciar:        systemctl start $SERVICE_NAME"
    echo ""
    echo "📈 Monitoreo:"
    echo "  Ver jobs:       php artisan queue:monitor"
    echo "  Ver fallos:     php artisan queue:failed"
    echo "  Limpiar fallos: php artisan queue:flush"
else
    echo "❌ Error: El servicio no se inició correctamente"
    echo "Verifica los logs con: journalctl -u $SERVICE_NAME -f"
    exit 1
fi

echo ""
echo "🎉 ¡Instalación completada exitosamente!"
echo "El worker de colas está ejecutándose y procesará automáticamente los jobs de WhatsApp."
