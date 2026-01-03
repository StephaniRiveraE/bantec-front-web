#!/bin/bash
# Script para actualizar la IP de la VM en DuckDNS automáticamente

DOMAIN=$1
TOKEN=$2

if [ -z "$DOMAIN" ] || [ -z "$TOKEN" ]; then
    echo "❌ Error: Falta DOMAIN o TOKEN."
    echo "Uso: ./update_duckdns.sh <domain> <token>"
    exit 1
fi

echo "🚀 Actualizando DuckDNS para el dominio: $DOMAIN..."

# Obtener la IP pública actual de la VM
IP=$(curl -s https://ifconfig.me)

if [ -z "$IP" ]; then
    echo "❌ Error: No se pudo obtener la IP pública de la VM."
    exit 1
fi

echo "📍 IP detectada: $IP"

# Llamada a la API de DuckDNS
RESULT=$(curl -s "https://www.duckdns.org/update?domains=$DOMAIN&token=$TOKEN&ip=$IP")

if [ "$RESULT" == "OK" ]; then
    echo "✅ DuckDNS actualizado exitosamente."
else
    echo "❌ Fallo al actualizar DuckDNS. Respuesta: $RESULT"
    exit 1
fi
