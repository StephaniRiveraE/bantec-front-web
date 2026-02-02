#!/bin/bash
echo "========================================="
echo "   RENOVACION FORZADA SSL (LINUX VM)     "
echo "========================================="

# 1. Solicitar Certificado Real
echo ""
echo "[1/2] Solicitando certificado a Let's Encrypt..."
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
  --force-renewal \
  --email vinueza.hector.ivan@gmail.com \
  -d bantec-bank.duckdns.org \
  --agree-tos \
  --non-interactive" certbot

if [ $? -eq 0 ]; then
    echo "✅ Certificado obtenido correctamente."
    
    # 2. Recargar Nginx
    echo ""
    echo "[2/2] Recargando Nginx..."
    docker-compose -f docker-compose.prod.yml exec nginx-proxy nginx -s reload
    echo "✅ Nginx recargado."
    echo "🚀 Tu sitio debería ser seguro ahora."
else
    echo "❌ Error obteniendo el certificado. Verifica los logs."
    exit 1
fi
