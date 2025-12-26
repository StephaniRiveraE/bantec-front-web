# Documentación del Proyecto BANTEC (Micros2P)
**Fecha de Actualización**: 20 de Diciembre de 2025
**Generado por**: AI (Antigravity) para continuidad de desarrollo.

## 1. Visión General
Este es un sistema bancario distribuido basado en microservicios, diseñado para gestionar **Clientes**, **Cuentas de Ahorro**, y **Transacciones** (Depósitos, Retiros, Transferencias Internas e Interbancarias). Incluye dos aplicaciones frontend: una Web de Banca en Línea y un Cajero Automático (ATM).

**Integración Interbancaria**: El sistema se conecta al switch **DIGICONECU** para procesar transferencias entre diferentes bancos.

## 2. Arquitectura del Sistema
El sistema utiliza **Docker Compose** para orquestar los siguientes servicios:

| Servicio | Nombre Contenedor | Puerto Interno | Puerto Externo (Host) | DB Asociada | Tecnologías | Descripción |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **API Gateway** | `api-gateway-arcbank` | 8080 | **8080** | N/A | Spring Cloud Gateway | Punto de entrada único. Enruta `/api/v1/clientes` -> 8083, `/api/v1/cuentas` -> 8081, `/api/transacciones` -> 8082, `/api/bancos` -> 8082. |
| **Micro Clientes** | `micro-clientes-arcbank` | 8080 | 8083 | `db-clientes-arcbank` | Spring Boot 3, PostgreSQL | Gestión de datos personales de clientes y login. |
| **Micro Cuentas** | `micro-cuentas` | 8081 | 8081 | `db-cuentas-arcbank` | Spring Boot 3, PostgreSQL | Gestión de cuentas de ahorro y saldos. |
| **MS Transacción** | `ms-transaccion-arcbank` | 8080 | 8082 | `db-transacciones-arcbank` | Spring Boot 3, PostgreSQL, Feign | Lógica de transacciones + Integración con Switch DIGICONECU. |
| **Frontend Web** | `frontend-web-arcbank` | 80 | **3000** | N/A | React, Vite | Banca personas: Login, Saldo, Movimientos, Transferencias Internas e Interbancarias. |
| **Frontend Cajero** | `frontend-cajero-arcbank` | 80 | **3001** | N/A | React, Vite, Tailwind | Interfaz ATM: Login Cajero, Buscar Cliente, Depósitos, Retiros. |

---

## 3. Microservicios y Endpoints Clave

### A. Micro Clientes (`micro-clientes`)
**Base de Datos**: `microcliente`
**Entidad Principal**: `Cliente` (id, identificacion, nombreCompleto, etc.)

*   `POST /api/v1/clientes`: Crear cliente.
*   `GET /api/v1/clientes/{id}`: Obtener por ID. Retorna `ClienteResponseDTO` (contiene `nombreCompleto`).
*   `GET /api/v1/clientes/identificacion/{cedula}`: Buscar por Cédula.
*   `POST /api/v1/clientes/login`: Login clientes.

### B. Micro Cuentas (`micro-cuentas`)
**Base de Datos**: `db_cuentas`
**Entidad Principal**: `CuentaAhorro`
**Configuración Importante**: No tiene conexión FEIGN con clientes. Sus DTOs **NO** incluyen nombres de personas, solo `idCliente`.

*   `GET /api/v1/cuentas/ahorros/buscar/{numeroCuenta}`: Buscar por número de cuenta exacto.
*   `GET /api/v1/cuentas/ahorros/{id}`: Obtener detalles y saldo `disponible`.
*   `PUT /api/v1/cuentas/ahorros/{id}/saldo`: Endpoint interno para actualizar saldo (usado por `ms-transaccion`).

### C. MS Transacción (`ms-transaccion`)
**Base de Datos**: `db_transacciones`
**Entidad Principal**: `Transaccion`
**Configuración**: `ddl-auto: create` (Resetea DB al inicio).

*   `POST /api/transacciones`: Crear transacción.
    *   **Tipos soportados**: `DEPOSITO`, `RETIRO`, `TRANSFERENCIA_INTERNA`, `TRANSFERENCIA_SALIDA`, `TRANSFERENCIA_ENTRADA`
    *   **Payload Interbancaria**: `{ tipoOperacion: "TRANSFERENCIA_SALIDA", idCuentaOrigen, cuentaExterna, monto, descripcion }`
*   `GET /api/transacciones/cuenta/{idCuenta}`: Historial de movimientos.
*   `GET /api/bancos`: Lista de bancos conectados al switch (proxy al switch DIGICONECU).
*   `POST /api/transacciones/webhook`: Webhook para recibir transferencias entrantes del switch.

**Lógica Crítica (Balance Dual)**:
Se implementó una columna `saldoResultanteDestino` en la tabla `Transaccion`.
*   Cuando es `TRANSFERENCIA_INTERNA`:
    *   `saldoResultante`: Guarda el saldo final del **Origen**.
    *   `saldoResultanteDestino`: Guarda el saldo final del **Destino**.
*   Al listar (GET), el DTO mapea el saldo correcto dependiendo de si quien consulta es el origen o el destino.

---

## 4. Integración con Switch DIGICONECU

### Arquitectura de Integración
```
┌─────────────────┐         ┌──────────────────────┐
│   BANTEC        │ ─────►  │  Switch DIGICONECU   │
│  (Micros2P)     │ ◄─────  │  (AWS)               │
│  Puerto: 8082   │         │  Puerto: 8081        │
└─────────────────┘         └──────────────────────┘
```

### Configuración
*   **Variable de entorno**: `APP_SWITCH_URL` (default: `http://host.docker.internal:8081`)
*   **Código del banco**: `BANCO_CODIGO=BANTEC`
*   **Rango BIN**: `220000-229999` (números de cuenta que empiezan con 22)

### Flujo de Transferencia Saliente
1. Usuario solicita `TRANSFERENCIA_SALIDA` con `cuentaExterna`
2. `ms-transaccion` debita saldo local
3. `SwitchClient` envía a `POST /api/v2/transfers` del switch
4. Si el switch rechaza, se revierte el débito local
5. Si aprueba, la transacción queda como COMPLETADA

### Flujo de Transferencia Entrante
1. Switch envía webhook a `POST /api/transacciones/webhook`
2. `WebhookController` recibe y valida
3. `TransaccionServiceImpl.procesarTransferenciaEntrante()` acredita saldo
4. Se registra transacción tipo `TRANSFERENCIA_ENTRADA`

---

## 5. Frontends y Lógica de Negocio

### A. Frontend Cajero (`frontendCajero`)
*   **Buscador Híbrido**: El componente `api.js` fuerza primero la búsqueda por **Número de Cuenta**. Si retorna 404, intenta buscar por **Cédula**.
*   **Enriquecimiento de Datos**: `ValoresTransaccion.jsx` hace segunda llamada a `clientes.getById(id)` para obtener el `nombreCompleto`.

### B. Frontend Web (`frontendWeb`)
*   `Movimientos.jsx`: Historial con colores según tipo.
*   `Transferir.jsx`: Transferencias internas (mismo banco).
*   `TransaccionesInterbancarias.jsx`: Transferencias a otros bancos vía switch.

---

## 6. Notas Técnicas y Deuda Técnica
1.  **Validaciones Eliminadas**: Sin restricciones de longitud en Frontend Cajero.
2.  **DDL Auto**: `ms-transaccion` tiene `create`. Cambiar a `update` cuando estable.
3.  **Puertos**: 3000/3001/8080. Modificar `docker-compose.yml` si ocupados.
4.  **Switch en Cloud**: Para producción, cambiar `APP_SWITCH_URL` a IP pública de AWS.

## 7. Comandos Útiles
```bash
# Levantar todo
docker-compose up --build -d

# Ver logs Transacciones
docker logs --tail 100 -f ms-transaccion-arcbank

# Verificar conexión con switch
curl http://localhost:8082/api/bancos

# Prueba transferencia interbancaria
curl -X POST http://localhost:8082/api/transacciones \
  -H "Content-Type: application/json" \
  -d '{"tipoOperacion":"TRANSFERENCIA_SALIDA","idCuentaOrigen":1,"cuentaExterna":"1001234567","monto":50.00}'
```

---
*Este documento fue generado para asegurar la continuidad del desarrollo del proyecto.*

