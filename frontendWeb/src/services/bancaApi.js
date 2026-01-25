import { apiFetch } from '../context/AuthContext'

const GATEWAY_URL = "";

const ISO_ERROR_MAP = {
  "AC00": "¡Transferencia exitosa!",
  "AM04": "No tienes saldo suficiente para esta operación.",
  "AC01": "El número de cuenta o banco destino no existe. Verifícalo.",
  "AC04": "La cuenta destino está cerrada o inactiva.",
  "MS03": "Hubo un problema de comunicación con el otro banco. Intenta en unos minutos.",
  "AG01": "Operación no permitida por políticas del banco.",
  "BE01": "Los datos del destinatario no coinciden. Por seguridad, no se procesó.",
  "RC01": "Error en los datos enviados. Contacta a soporte."
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
    if (msg && typeof msg === 'string') {
      const codigoIso = msg.substring(0, 4).toUpperCase();
      if (ISO_ERROR_MAP[codigoIso]) {
        msg = `${ISO_ERROR_MAP[codigoIso]} (${msg})`;
      }
    }

    throw new Error(msg);
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

const bancaApi = {
  getClientePorIdentificacion,
  getCuentaPorNumero,
  getConsolidada,
  getMovimientos,
  realizarTransferencia,
  realizarTransferenciaInterbancaria,
  solicitarReverso,
  getBancos
}

export default bancaApi;