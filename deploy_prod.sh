#!/bin/bash

echo "🚀 Iniciando despliegue a PRODUCCIÓN..."

# 1. Bajar servicios anteriores (dev o prod)
echo "🛑 Deteniendo contenedores actuales..."
docker-compose down
docker-compose -f docker-compose.prod.yml down

# 2. Actualizar código (opcional, pero recomendado)
# echo "📥 Actualizando repositorio..."
# git pull origin main

# 3. Levantar entorno de producción
echo "🏗️ Construyendo y levantando servicios de PRODUCCIÓN..."
docker-compose -f docker-compose.prod.yml up -d --build

# 4. Mostrar estado
echo "✅ Despliegue completado. Estado actual:"
docker ps

echo "🌐 Tu banco debería estar accesible en: http://bantec-bank.duckdns.org (o HTTPS si ya tienes certs)"
