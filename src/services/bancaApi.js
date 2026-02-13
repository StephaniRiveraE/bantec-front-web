import { apiFetch } from '../context/AuthContext'

const GATEWAY_URL = process.env.REACT_APP_API_URL || "";

const ISO_ERROR_MAP = {
  "AC00": "¡Transferencia exitosa!",
  "AM04": "No tienes saldo suficiente para esta operación.",
  "AC01": "El número de cuenta o banco destino no existe. Verifícalo.",
  "AC04": "La cuenta destino está cerrada o inactiva.",
  "MS03": "Hubo un problema de comunicación con el otro banco. Intenta en unos minutos.",
  "AG01": "⚠️ OPERACIÓN RESTRINGIDA: Su institución está en modo de cierre operativo (Solo Recepción).",
  "BE01": "Los datos del destinatario no coinciden. Por seguridad, no se procesó.",
  "RC01": "Error en los datos enviados. Contacta a soporte.",
  "CH03": "📉 El monto excede el límite permitido ($10k)."
};

async function request(path, options = {}) {
  const url = `${GATEWAY_URL}${path}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  const res = await fetch(url, { ...options, headers, cache: 'no-store' });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    let msg = errorBody.mensaje || errorBody.error || res.statusText;

    // Lógica para mapear mensajes ISO 20022
    let codigoIso = (errorBody.codigo || errorBody.code || "").toString().toUpperCase();

    if (!ISO_ERROR_MAP[codigoIso] && msg && typeof msg === 'string') {
      const tempCode = msg.substring(0, 4).toUpperCase();
      if (ISO_ERROR_MAP[tempCode]) {
        codigoIso = tempCode;
      } else {
        const match = msg.match(/\b([A-Z]{2}\d{2})\b/);
        if (match) codigoIso = match[1];
      }
    }

    if (ISO_ERROR_MAP[codigoIso]) {
      msg = `${ISO_ERROR_MAP[codigoIso]}`;
    }

    const error = new Error(msg);
    error.response = { data: errorBody, status: res.status };
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function getClientePorIdentificacion(identificacion) {
  return await request(`/api/v1/clientes/identificacion/${identificacion}`);
}

export async function getCuentaPorNumero(numeroCuenta) {
  return await request(`/api/v1/cuentas/ahorros/buscar/${numeroCuenta}`);
}

export async function getConsolidada(identificacion) {
  try {
    const cliente = await getClientePorIdentificacion(identificacion);
    if (!cliente || !cliente.idCliente) return [];

    const todasLasCuentas = await request('/api/v1/cuentas/ahorros');
    const cuentasDelUsuario = todasLasCuentas.filter(c => c.idCliente === cliente.idCliente);

    return cuentasDelUsuario;
  } catch (e) {
    return [];
  }
}

export async function getMovimientos(idCuenta, fechaInicio, fechaFin) {
  try {
    if (!idCuenta) return [];
    const movs = await request(`/api/transacciones/cuenta/${idCuenta}`);
    return movs.map(m => ({
      ...m,
      fecha: m.fechaCreacion || m.fecha
    }));
  } catch (e) {
    return [];
  }
}

export async function realizarTransferencia(payload) {
  return await request('/api/transacciones', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function realizarTransferenciaInterbancaria(payload) {
  const body = {
    ...payload,
    tipoOperacion: "TRANSFERENCIA_SALIDA",
    canal: "WEB"
  };
  return await request('/api/transacciones', {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

// Solicitud de reverso
export async function solicitarReverso(payload) {
  return await request('/api/transacciones/reverso', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function getBancos() {
  try {
    const response = await request('/api/bancos');
    const bancos = response.bancos || [];
    return bancos.map(b => ({
      id: b.codigo || b.id,
      nombre: b.nombre || b.name || b.codigo,
      codigo: b.codigo
    }));
  } catch (e) {
    return [];
  }
}

export async function getTransferStatus(instructionId) {
  // RF-04: Consulta de Estado
  // CAMBIO: Consultamos a nuestro Backend (que sincroniza con Switch) en lugar de ir directo al Proxy.
  try {
    const tx = await request(`/api/transacciones/buscar/${instructionId}`);

    // Mapeo de estados Español (Backend) -> Inglés (Frontend)
    let finalState = 'PENDING';
    const backendStatus = (tx.estado || "").toUpperCase();

    if (backendStatus === 'COMPLETADA' || backendStatus === 'EXITOSA') {
      finalState = 'COMPLETED';
    } else if (backendStatus === 'FALLIDA' || backendStatus === 'RECHAZADA' || backendStatus === 'DEVUELTA') {
      finalState = 'FAILED';
    }

    return {
      estado: finalState,
      codigo: finalState === 'FAILED' ? 'ERR' : 'OK',
      mensaje: tx.mensajeUsuario || tx.descripcion || "",
      codigoReferencia: tx.codigoReferencia
    };
  } catch (e) {
    // Si no encuentra la transacción o falla, retornamos PENDING para que siga intentando
    console.warn("Polling error (API):", e);
    return { estado: 'PENDING' };
  }
}

export async function validarCuentaExterna(targetBankId, targetAccountNumber) {
  console.log("🔍 Iniciando validación de cuenta externa:", { targetBankId, targetAccountNumber });

  // Estructura ISO para Account Lookup (acmt.023)
  const lookupPayload = {
    header: {
      originatingBankId: "BANTEC" // Nuestro código BIC
    },
    body: {
      targetBankId: targetBankId,
      targetAccountNumber: targetAccountNumber
    }
  };

  // Helper para normalizar la respuesta a un formato consistente
  const normalizeResponse = (resp) => {
    console.log("📦 Respuesta recibida:", resp);

    // Caso 1: Respuesta ya está en formato esperado { status: "SUCCESS" | "FAILED", data: { exists, ownerName } }
    if ((resp?.status === "SUCCESS" || resp?.status === "FAILED") && resp?.data?.exists !== undefined) {
      return resp;
    }

    // Caso 2: Respuesta viene directamente del Switch con estructura ISO
    // Puede venir como { verificationResult: { matched: true, ... }, ... }
    if (resp?.verificationResult !== undefined) {
      const matched = resp.verificationResult?.matched || resp.verificationResult === true;
      return {
        status: matched ? "SUCCESS" : "FAILED",
        data: {
          exists: matched,
          ownerName: resp.creditorName || resp.accountHolderName || resp.ownerName || "Cuenta Verificada",
          currency: resp.currency || "USD",
          status: resp.accountStatus || "ACTIVE"
        }
      };
    }

    // Caso 3: Respuesta plana del Switch { exists, ownerName, ... }
    if (resp?.exists !== undefined) {
      return {
        status: resp.exists ? "SUCCESS" : "FAILED",
        data: {
          exists: resp.exists,
          ownerName: resp.ownerName || resp.creditorName || resp.accountHolderName || "Cuenta Verificada",
          currency: resp.currency || "USD",
          status: resp.status || "ACTIVE"
        }
      };
    }

    // Caso 4: Respuesta con status a nivel raíz (formato simplificado)
    if (resp?.ownerName || resp?.creditorName) {
      return {
        status: "SUCCESS",
        data: {
          exists: true,
          ownerName: resp.ownerName || resp.creditorName,
          currency: resp.currency || "USD",
          status: resp.accountStatus || "ACTIVE"
        }
      };
    }

    // Caso 5: Error o respuesta inesperada
    console.warn("⚠️ Formato de respuesta no reconocido:", resp);
    return {
      status: "FAILED",
      data: {
        exists: false,
        ownerName: null,
        mensaje: resp?.mensaje || resp?.message || "Formato de respuesta no reconocido"
      }
    };
  };

  try {
    // Intento 1: Llamar al backend propio de Bantec (tiene el endpoint implementado)
    console.log("📡 Intentando backend Bantec: /api/transacciones/validar-externa");
    const backendResp = await request('/api/transacciones/validar-externa', {
      method: 'POST',
      body: JSON.stringify({ targetBankId, targetAccountNumber })
    });
    console.log("✅ Respuesta del backend Bantec:", backendResp);
    return normalizeResponse(backendResp);
  } catch (backendErr) {
    console.warn("⚠️ Backend Bantec no disponible para validación:", backendErr.message);

    // Verificar si es un error de conexión vs error de validación real
    const isConnectionError = backendErr.message?.includes("fetch") ||
      backendErr.message?.includes("network") ||
      backendErr.response?.status === 404 ||
      backendErr.response?.status >= 500;

    if (!isConnectionError && backendErr.response?.data) {
      // El backend respondió pero la cuenta no existe o hay otro error de negocio
      console.log("❌ Error de validación del backend:", backendErr.response.data);
      return normalizeResponse(backendErr.response.data);
    }

    // Intento 2: Llamar directamente al Switch (fallback solo si hay error de conexión)
    console.log("📡 Intentando Switch directo: /api/v2/switch/accounts/lookup");
    try {
      const switchResp = await request('/api/v2/switch/accounts/lookup', {
        method: 'POST',
        body: JSON.stringify(lookupPayload)
      });
      console.log("✅ Respuesta del Switch:", switchResp);
      return normalizeResponse(switchResp);
    } catch (switchErr) {
      // Si ambos fallan, lanzar error amigable
      console.error("❌ Error en Switch lookup:", switchErr);
      throw new Error(switchErr.message || "No se pudo validar la cuenta. Verifique la conexión.");
    }
  }
}

const bancaApi = {
  getClientePorIdentificacion,
  getCuentaPorNumero,
  getConsolidada,
  getMovimientos,
  realizarTransferencia,
  realizarTransferenciaInterbancaria,
  solicitarReverso,
  getBancos,
  getTransferStatus,
  validarCuentaExterna
}

export default bancaApi;