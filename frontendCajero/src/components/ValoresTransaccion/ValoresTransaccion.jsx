import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { transacciones, cuentas, clientes } from "../../services/api";
import logo from "../../assets/Logo.png";
import "./ValoresTransaccion.css";

export default function ValoresTransaccion() {
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Recuperar datos del cajero
  const stored = localStorage.getItem("cajero");
  const cajero = stored ? JSON.parse(stored) : { nombreCompleto: "Cajero Demo", idCajero: 1 };
  const primerNombre = cajero?.nombreCompleto?.split(" ")[0] || "Cajero";

  const [numeroCuenta, setNumeroCuenta] = useState("");

  // Estado para guardar la respuesta completa del backend (necesitamos el ID interno)
  const [cuentaInfo, setCuentaInfo] = useState(null);

  const [cliente, setCliente] = useState({
    nombres: "",
    apellidos: "",
    cedula: "",
    tipoCuenta: "",
  });

  const [monto, setMonto] = useState("");
  const [error, setError] = useState("");

  const buscarCuenta = async () => {
    setError("");
    setCuentaInfo(null); // Reseteamos info previa
    console.log("🔍 Buscando cuenta:", numeroCuenta);

    if (!numeroCuenta) {
      setError("Por favor ingrese un número de cuenta.");
      return;
    }

    try {
      console.log("📞 Llamando a cuentas.getCuenta con:", numeroCuenta);
      // Esta llamada usa el nuevo endpoint /buscar/{numero} del backend
      const data = await cuentas.getCuenta(numeroCuenta);
      // Paso 1: Buscar cuenta
      let cuentaData = await cuentas.getCuenta(numeroCuenta);
      console.log("✅ Respuesta de cuenta:", cuentaData);

      // Paso 1.5: Enriquecer con datos de cliente si faltan (porque MS-Cuentas no devuelve nombres)
      if (cuentaData && cuentaData.idCliente && !cuentaData.nombres) {
        try {
          console.log("🔍 Buscando datos extendidos del cliente ID:", cuentaData.idCliente);
          const clienteData = await clientes.getById(cuentaData.idCliente);
          if (clienteData) {
            // Fusionamos la info. Prioridad a lo que venga de MS-Clientes para nombres/cedula
            cuentaData = {
              ...cuentaData,
              nombres: clienteData.nombreCompleto || clienteData.nombres,
              apellidos: "",
              identificacion: clienteData.identificacion
            };
          }
        } catch (err) {
          console.warn("⚠️ No se pudo obtener info detallada del cliente:", err);
          // No bloqueamos, mostramos lo que tengamos
        }
      }

      // Guardamos la info vital para la transacción (ID)
      setCuentaInfo(cuentaData);

      // Mapeo seguro de campos para visualización
      setCliente({
        nombres: cuentaData.nombreCompleto || cuentaData.nombres || "Cliente",
        apellidos: "",
        cedula: cuentaData.identificacion || String(cuentaData.idCliente || ""),
        tipoCuenta: cuentaData.tipoCuenta?.nombre || "AHORROS" // Ajuste por si el objeto viene distinto
      });

    } catch (e) {
      console.error("❌ Error buscando cuenta:", e);
      setCliente({ nombres: "", apellidos: "", cedula: "", tipoCuenta: "" });
      setError("No existe una cuenta con ese número o error de conexión.");
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("cajero");
    nav("/");
  };

  const irInicio = () => {
    nav("/seleccionar");
  };

  const continuarRetiro = async () => {
    setError("");

    // 1. Validaciones
    if (!cuentaInfo || !cuentaInfo.idCuenta) {
      setError("Debe buscar y validar la cuenta antes de continuar.");
      return;
    }

    if (!monto || !/^\d+(,\d{1,2})?$/.test(monto)) {
      setError("Monto inválido. Solo números y coma con máximo 2 decimales.");
      return;
    }

    const montoNumber = parseFloat(monto.replace(",", "."));

    try {
      // 2. Construcción del Payload para ms-transaccion
      // Debe coincidir con TransaccionRequestDTO del Java
      const body = {
        tipoOperacion: "RETIRO",
        idCuentaOrigen: cuentaInfo.idCuenta, // ¡IMPORTANTE! Usamos el ID (Integer), no el string
        monto: montoNumber,
        canal: "CAJERO", // Cambiado a CAJERO para mejor trazabilidad
        descripcion: "Retiro en ventanilla",
        idSucursal: 1 // Ajustar según datos reales del cajero
      };

      console.log("📤 Enviando retiro:", body);
      const response = await transacciones.crear(body); // Usamos el método unificado 'crear' o 'retiro'

      // 3. Redirección al comprobante
      const idTransaccion = response.idTransaccion || response.id;

      nav(`/comprobante/${idTransaccion}`, {
        state: {
          tipo: "RETIRO",
          monto: montoNumber,
          costo: response.costo || 0.00,
          saldoResultante: response.saldoResultante, // Dato nuevo útil
          fecha: response.fechaCreacion
            ? new Date(response.fechaCreacion).toLocaleDateString("es-EC")
            : new Date().toLocaleDateString("es-EC"),
          sucursal: "La Napo", // O response.idSucursal mapeado
          cuenta: {
            nombre: `${cliente.nombres} ${cliente.apellidos}`.trim(),
            cedula: cliente.cedula,
            numero: numeroCuenta,
            banco: "BANTEC",
          },
        },
      });

    } catch (err) {
      console.error(err);
      // Mostramos el mensaje de error que viene del backend (ej: "Fondos insuficientes")
      setError(err.message || "Error al procesar el retiro.");
    }
  };

  return (
    <div className="retiro-page">
      <header className="retiro-header">
        <div className="rh-left">
          <img src={logo} alt="ARC BANK" className="rh-logo" />
          <div className="rh-cajero">
            <div className="rh-user-icon">
              <i className="fa-solid fa-user"></i>
            </div>
            <span className="rh-cajero-name">Cajero {primerNombre}</span>
          </div>
        </div>
        <div className="rh-center">RETIRO</div>

        <div className="rh-right">
          <button className="rh-link" onClick={irInicio}>
            <i className="fa-solid fa-house-chimney"></i> <span className="link-text">Inicio</span>
          </button>
          <button className="rh-link" onClick={cerrarSesion}>
            <i className="fa-solid fa-right-from-bracket"></i> <span className="link-text">Cerrar sesión</span>
          </button>
          <button className="rh-hamburger" onClick={() => setMenuOpen(s => !s)} aria-label="Toggle menu">☰</button>
        </div>

        {menuOpen && (
          <div className="mobile-menu">
            <button className="rh-link" onClick={irInicio}><i className="fa-solid fa-house-chimney"></i> <span className="link-text">Inicio</span></button>
            <button className="rh-link" onClick={cerrarSesion}><i className="fa-solid fa-right-from-bracket"></i> <span className="link-text">Cerrar sesión</span></button>
          </div>
        )}
      </header>

      <main className="retiro-main">
        <div className="retiro-search-row">
          <span className="cedula-label">Número de cuenta cliente</span>
          <div className="cedula-input-row">
            <input
              className="cedula-input"
              value={numeroCuenta}
              onChange={(e) => {
                const val = e.target.value;
                if (!/^\d*$/.test(val)) return;
                if (error) setError("");
                setNumeroCuenta(val);
              }}
              placeholder="Ingrese número de cuenta"
              onKeyDown={(e) => e.key === 'Enter' && buscarCuenta()}
            />
            <button className="btn-buscar" onClick={buscarCuenta}>
              Buscar
            </button>
          </div>
        </div>

        <section className="retiro-panel">
          <div className="retiro-left">
            <div className="retiro-field">
              <span className="label">Nombres</span>
              <input className="field-input" value={cliente.nombres} readOnly />
            </div>

            <div className="retiro-field">
              <span className="label">Cédula</span>
              <input className="field-input" value={cliente.cedula} readOnly />
            </div>
            <div className="retiro-field">
              <span className="label">Tipo de Cuenta</span>
              <input className="field-input" value={cliente.tipoCuenta} readOnly placeholder="Ahorros / Corriente" />
            </div>
          </div>

          <div className="retiro-divider"></div>

          <div className="retiro-right">
            <div className="retiro-field">
              <span className="label">Monto a retirar</span>
              <input
                className="field-input monto-input"
                value={monto}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d*(,\d{0,2})?$/.test(val)) {
                    setMonto(val);
                  }
                }}
                placeholder="$ 10"
              />
            </div>
          </div>
        </section>

        {error && <div className="retiro-error">{error}</div>}

        <div className="retiro-buttons">
          <button className="btn-amarillo" onClick={continuarRetiro}>
            Continuar
          </button>
          <button className="btn-amarillo btn-cancelar" onClick={irInicio}>
            Cancelar
          </button>
        </div>
      </main>
    </div>
  );
}