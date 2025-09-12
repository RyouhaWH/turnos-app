#!/bin/bash

# Script para manejar el worker de colas de Laravel
# Uso: ./queue-worker.sh {start|stop|restart|status}

APP_DIR="/var/www/turnos-app"  # Cambia esta ruta por la de tu proyecto
PHP_BIN="/usr/bin/php"        # Ruta al PHP de tu servidor
WORKER_PID_FILE="/var/run/laravel-queue-worker.pid"
LOG_FILE="/var/log/laravel-queue-worker.log"

# Función para iniciar el worker
start_worker() {
    if [ -f "$WORKER_PID_FILE" ] && kill -0 $(cat "$WORKER_PID_FILE") 2>/dev/null; then
        echo "El worker de colas ya está ejecutándose (PID: $(cat $WORKER_PID_FILE))"
        return 1
    fi

    echo "Iniciando worker de colas..."
    cd "$APP_DIR"

    # Ejecutar el worker en background
    nohup $PHP_BIN artisan queue:work \
        --queue=default \
        --tries=3 \
        --timeout=60 \
        --memory=512 \
        --sleep=3 \
        --max-jobs=1000 \
        --max-time=3600 \
        >> "$LOG_FILE" 2>&1 &

    echo $! > "$WORKER_PID_FILE"
    echo "Worker iniciado con PID: $!"
    echo "Logs disponibles en: $LOG_FILE"
}

# Función para detener el worker
stop_worker() {
    if [ ! -f "$WORKER_PID_FILE" ]; then
        echo "El worker no está ejecutándose"
        return 1
    fi

    PID=$(cat "$WORKER_PID_FILE")
    if ! kill -0 "$PID" 2>/dev/null; then
        echo "El worker no está ejecutándose (PID file existe pero proceso no)"
        rm -f "$WORKER_PID_FILE"
        return 1
    fi

    echo "Deteniendo worker de colas (PID: $PID)..."
    kill -TERM "$PID"

    # Esperar hasta 30 segundos para que termine gracefully
    for i in {1..30}; do
        if ! kill -0 "$PID" 2>/dev/null; then
            echo "Worker detenido exitosamente"
            rm -f "$WORKER_PID_FILE"
            return 0
        fi
        sleep 1
    done

    # Si no termina, forzar terminación
    echo "Forzando terminación del worker..."
    kill -KILL "$PID"
    rm -f "$WORKER_PID_FILE"
    echo "Worker forzado a terminar"
}

# Función para reiniciar el worker
restart_worker() {
    echo "Reiniciando worker de colas..."
    stop_worker
    sleep 2
    start_worker
}

# Función para verificar el estado
status_worker() {
    if [ ! -f "$WORKER_PID_FILE" ]; then
        echo "Estado: NO EJECUTÁNDOSE"
        return 1
    fi

    PID=$(cat "$WORKER_PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
        echo "Estado: EJECUTÁNDOSE (PID: $PID)"
        echo "Logs: $LOG_FILE"
        return 0
    else
        echo "Estado: NO EJECUTÁNDOSE (PID file huérfano)"
        rm -f "$WORKER_PID_FILE"
        return 1
    fi
}

# Función para mostrar logs
show_logs() {
    if [ -f "$LOG_FILE" ]; then
        echo "=== Últimas 50 líneas del log ==="
        tail -50 "$LOG_FILE"
    else
        echo "No se encontró el archivo de log: $LOG_FILE"
    fi
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 {start|stop|restart|status|logs|help}"
    echo ""
    echo "Comandos:"
    echo "  start   - Iniciar el worker de colas"
    echo "  stop    - Detener el worker de colas"
    echo "  restart - Reiniciar el worker de colas"
    echo "  status  - Verificar el estado del worker"
    echo "  logs    - Mostrar los últimos logs"
    echo "  help    - Mostrar esta ayuda"
}

# Procesar argumentos
case "$1" in
    start)
        start_worker
        ;;
    stop)
        stop_worker
        ;;
    restart)
        restart_worker
        ;;
    status)
        status_worker
        ;;
    logs)
        show_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "Comando no válido: $1"
        show_help
        exit 1
        ;;
esac
