#!/bin/bash
# Script de emergencia para restaurar el acceso cuando Let's Encrypt falla por DNS
domains=(bantec-bank.duckdns.org)
path="/etc/letsencrypt/live/$domains"

echo "### Generando certificado de emergencia (Self-Signed) para $domains ..."
# Aseguramos que la carpeta exista (usando sudo si es necesario desde fuera)
mkdir -p "./nginx/certs/live/$domains"

# Generamos el certificado válido por 1 año
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:2048 -days 365\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=bantec-bank.duckdns.org'" certbot

echo "### Reiniciando Nginx ..."
docker-compose -f docker-compose.prod.yml up -d --force-recreate nginx-proxy

echo "✅ Listo. Tu sitio volverá a estar online (con advertencia de seguridad en el navegador)."
echo "   Puedes intentar correr './init_ssl.sh' mañana cuando el DNS de DuckDNS mejore."
