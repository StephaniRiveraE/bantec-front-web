#!/bin/bash
# Script para renovar certificados SSL automaticamente en Linux
# Uso: chmod +x renew-certs.sh && ./renew-certs.sh

set -e

echo "========================================="
echo "   RENOVACION AUTOMATICA DE CERTIFICADOS  "
echo "========================================="

# Paso 1: Obtener certificado
echo ""
echo "[PASO 1] Solicitando certificado a Lets Encrypt..."

# Intentamos ejecutar el comando. Si falla, el set -e detendra el script.
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot --force-renewal --email arcbank2@gmail.com -d bantec-bank.duckdns.org --agree-tos --non-interactive" certbot

echo "✅ Certificado obtenido/renovado correctamente."

# Paso 2: Recargar Nginx
echo ""
echo "[PASO 2] Recargando Nginx para aplicar cambios..."

docker-compose -f docker-compose.prod.yml exec nginx-proxy nginx -s reload

echo "✅ Nginx recargado. El nuevo certificado esta activo!"
echo ""
echo "Operacion Completada."
