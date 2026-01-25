# Script para renovar certificados SSL automaticamente
# Uso: .\renew-certs.ps1

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   RENOVACION AUTOMATICA DE CERTIFICADOS  " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Paso 1: Obtener certificado
Write-Host "`n[PASO 1] Solicitando certificado a Lets Encrypt..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.prod.yml run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot --force-renewal --email arcbank2@gmail.com -d bantec-bank.duckdns.org --agree-tos --non-interactive" certbot
}
catch {
    Write-Host "X Error ejecutando certbot. Verifica que los puertos 80/443 esten libres o mapeados." -ForegroundColor Red
    exit 1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK Certificado obtenido/renovado correctamente." -ForegroundColor Green
    
    # Paso 2: Recargar Nginx
    Write-Host "`n[PASO 2] Recargando Nginx para aplicar cambios..." -ForegroundColor Yellow
    try {
        docker-compose -f docker-compose.prod.yml exec nginx-proxy nginx -s reload
    }
    catch {
        Write-Host "X Error recargando Nginx." -ForegroundColor Red
        exit 1
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK Nginx recargado. El nuevo certificado esta activo!" -ForegroundColor Green
    }
    else {
        Write-Host "! Advertencia: Nginx devolvio un codigo de salida no cero." -ForegroundColor Yellow
    }
}
else {
    Write-Host "X El comando de Certbot fallo." -ForegroundColor Red
    exit 1
}

Write-Host "`nOperacion Completada." -ForegroundColor Cyan
