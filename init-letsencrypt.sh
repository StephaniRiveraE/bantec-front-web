#!/bin/bash

if ! [ -x "$(command -v docker-compose)" ]; then
  echo 'Error: docker-compose is not installed.' >&2
  exit 1
fi

# Configuración
domains=("${2:-bantec-bank.duckdns.org}")
rsa_key_size=4096
data_path="./nginx/certs"
email="arcbank2@gmail.com"
staging=0

AUTO_MODE=0
if [[ "$1" == "--auto" ]]; then
  AUTO_MODE=1
fi

if [ -d "$data_path/live/${domains[0]}" ]; then
  # En modo auto, permitimos continuar para que deploy-secure.sh 
  # pueda reemplazar el Dummy Cert con uno real.
  if [ $AUTO_MODE -ne 1 ]; then
    read -p "Existing data found for ${domains[0]}. Continue and replace existing certificate? (y/N) " decision
    if [ "$decision" != "Y" ] && [ "$decision" != "y" ]; then
      exit
    fi
  fi
fi


if [ ! -e "$data_path/options-ssl-nginx.conf" ] || [ ! -e "$data_path/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters ..."
  mkdir -p "$data_path"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/ssl-dhparams.pem"
  echo
fi

echo "### Creating dummy certificate for ${domains[0]} ..."
# Usamos el openssl del host para evitar problemas de configuración dentro del contenedor
mkdir -p "$data_path/live/${domains[0]}"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "$data_path/live/${domains[0]}/privkey.pem" \
  -out "$data_path/live/${domains[0]}/fullchain.pem" \
  -subj "/CN=localhost"
echo


echo "### Starting nginx ..."
docker-compose -f docker-compose.prod.yml up --force-recreate -d nginx-proxy
echo "### Waiting for nginx to stabilize (10s) ..."
sleep 10
echo

echo "### Deleting dummy certificate for ${domains[0]} ..."
docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
  rm -rf /etc/letsencrypt/live/${domains[0]} && \
  rm -rf /etc/letsencrypt/archive/${domains[0]} && \
  rm -rf /etc/letsencrypt/renewal/${domains[0]}.conf" certbot
echo


echo "### Requesting Let's Encrypt certificate for ${domains[0]} ..."
#Join $domains to -d args
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

# Select appropriate email arg
case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

# Enable staging mode if needed
if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker-compose -f docker-compose.prod.yml run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot
echo

# VERIFICACIÓN FINAL: ¿Se obtuvo un certificado real?
REAL_CERT="$data_path/live/${domains[0]}/fullchain.pem"
if [ -f "$REAL_CERT" ]; then
    if openssl x509 -in "$REAL_CERT" -noout -issuer | grep -q "localhost"; then
        echo "⚠️  ADVERTENCIA: El certificado sigue siendo DUMMY (localhost). El proceso de Let's Encrypt falló."
    else
        echo "✅ ÉXITO: Certificado Let's Encrypt Real obtenido correctamente."
        echo "### Reloading nginx ..."
        docker-compose -f docker-compose.prod.yml exec nginx-proxy nginx -s reload
    fi
else
    echo "❌ ERROR: No se encontró ningún certificado en $REAL_CERT. Nginx podría fallar al reiniciar."
fi
