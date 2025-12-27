# Guía de Despliegue de BANTEC en Google Cloud VM

## Información de las VMs

| VM | IP Externa | IP Interna | Propósito |
|---|---|---|---|
| **vmbantec** | `35.209.225.8` | `10.128.0.7` | Banco BANTEC (Microservicios) |
| **vmdigiconecu** | `35.208.155.21` | `10.128.0.8` | Switch Interbancario |

---

## 1. Preparación de la VM (vmbantec)

### 1.1 Conectarse a la VM
```bash
gcloud compute ssh vmbantec --zone=us-central1-c
```

### 1.2 Instalar Docker y Docker Compose
```bash
# Actualizar sistema
sudo apt-get update
sudo apt-get upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version
```

### 1.3 Configurar Firewall en Google Cloud
```bash
# Permitir tráfico HTTP/HTTPS
gcloud compute firewall-rules create allow-http-https \
  --allow tcp:80,tcp:443,tcp:8443 \
  --source-ranges 0.0.0.0/0 \
  --target-tags http-server,https-server

# Permitir puertos de microservicios (para debugging)
gcloud compute firewall-rules create allow-microservices \
  --allow tcp:8080-8083 \
  --source-ranges 0.0.0.0/0
```

---

## 2. Clonar el Proyecto

```bash
# Instalar Git
sudo apt-get install git -y

# Clonar repositorio
git clone https://github.com/AlisonTamayo/BnacoBantec.git
cd BnacoBantec
```

---

## 3. Configurar Certificados SSL

### 3.1 Generar Certificados con Let's Encrypt (Producción)
```bash
# Instalar Certbot
sudo apt-get install certbot -y

# Generar certificados
sudo certbot certonly --standalone \
  -d bantec.35-209-225-8.sslip.io \
  --email tu-email@ejemplo.com \
  --agree-tos \
  --non-interactive

# Copiar certificados al proyecto
sudo mkdir -p nginx/certs
sudo cp /etc/letsencrypt/live/bantec.35-209-225-8.sslip.io/fullchain.pem nginx/certs/
sudo cp /etc/letsencrypt/live/bantec.35-209-225-8.sslip.io/privkey.pem nginx/certs/
sudo chown -R $USER:$USER nginx/certs
```

### 3.2 Certificados de Desarrollo (Autofirmados)
```bash
# Si no tienes dominio, usar certificados autofirmados
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/privkey.pem \
  -out nginx/certs/fullchain.pem \
  -subj "/C=EC/ST=Pichincha/L=Quito/O=Bantec/CN=35.209.225.8"
```

---

## 4. Configurar mTLS para el Switch (Opcional)

### 4.1 Generar Certificados mTLS
```bash
# Ejecutar script de generación
chmod +x generate-mtls-certs.sh
./generate-mtls-certs.sh
```

### 4.2 Enviar Certificado al Switch
```bash
# El archivo bantec.crt debe enviarse al equipo de DIGICONECU
cat ms-transaccion/src/main/resources/certs/bantec.crt
```

### 4.3 Recibir Certificado del Switch
```bash
# Una vez recibido el certificado del Switch (switch.crt), agregarlo al truststore
keytool -import -alias digiconecu \
  -file switch.crt \
  -keystore ms-transaccion/src/main/resources/certs/bantec-truststore.p12 \
  -storepass bantec123
```

### 4.4 Habilitar mTLS en Producción
Editar `docker-compose.prod.yml` y agregar:
```yaml
ms-transaccion:
  environment:
    MTLS_ENABLED: "true"
    MTLS_KEYSTORE_PASSWORD: "bantec123"
    MTLS_TRUSTSTORE_PASSWORD: "bantec123"
```

---

## 5. Desplegar con Docker Compose

### 5.1 Despliegue de Producción
```bash
# Construir y levantar todos los servicios
docker-compose -f docker-compose.prod.yml up --build -d

# Ver logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f

# Ver logs de un servicio específico
docker-compose -f docker-compose.prod.yml logs -f ms-transaccion
```

### 5.2 Verificar Estado de los Servicios
```bash
# Ver contenedores corriendo
docker ps

# Ver uso de recursos
docker stats

# Verificar salud de las bases de datos
docker exec db-cuentas-bantec pg_isready -U postgres
docker exec db-clientes-bantec pg_isready -U postgres
docker exec db-transacciones-bantec pg_isready -U postgres
```

---

## 6. Acceso a las Aplicaciones

### 6.1 URLs de Acceso

| Servicio | URL | Descripción |
|---|---|---|
| **Banca Web** | https://bantec.35-209-225-8.sslip.io | Frontend Web |
| **Cajero ATM** | https://bantec.35-209-225-8.sslip.io:8443 | Frontend Cajero |
| **API Gateway** | http://35.209.225.8:8080 | API REST |
| **Swagger UI** | http://35.209.225.8:8080/swagger-ui.html | Documentación API |
| **Micro Clientes** | http://35.209.225.8:8083/swagger-ui.html | Swagger Clientes |
| **Micro Cuentas** | http://35.209.225.8:8081/swagger-ui.html | Swagger Cuentas |
| **MS Transacciones** | http://35.209.225.8:8082/swagger-ui.html | Swagger Transacciones |

### 6.2 Probar Conectividad con el Switch
```bash
# Desde la VM
curl http://35.208.155.21:9080/api/v1/red/bancos

# Desde el contenedor de transacciones
docker exec ms-transaccion-bantec curl http://35.208.155.21:9080/api/v1/red/bancos
```

---

## 7. Comandos Útiles de Mantenimiento

### 7.1 Reiniciar Servicios
```bash
# Reiniciar todos los servicios
docker-compose -f docker-compose.prod.yml restart

# Reiniciar un servicio específico
docker-compose -f docker-compose.prod.yml restart ms-transaccion
```

### 7.2 Actualizar el Código
```bash
# Detener servicios
docker-compose -f docker-compose.prod.yml down

# Actualizar código
git pull origin main

# Reconstruir y levantar
docker-compose -f docker-compose.prod.yml up --build -d
```

### 7.3 Limpiar Recursos
```bash
# Eliminar contenedores detenidos
docker container prune -f

# Eliminar imágenes sin usar
docker image prune -a -f

# Eliminar volúmenes huérfanos
docker volume prune -f

# Limpiar todo (CUIDADO: borra datos)
docker system prune -a --volumes -f
```

### 7.4 Backup de Bases de Datos
```bash
# Backup de base de datos de cuentas
docker exec db-cuentas-bantec pg_dump -U postgres db_cuentas > backup_cuentas_$(date +%Y%m%d).sql

# Backup de base de datos de clientes
docker exec db-clientes-bantec pg_dump -U postgres microcliente > backup_clientes_$(date +%Y%m%d).sql

# Backup de base de datos de transacciones
docker exec db-transacciones-bantec pg_dump -U postgres db_transacciones > backup_transacciones_$(date +%Y%m%d).sql
```

### 7.5 Restaurar Bases de Datos
```bash
# Restaurar base de datos de cuentas
cat backup_cuentas_20251226.sql | docker exec -i db-cuentas-bantec psql -U postgres db_cuentas
```

---

## 8. Monitoreo y Logs

### 8.1 Ver Logs en Tiempo Real
```bash
# Todos los servicios
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# Solo transacciones
docker-compose -f docker-compose.prod.yml logs -f --tail=100 ms-transaccion

# Solo API Gateway
docker-compose -f docker-compose.prod.yml logs -f --tail=100 api-gateway
```

### 8.2 Inspeccionar Contenedores
```bash
# Ver configuración de un contenedor
docker inspect ms-transaccion-bantec

# Entrar a un contenedor
docker exec -it ms-transaccion-bantec /bin/sh

# Ver procesos dentro del contenedor
docker top ms-transaccion-bantec
```

---

## 9. Troubleshooting

### 9.1 Problema: Contenedor no inicia
```bash
# Ver logs del contenedor
docker logs ms-transaccion-bantec

# Ver eventos de Docker
docker events
```

### 9.2 Problema: No hay conexión con el Switch
```bash
# Verificar conectividad de red
docker exec ms-transaccion-bantec ping -c 3 35.208.155.21

# Verificar reglas de firewall
gcloud compute firewall-rules list
```

### 9.3 Problema: Error de certificados SSL
```bash
# Verificar certificados
ls -la nginx/certs/

# Renovar certificados Let's Encrypt
sudo certbot renew
```

---

## 10. Seguridad en Producción

### 10.1 Cambiar Contraseñas por Defecto
Editar `docker-compose.prod.yml` y cambiar:
- `POSTGRES_PASSWORD` de todas las bases de datos
- Contraseñas de mTLS en variables de entorno

### 10.2 Configurar Firewall Restrictivo
```bash
# Permitir solo IPs específicas para acceso a microservicios
gcloud compute firewall-rules update allow-microservices \
  --source-ranges IP_DE_TU_OFICINA/32
```

### 10.3 Habilitar HTTPS en Nginx
Asegurarse de que `nginx.conf` redirija HTTP a HTTPS (ya configurado).

---

## 11. Checklist de Despliegue

- [ ] VM creada y configurada
- [ ] Docker y Docker Compose instalados
- [ ] Firewall configurado
- [ ] Repositorio clonado
- [ ] Certificados SSL generados
- [ ] Certificados mTLS generados (si aplica)
- [ ] Variables de entorno configuradas
- [ ] Servicios levantados con `docker-compose`
- [ ] Verificar acceso a frontends
- [ ] Verificar Swagger UI
- [ ] Probar conectividad con Switch
- [ ] Configurar backups automáticos
- [ ] Documentar credenciales de producción

---

**Última actualización**: 26 de Diciembre de 2025  
**Contacto**: Equipo de Desarrollo BANTEC
