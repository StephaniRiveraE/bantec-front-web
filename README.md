# 🏦 BANTEC - Core Banking System

Sistema bancario core basado en microservicios con soporte para transacciones interbancarias a través de un Switch Transaccional ISO 20022.

---

## 📋 Índice

- [Arquitectura General](#-arquitectura-general)
- [Componentes del Sistema](#-componentes-del-sistema)
- [Flujo de Comunicación](#-flujo-de-comunicación)
- [Transferencias Interbancarias](#-transferencias-interbancarias)
- [Instalación y Despliegue](#-instalación-y-despliegue)
- [Configuración](#-configuración)
- [API Endpoints](#-api-endpoints)

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              INTERNET                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │   NGINX REVERSE PROXY (SSL)       │
                    │   bantec-bank.duckdns.org         │
                    │   :443 (Web) │ :8443 (Cajero)     │
                    └─────────────────┬─────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
         ▼                            ▼                            ▼
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│  Frontend Web   │        │ Frontend Cajero │        │   API Gateway   │
│   (React.js)    │        │    (Vite)       │        │ (Spring Cloud)  │
│     :80         │        │     :80         │        │     :8080       │
└────────┬────────┘        └────────┬────────┘        └────────┬────────┘
         │                          │                          │
         └──────────────────────────┴──────────────────────────┘
                                    │ /api/*
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           MICROSERVICIOS BANTEC                                 │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────────┤
│  micro-cuentas  │ micro-clientes  │ ms-transaccion  │   micro-sucursales      │
│    :8081        │    :8080        │    :8080        │      :8080              │
│   PostgreSQL    │   PostgreSQL    │   PostgreSQL    │      MongoDB            │
└─────────────────┴─────────────────┴────────┬────────┴─────────────────────────┘
                                             │
                                             │ Transferencias Interbancarias
                                             ▼
                              ┌──────────────────────────┐
                              │   KONG API GATEWAY       │
                              │   (Switch Transaccional) │
                              │   IP: 3.140.230.212:8000 │
                              └──────────────────────────┘
                                             │
                              ┌──────────────┴──────────────┐
                              ▼                             ▼
                       ┌─────────────┐              ┌─────────────┐
                       │  ARCBANK    │              │   ECUSOL    │
                       │  (Banco B)  │              │  (Banco C)  │
                       └─────────────┘              └─────────────┘
```

---

## 🧩 Componentes del Sistema

### Microservicios Backend (Java Spring Boot)

| Servicio | Puerto | Base de Datos | Descripción |
|----------|--------|---------------|-------------|
| `micro-cuentas` | 8081 | PostgreSQL | Gestión de cuentas de ahorro, saldos y movimientos |
| `micro-clientes` | 8080 | PostgreSQL | Gestión de datos de clientes y autenticación |
| `ms-transaccion` | 8080 | PostgreSQL | Procesamiento de transacciones y conexión al Switch |
| `micro-sucursales` | 8080 | MongoDB | Gestión de sucursales y cajeros automáticos |

### Frontends

| Aplicación | Tecnología | Acceso | Descripción |
|------------|------------|--------|-------------|
| Frontend Web | React.js | `https://bantec-bank.duckdns.org` | Banca en línea para clientes |
| Frontend Cajero | Vite + React | `https://bantec-bank.duckdns.org:8443` | Interfaz para cajeros automáticos |

### Infraestructura

| Componente | Función |
|------------|---------|
| **Nginx** | Reverse proxy, terminación SSL, balanceo de carga |
| **API Gateway** | Enrutamiento centralizado de APIs, CORS |
| **Certbot** | Gestión automática de certificados Let's Encrypt |
| **Docker Compose** | Orquestación de contenedores |

---

## 🔄 Flujo de Comunicación

### 1. Cliente → Nginx → Frontend → API Gateway → Microservicios

```
Usuario Web/Cajero
       │
       ▼ HTTPS (:443 / :8443)
┌──────────────┐
│    Nginx     │  ◄── Certificado SSL (Let's Encrypt)
└──────┬───────┘
       │
       ├── /           → Frontend Web/Cajero (archivos estáticos)
       │
       └── /api/*      → API Gateway (:8080)
                              │
                              ▼
                    ┌─────────────────┐
                    │   API Gateway   │
                    │ (Spring Cloud)  │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
      /api/clientes   /api/cuentas   /api/transacciones
            │                │                │
            ▼                ▼                ▼
     micro-clientes   micro-cuentas   ms-transaccion
```

### 2. Comunicación entre Microservicios (Feign Clients)

`ms-transaccion` se comunica con otros microservicios usando **OpenFeign**:

```java
// Comunicación con micro-cuentas
@FeignClient(name = "ms-cuentas", url = "${app.feign.cuentas-url}")
public interface CuentaCliente {
    @GetMapping("/api/v1/cuentas/ahorros/{id}/saldo")
    BigDecimal obtenerSaldo(@PathVariable Integer id);
    
    @PutMapping("/api/v1/cuentas/ahorros/{id}/saldo")
    void actualizarSaldo(@PathVariable Integer id, @RequestBody SaldoDTO saldo);
}

// Comunicación con micro-clientes
@FeignClient(name = "ms-clientes", url = "${app.feign.clientes-url}")
public interface ClienteClient {
    @GetMapping("/api/v1/clientes/{id}")
    Map<String, Object> obtenerCliente(@PathVariable Integer id);
}
```

---

## 💸 Transferencias Interbancarias

### Arquitectura de Conexión al Switch

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BANTEC (ms-transaccion)                            │
│                                                                             │
│  ┌─────────────────┐    ┌────────────────────┐    ┌─────────────────────┐  │
│  │TransaccionService│───►│   SwitchClient     │───►│SwitchFeignDecoder   │  │
│  │                 │    │   (Feign Client)   │    │(Manejo respuestas)  │  │
│  └─────────────────┘    └─────────┬──────────┘    └─────────────────────┘  │
│                                   │                                         │
└───────────────────────────────────┼─────────────────────────────────────────┘
                                    │
                                    │ POST /api/v1/transacciones
                                    │ Header: apikey: BANTEC_SECRET_KEY_2025
                                    ▼
                    ┌───────────────────────────────┐
                    │       KONG API GATEWAY        │
                    │    (Switch Transaccional)     │
                    │    IP: 3.140.230.212:8000     │
                    │                               │
                    │  ┌─────────────────────────┐  │
                    │  │  ms-nucleo (Switch)     │  │
                    │  │  - Validación ISO 20022 │  │
                    │  │  - Enrutamiento bancos  │  │
                    │  │  - Contabilidad         │  │
                    │  └───────────┬─────────────┘  │
                    │              │                │
                    └──────────────┼────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
             ┌─────────────┐              ┌─────────────┐
             │   ARCBANK   │              │   ECUSOL    │
             │  Webhook    │              │  Webhook    │
             └─────────────┘              └─────────────┘
```

### Formato de Mensaje ISO 20022

```json
{
  "header": {
    "messageId": "MSG-BANTEC-1704326400000",
    "creationDateTime": "2026-01-04T00:00:00Z",
    "originatingBankId": "BANTEC"
  },
  "body": {
    "instructionId": "UUID-550E8400-E29B-...",
    "endToEndId": "REF-BANTEC-TRX123",
    "amount": {
      "currency": "USD",
      "value": 100.00
    },
    "debtor": {
      "name": "Juan Pérez",
      "accountId": "10005001",
      "accountType": "SAVINGS"
    },
    "creditor": {
      "name": "María López",
      "targetBankId": "ARCBANK",
      "accountId": "40001001",
      "accountType": "SAVINGS"
    },
    "remittanceInformation": "Pago de servicios"
  }
}
```

### Flujo de una Transferencia Interbancaria

```
1. Usuario inicia transferencia en Frontend Web
                    │
                    ▼
2. POST /api/transacciones (API Gateway → ms-transaccion)
                    │
                    ▼
3. ms-transaccion valida saldo suficiente (consulta a micro-cuentas)
                    │
                    ▼
4. Débito en cuenta origen + comisión ($0.45)
                    │
                    ▼
5. Envío al Switch vía SwitchClient (Feign)
   POST http://3.140.230.212:8000/api/v1/transacciones
   Header: apikey: BANTEC_SECRET_KEY_2025
                    │
                    ▼
6. Kong Gateway valida API Key y enruta a ms-nucleo
                    │
                    ▼
7. Switch procesa y envía al banco destino (ARCBANK/ECUSOL)
                    │
                    ▼
8. Switch responde HTTP 200 → SwitchFeignDecoder marca como éxito
                    │
                    ▼
9. ms-transaccion guarda transacción como COMPLETADA
                    │
                    ▼
10. Respuesta al usuario: Transferencia exitosa ✅
```

### Manejo de Errores y Reversiones

Si el Switch rechaza la transacción o hay un error de comunicación:

```java
// En TransaccionServiceImpl.java
if (switchResp == null || !switchResp.isSuccess()) {
    // REVERSIÓN: Devolver el dinero a la cuenta origen
    BigDecimal saldoRevertido = procesarSaldo(cuentaOrigen, montoTotal);
    
    trx.setEstado("FALLIDA");
    trx.setDescripcion("RECHAZADA POR SWITCH: " + error);
}
```

---

## 🚀 Instalación y Despliegue

### Requisitos Previos

- Docker & Docker Compose
- Git
- Dominio DuckDNS configurado (para SSL)

### Despliegue Local

```bash
# Clonar repositorio
git clone https://github.com/AlisonTamayo/BnacoBantec.git
cd BnacoBantec

# Ejecutar en modo desarrollo
docker-compose up -d --build

# Ver logs
docker-compose logs -f
```

### Despliegue en Producción (GCP)

El despliegue es automático vía GitHub Actions al hacer push a `main`:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

El workflow `.github/workflows/deploy.yml` se encarga de:
1. Conectar al servidor via SSH
2. Actualizar el código con `git pull`
3. Obtener certificados SSL con Certbot
4. Reconstruir y reiniciar contenedores

---

## ⚙️ Configuración

### Variables de Entorno (ms-transaccion)

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `DB_URL` | URL de PostgreSQL | `jdbc:postgresql://localhost:5432/db_transacciones` |
| `CUENTAS_URL` | URL micro-cuentas | `http://micro-cuentas:8081` |
| `CLIENTES_URL` | URL micro-clientes | `http://micro-clientes:8080` |
| `APP_SWITCH_URL` | URL del Switch Kong | `http://3.140.230.212:8000` |
| `APP_SWITCH_APIKEY` | API Key del Switch | `BANTEC_SECRET_KEY_2025` |
| `BANCO_CODIGO` | Código identificador | `BANTEC` |

### Configuración del Switch

```yaml
# application.yaml
app:
  switch:
    network-url: ${APP_SWITCH_URL:http://3.140.230.212:8000}
    apikey: ${APP_SWITCH_APIKEY:BANTEC_SECRET_KEY_2025}
  banco:
    codigo: ${BANCO_CODIGO:BANTEC}
```

---

## 📡 API Endpoints

### Transacciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/transacciones` | Crear transacción (depósito, retiro, transferencia) |
| `GET` | `/api/transacciones/cuenta/{id}` | Historial de cuenta |
| `GET` | `/api/transacciones/{id}` | Detalle de transacción |

### Cuentas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/v1/cuentas/ahorros/{id}` | Obtener cuenta |
| `GET` | `/api/v1/cuentas/ahorros/{id}/saldo` | Consultar saldo |
| `PUT` | `/api/v1/cuentas/ahorros/{id}/saldo` | Actualizar saldo |

### Clientes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/v1/clientes/login` | Autenticación |
| `GET` | `/api/v1/clientes/{id}` | Datos del cliente |
| `POST` | `/api/v1/clientes` | Registro de cliente |

---

## 🔒 Seguridad

- **HTTPS**: Certificados SSL de Let's Encrypt via Certbot
- **API Key**: Autenticación con el Switch Transaccional
- **CORS**: Configurado en API Gateway
- **HSTS**: Headers de seguridad en Nginx

---

## 🧪 Bancos Participantes en la Red

| Banco | Código | API Key |
|-------|--------|---------|
| BANTEC | `BANTEC` | `BANTEC_SECRET_KEY_2025` |
| ARCBANK | `ARCBANK` | `ARCBANK_SECRET_KEY_2025_XYZ` |
| NEXUS | `NEXUS_BANK` | `NEXUS_SECRET_KEY_123` |
| ECUSOL | `ECUSOL_BK` | `PUBLIC_KEY_ECUSOL_67890` |

---

## 📝 Licencia

Proyecto desarrollado para fines educativos - ESPE 2025

---

## 👥 Equipo

**BANTEC Development Team**
