// API Gateway via nginx proxy (rutas relativas)
// nginx hace proxy de /api/* hacia api-gateway:8080
const BASE_URL = "";

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  console.log("🌐 Request a:", url);

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  console.log("📡 Response status:", res.status, res.ok);

  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    // Intentamos obtener el mensaje limpio del backend (BusinessException)
    const message = errorJson ? (errorJson.mensaje || errorJson.error) : res.statusText;
    console.error("❌ Error response:", message);
    throw new Error(message || "Error del servidor");
  }

  return res.status === 204 ? null : res.json();
}

// Microservicio Clientes (Asumiendo ruta estándar)
export const clientes = {
  getByCedula: (cedula) => request(`/api/v1/clientes/identificacion/${cedula}`),
  getById: (id) => request(`/api/v1/clientes/${id}`),
};

export const auth = {
  login: (identificacion, clave) =>
    request("/api/v1/clientes/login", {
      method: "POST",
      body: JSON.stringify({ identificacion, clave }),
    }),
};

// Microservicio Cuentas
export const cuentas = {
  // Busca por el String del número de cuenta (usa el endpoint nuevo del controller)
  getByNumeroCuenta: (numero) => request(`/api/v1/cuentas/ahorros/buscar/${numero}`),

  getById: (id) => request(`/api/v1/cuentas/ahorros/${id}`),

  // Lógica híbrida del Front
  getCuenta: async (identificador) => {
    console.log("🔧 getCuenta llamado con:", identificador);

    // ESTRATEGIA: Intentar primero buscar como CUENTA (prioridad).
    // Si falla (404) y tiene formato de cédula (10 dígitos), intentar como CÉDULA.

    try {
      console.log("📋 Intentando buscar como número de cuenta en MS-Cuentas...");
      return await request(`/api/v1/cuentas/ahorros/buscar/${identificador}`);
    } catch (error) {
      // Si es 404 (no encontrada) y parece cédula, intentamos buscar cliente
      // Nota: request() lanza Error si status no es ok.
      const msg = error.message || "";

      if (msg.includes("404") || msg.includes("no encontrada")) {
        console.log("⚠️ No es cuenta, intentando como Cédula en MS-Clientes...");
        return await request(`/api/v1/clientes/identificacion/${identificador}`);
      }

      // Si no es 404 o no parece cédula, relanzamos el error original
      throw error;
    }
  }
};

// Microservicio Transacciones
export const transacciones = {
  // Unificamos retiro y deposito porque el backend usa un solo endpoint POST /api/transacciones
  // El frontend (ValoresTransaccion/Deposito) debe armar el body con "tipoOperacion": "RETIRO" o "DEPOSITO"
  crear: (body) =>
    request("/api/transacciones", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  // Mantenemos alias por compatibilidad si tu código viejo los llama,
  // pero internamente usan el mismo endpoint.
  retiro: (body) =>
    request("/api/transacciones", {
      method: "POST",
      body: JSON.stringify({ ...body, tipoOperacion: "RETIRO" }),
    }),

  deposito: (body) =>
    request("/api/transacciones", {
      method: "POST",
      body: JSON.stringify({ ...body, tipoOperacion: "DEPOSITO" }),
    }),
};