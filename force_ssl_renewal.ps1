$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   SOLUCION DEFINITIVA SSL - BANTEC      " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Comprobar Docker
Write-Host "`n[1/5] Verificando Docker..." -ForegroundColor Yellow
try {
    docker info > $null
    Write-Host "OK Docker esta corriendo." -ForegroundColor Green
}
catch {
    Write-Host "X ERROR CRITICO: Docker no esta respondiendo." -ForegroundColor Red
    Write-Host "  Solucion: Abre Docker Desktop y asegura que el icono ballenita este verde."
    exit 1
}

# 2. Detener Nginx temporalmente para liberar conflictos
Write-Host "`n[2/5] Deteniendo Proxy Inverso..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml stop nginx-proxy

# 3. Intentar Renovación (Dry Run sin límites)
Write-Host "`n[3/5] Probando emision de certificado (Staging Mode)..." -ForegroundColor Yellow
$stagingCmd = "certbot certonly --webroot -w /var/www/certbot --force-renewal --email vinueza.hector.ivan@gmail.com -d bantec-bank.duckdns.org --agree-tos --non-interactive --staging"

try {
    docker-compose -f docker-compose.prod.yml run --rm --entrypoint $stagingCmd certbot
    if ($LASTEXITCODE -ne 0) { throw "Error en Staging" }
    Write-Host "OK Prueba exitosa. DNS apunta correctamente." -ForegroundColor Green
}
catch {
    Write-Host "X ERROR: Falló la prueba de validacion." -ForegroundColor Red
    Write-Host "  Posibles causas:"
    Write-Host "  1. DuckDNS no ha propagado el cambio de IP."
    Write-Host "  2. Tu IP publica cambio y DuckDNS tiene la antigua."
    Write-Host "  3. Firewall bloqueando puerto 80."
    docker-compose -f docker-compose.prod.yml start nginx-proxy
    exit 1
}

# 4. Emisión Real (Producción)
Write-Host "`n[4/5] Solicitando CERTIFICADO REAL (Produccion)..." -ForegroundColor Yellow
$prodCmd = "certbot certonly --webroot -w /var/www/certbot --force-renewal --email vinueza.hector.ivan@gmail.com -d bantec-bank.duckdns.org --agree-tos --non-interactive"

try {
    docker-compose -f docker-compose.prod.yml run --rm --entrypoint $prodCmd certbot
    if ($LASTEXITCODE -ne 0) { throw "Error en Prod" }
    Write-Host "OK Certificado Real Obtenido!" -ForegroundColor Green
}
catch {
    Write-Host "X ERROR obteniendo certificado real (posible rate limit)." -ForegroundColor Red
    docker-compose -f docker-compose.prod.yml start nginx-proxy
    exit 1
}

# 5. Reiniciar Nginx
Write-Host "`n[5/5] Reiniciando Nginx con nuevo SSL..." -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml up -d --force-recreate nginx-proxy

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "   EXITO! SITIO SEGURO RESTAURADO        " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
