#!/bin/bash

# ============================================================
# Script para generar certificados mTLS para BANTEC
# ============================================================
# Este script genera:
# 1. Llave privada y certificado público para BANTEC
# 2. Keystore PKCS12 con el certificado del banco
# 3. Truststore PKCS12 (para certificados del Switch)
# ============================================================

set -e

echo "🔐 Generando certificados mTLS para BANTEC..."

# Crear directorio para certificados
mkdir -p ms-transaccion/src/main/resources/certs
cd ms-transaccion/src/main/resources/certs

# Contraseñas (cambiar en producción)
KEYSTORE_PASSWORD="bantec123"
TRUSTSTORE_PASSWORD="bantec123"

# 1. Generar Llave Privada y Certificado Público (formato PEM)
echo "📝 Generando llave privada y certificado público..."
openssl req -new -x509 -nodes -newkey rsa:2048 \
  -keyout bantec.key \
  -out bantec.crt \
  -days 365 \
  -subj "/C=EC/ST=Pichincha/L=Quito/O=Bantec/CN=bantec.switch.com"

# 2. Convertir a formato PKCS12 (Keystore)
echo "🔑 Creando Keystore PKCS12..."
openssl pkcs12 -export \
  -in bantec.crt \
  -inkey bantec.key \
  -out bantec-keystore.p12 \
  -name bantec \
  -password pass:$KEYSTORE_PASSWORD

# 3. Crear Truststore vacío (se agregará el certificado del Switch después)
echo "🔒 Creando Truststore PKCS12..."
keytool -genkeypair -alias dummy -keyalg RSA -keysize 2048 \
  -keystore bantec-truststore.p12 \
  -storetype PKCS12 \
  -storepass $TRUSTSTORE_PASSWORD \
  -dname "CN=Dummy, OU=Dummy, O=Dummy, L=Dummy, ST=Dummy, C=EC" \
  -validity 1

# Eliminar el certificado dummy
keytool -delete -alias dummy \
  -keystore bantec-truststore.p12 \
  -storepass $TRUSTSTORE_PASSWORD

echo ""
echo "✅ Certificados generados exitosamente en: ms-transaccion/src/main/resources/certs/"
echo ""
echo "📋 Archivos generados:"
echo "  - bantec.key              (Llave privada - NO compartir)"
echo "  - bantec.crt              (Certificado público - enviar al Switch)"
echo "  - bantec-keystore.p12     (Keystore para Spring Boot)"
echo "  - bantec-truststore.p12   (Truststore - agregar certificado del Switch)"
echo ""
echo "📤 IMPORTANTE: Enviar bantec.crt al equipo de DIGICONECU para que lo agreguen a su truststore"
echo ""
echo "📥 PENDIENTE: Solicitar el certificado público del Switch y agregarlo al truststore con:"
echo "   keytool -import -alias digiconecu -file switch.crt \\"
echo "     -keystore bantec-truststore.p12 -storepass $TRUSTSTORE_PASSWORD"
echo ""
