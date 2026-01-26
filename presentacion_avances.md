# Reporte de Avance: Sistema Transaccional Resiliente (21-25 Enero)

## Resumen Ejecutivo
En este sprint se completó la integración "End-to-End" del ciclo transaccional, enfocándonos en la **atomicidad**, **experiencia de usuario (UX)** y **tolerancia a fallos**. Se eliminó la incertidumbre de los pagos diferidos.

---

## 1. Validación Síncrona (ISO 20022)
**El Cambio:** Anteriormente, el sistema aceptaba todo (`HTTP 200`) y validaba después. Ahora valida **antes** de aceptar.
*   **Lógica:** Al recibir una transferencia, Bantec verifica *en tiempo real* (milisegundo 0) si la cuenta existe.
*   **Rechazo Inmediato:** Si la cuenta no existe, el sistema responde con error `422` y código ISO `AC01`.
*   **Impacto:** El banco origen recibe el rechazo al instante y no descuenta el dinero. **Cero descuadres contables.**

## 2. Experiencia "Zero-Wait" (Polling Síncrono)
**El Cambio:** Reemplazo del mensaje estático "Enviado a la red" por una confirmación real.
*   **Flujo:**
    1.  El cliente envía la transferencia.
    2.  El Frontend espera ("Cargando...").
    3.  El Backend consulta el estado cada 1.5s durante 15 segundos.
*   **Resultado:** El usuario sabe si pagó o no en la misma pantalla. No tiene que revisar su historial después.

## 3. Arquitectura del Switch: "Memoria Compartida" y Auto-Curación (RF-04)
Implementación de un mecanismo de alta velocidad y consistencia.

### A. Lectura Directa (Latencia Cero)
Cuando consultamos el estado de una transferencia a Kong (Switch), **no buscamos en logs diferidos**.
*   Leemos directamente la tabla `Transaccion` que los hilos de procesamiento están escribiendo.
*   **Cronología:**
    *   `ms 0`: Switch recibe y guarda `RECEIVED`.
    *   `ms 100`: Switch envía a Banco Destino.
    *   `ms 2000`: Banco Destino responde OK -> Switch actualiza DB a `COMPLETED`.
    *   `ms 2001`: Nuestra consulta lee `COMPLETED`. **Es instantáneo.**

### B. Auto-Curación (Anti-Pegado)
¿Qué pasa si una transacción se queda en el limbo (ej. Timeout de red)?
*   El endpoint de consulta (`GET /status`) no es pasivo; es **ACTIVO**.
*   Si ve una transacción en `RECEIVED` por más de 5 segundos:
    1.  **Dispara una verificación:** Llama proactivamente al Banco Destino.
    2.  **Pregunta:** "¿Recibiste la Tx 123?".
    3.  **Actualiza:** Si el banco dice "Sí", el Switch fuerza el `COMPLETED` en su DB y nos responde.
*   **Conclusión:** No dependemos de procesos nocturnos para arreglar errores. El sistema se repara solo en tiempo de consulta.

## 4. Resiliencia ante Caídas (Circuit Breaker Lógico)
**Escenario:** El Banco Destino está totalmente caído (Error 500 / Timeout).
*   **Detección:** Si el Switch devuelve error `5xx` o `404` (No encontrado).
*   **Acción:** Bantec asume falla inmediata.
*   **Reembolso:** Se ejecuta un reverso automático y se habilita el botón de devolución para el usuario.
*   **Seguridad:** Se truncan los mensajes de error largos para evitar colapsos en la base de datos (Fix SQL `varchar(255)`).

## 5. DevOps
*   Automatización completa de renovación de certificados SSL (`renew-certs.ps1/sh`) para garantizar comunicación segura en Producción (Docker/Nginx).
