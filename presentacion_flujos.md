# Cómo Funciona el Sistema de Transferencias (Explicación Simplificada)

## 1. Enviando Dinero (El problema de la incertidumbre)
**Antes:** Cuando enviabas dinero, el sistema te decía "Enviado", pero no sabía si realmente llegaba. Era como tirar una carta al buzón y esperar.
**Ahora (Lo que hicimos):** Implementamos un sistema que "espera en la línea".

1.  **El Cliente envía dinero:**
    *   Bantec descuenta el dinero de su cuenta inmediatamente (para que no lo gaste dos veces).
    *   Bantec envía la orden al "Switch" (el interconector de bancos).
2.  **La Espera Inteligente (Polling):**
    *   En lugar de cortar la llamada ahí, Bantec se queda preguntando cada segundo: *"¿Ya llegó? ¿Ya llegó?"*.
    *   El usuario ve un "cargando..." real.
3.  **Resultado Definitivo:**
    *   Si el otro banco dice **"SÍ"**: Le mostramos "¡Éxito!" al usuario.
    *   Si el otro banco dice **"NO"** (cuenta no existe): Le devolvemos el dinero automáticamente al usuario y le decimos "Falló".
    *   **Beneficio:** El usuario ya no tiene dudas. Sabe si pagó o no al instante.

---

## 2. Recibiendo Dinero (Evitando errores contables)
**Problema:** Antes, cuando llegaba dinero para una cuenta que no existía, Bantec decía "OK, gracias" y se quedaba con el dinero en el limbo. Luego había que devolverlo manualmente.
**Solución (Validación en tiempo real):**

1.  El Switch nos avisa: *"Oye, te mando $50 para la cuenta 123"*.
2.  **Bantec verifica al instante:** Busca en su base de datos si la cuenta 123 existe.
3.  **Decisión:**
    *   **Si existe:** Acepta el dinero.
    *   **Si NO existe:** Le grita al Switch: *"¡Error! Esa cuenta no es mía"*.
    *   **Resultado:** La transferencia rebota instantáneamente y el dinero nunca sale de la cuenta del origen. Cero errores contables.

---

## 3. ¿Qué pasa si el sistema falla? (Resiliencia)
**Problema:** A veces el internet se corta o el otro banco se cae justo a la mitad de la operación.
**Solución (El botón de pánico automático):**

1.  Si Bantec envía dinero y el otro banco no responde en 3 minutos...
2.  Bantec asume que algo salió mal.
3.  Automáticamente **cancela** la operación local.
4.  **Devuelve el dinero** a la cuenta del cliente.
5.  Le muestra un botón que dice "Reintentar" o permite ver el reembolso.
    *   *Nadie pierde dinero por culpa de una caída del sistema.*
