#!/bin/bash
set -e

# Moverse al directorio del script (raíz del proyecto)
cd "$(dirname "$0")"

echo "🐳 Usando Docker para generar certificados (evita errores de librerías en Host)..."

# Usamos una imagen ligera de Java que permite instalar OpenSSL
# Montamos el directorio actual ($PWD) en /work dentro del contenedor
# Nota: Usamos 'sudo' porque en la VM parece ser necesario para docker
sudo docker run --rm -v "$(pwd):/work" -w /work eclipse-temurin:17-jdk-alpine sh -c '
  # Instalar OpenSSL
  apk add --no-cache openssl > /dev/null
  
  echo "🔐 Generando certificados..."
  mkdir -p ms-transaccion/src/main/resources/certs
  cd ms-transaccion/src/main/resources/certs
  
  # Variables
  KEYSTORE_PASSWORD="bantec123"
  TRUSTSTORE_PASSWORD="bantec123"

  # 1. Generar Llave y Certificado
  echo "  -> Generando bantec.crt y bantec.key..."
  openssl req -new -x509 -nodes -newkey rsa:2048 \
    -keyout bantec.key \
    -out bantec.crt \
    -days 365 \
    -subj "/C=EC/ST=Pichincha/L=Quito/O=Bantec/CN=bantec.switch.com"

  # 2. Keystore PKCS12
  echo "  -> Generando bantec-keystore.p12..."
  openssl pkcs12 -export \
    -in bantec.crt \
    -inkey bantec.key \
    -out bantec-keystore.p12 \
    -name bantec \
    -password pass:$KEYSTORE_PASSWORD

  # 3. Truststore
  echo "  -> Generando bantec-truststore.p12..."
  keytool -genkeypair -alias dummy -keyalg RSA -keysize 2048 \
    -keystore bantec-truststore.p12 \
    -storetype PKCS12 \
    -storepass $TRUSTSTORE_PASSWORD \
    -dname "CN=Dummy, OU=Dummy, O=Dummy, L=Dummy, ST=Dummy, C=EC" \
    -validity 1

  keytool -delete -alias dummy \
    -keystore bantec-truststore.p12 \
    -storepass $TRUSTSTORE_PASSWORD
    
  # Ajustar permisos para que el usuario del host pueda leerlos
  chmod 777 *
'

echo "✅ Certificados generados exitosamente en ms-transaccion/src/main/resources/certs/"
