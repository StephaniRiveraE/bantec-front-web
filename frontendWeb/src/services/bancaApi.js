import { apiFetch } from '../context/AuthContext'

const GATEWAY_URL = "";

async function request(path, options = {}) {
  const url = `${GATEWAY_URL}${path}`;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  const res = await fetch(url, { ...options, headers, cache: 'no-store' });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const msg = errorBody.mensaje || errorBody.error || res.statusText;
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