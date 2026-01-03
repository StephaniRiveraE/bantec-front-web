#!/bin/bash
# fix_nginx_conf.sh
# Reemplaza el dominio en nginx.conf dinámicamente

CONF_FILE=$1
DOMAIN=$2

if [ -z "$CONF_FILE" ] || [ -z "$DOMAIN" ]; then
    echo "Uso: ./fix_nginx_conf.sh <archivo> <dominio>"
    exit 1
fi

echo "🔧 Configurando Nginx para el dominio: $DOMAIN"

# Reemplazar server_name y rutas de certificados
# Buscamos patrones como 'bantec-bank.duckdns.org' y los cambiamos por el nuevo dominio
sed -i "s/bantec-bank.duckdns.org/$DOMAIN/g" "$CONF_FILE"

echo "✅ nginx.conf actualizado."
