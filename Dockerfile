FROM richarvey/nginx-php-fpm:3.1.6

# Establece el directorio web correctamente
ENV WEBROOT=/var/www/html/public
WORKDIR /var/www/html

# Copia tu proyecto al contenedor
COPY . /var/www/html

# (Opcional) Ejecuta Composer si no usas SKIP_COMPOSER
ENV COMPOSER_ALLOW_SUPERUSER=1
ENV SKIP_COMPOSER=0

# Laravel env vars
ENV APP_ENV=production
ENV APP_DEBUG=false
ENV LOG_CHANNEL=stderr

# Laravel storage fix (evita errores de permisos)
RUN chmod -R 777 /var/www/html/storage /var/www/html/bootstrap/cache

# Usa el script de arranque de la imagen
CMD ["/start.sh"]
