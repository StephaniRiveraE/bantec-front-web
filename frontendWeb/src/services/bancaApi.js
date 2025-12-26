import { apiFetch } from '../context/AuthContext'

// APUNTAMOS AL GATEWAY via nginx proxy (rutas relativas)
// nginx hace proxy de /api/* hacia api-gateway:8080
const GATEWAY_URL = "";

/**
 * Función genérica para peticiones al Gateway
 */
async function request(path, options = {}) {
  const url = `${GATEWAY_URL}${path}`;
  console.log(`🌐 Request [${options.method || 'GET'}]:`, url);

  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const msg = errorBody.mensaje || errorBody.error || res.statusText;
    console.error("❌ Error response:", msg);
    throw new Error(msg);
  }

  // Manejo especial para respuestas vacías (204)
  if (res.status === 204) return null;
  return res.json();
}

// --- CLIENTES (Gateway -> micro-clientes) ---

export async function getClientePorIdentificacion(identificacion) {
  // GET /api/v1/clientes/identificacion/{identificacion}
  return await request(`/api/v1/clientes/identificacion/${identificacion}`);
}

// --- CUENTAS (Gateway -> micro-cuentas) ---

export async function getCuentaPorNumero(numeroCuenta) {
  // GET /api/v1/cuentas/ahorros/buscar/{numero}
  return await request(`/api/v1/cuentas/ahorros/buscar/${numeroCuenta}`);
}

/**
 * SIMULACIÓN DE POSICIÓN CONSOLIDADA
 * Como no tenemos endpoint "traer cuentas por idCliente", traemos todas y filtramos.
 * @param {string} identificacion - Cédula del usuario logueado
 */
export async function getConsolidada(identificacion) {
  try {
    // 1. Primero necesitamos saber el ID interno del cliente usando su cédula
    const cliente = await getClientePorIdentificacion(identificacion);
    if (!cliente || !cliente.idCliente) return [];

    // 2. Traemos todas las cuentas (Endpoint de listar todas)
    // OJO: Esto es solo para demo. En prod es ineficiente y peligroso.
    const todasLasCuentas = await request('/api/v1/cuentas/ahorros');

    // 3. Filtramos las que pertenecen a este cliente
    const cuentasDelUsuario = todasLasCuentas.filter(c => c.idCliente === cliente.idCliente);

    return cuentasDelUsuario;
  } catch (e) {
    console.warn("Error cargando consolidada:", e);
    return [];
  }
}

// --- TRANSACCIONES (Gateway -> ms-transaccion) ---

export async function getMovimientos(idCuenta, fechaInicio, fechaFin) {
  // Recibe el ID de la cuenta directamente (no el número de cuenta)
  try {
    if (!idCuenta) return [];

    // GET /api/transacciones/cuenta/{idCuenta}
    const movs = await request(`/api/transacciones/cuenta/${idCuenta}`);

    // Mapear fechaCreacion a fecha para compatibilidad con el componente
    return movs.map(m => ({
      ...m,
      fecha: m.fechaCreacion || m.fecha
    }));
  } catch (e) {
    console.error("Error cargando movimientos:", e);
    return [];
  }
}

export async function realizarTransferencia(payload) {
  // payload: { idCuentaOrigen, idCuentaDestino, monto, ... }
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

export async function getBancos() {
  try {
    const response = await request('/api/bancos');
    // Mapear respuesta para compatibilidad con el frontend
    const bancos = response.bancos || [];
    return bancos.map(b => ({
      id: b.codigo || b.id,
      nombre: b.nombre || b.name || b.codigo,
      codigo: b.codigo
    }));
  } catch (e) {
    console.warn("Error cargando bancos del switch:", e);
    return [];
  }
}

const bancaApi = {
  getClientePorIdentificacion,
  getCuentaPorNumero,
  getConsolidada, // Usamos el nombre que espera tu Home.js
  getMovimientos,
  realizarTransferencia,
  realizarTransferenciaInterbancaria,
  getBancos
}

export default bancaApi;