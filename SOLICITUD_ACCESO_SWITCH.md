# Credenciales para el Administrador del Switch (Kong)

El Banco Bantec ha generado las siguientes credenciales para autenticarse en el Switch Interbancario.
Por favor, registre un "Consumer" en Kong con los siguientes datos:

## 1. Datos del Consumer
- **Username / CustomID:** `bantec`

## 2. Credentials (Plugin: Key Auth)
- **Key:** `BANTEC_SECRET_KEY_2025`
- **Header esperado:** `apikey` (Configuración por defecto del plugin key-auth)

---

## Para uso interno (Equipo Bantec)

Estas credenciales ya han sido configuradas automáticamente en el archivo `docker-compose.prod.yml`.

- **Variable de Entorno:** `APP_SWITCH_APIKEY`
- **Valor:** `BANTEC_SECRET_KEY_2025`

El microservicio `ms-transaccion` enviará automáticamente el header:
`apikey: BANTEC_SECRET_KEY_2025` 
en todas las peticiones al Switch.
