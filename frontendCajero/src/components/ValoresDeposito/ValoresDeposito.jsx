import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { clientes, cuentas, transacciones } from "../../services/api";
import logo from "../../assets/Logo.png";
import "../ValoresTransaccion/ValoresTransaccion.css";

export default function ValoresDeposito() {
  const nav = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const stored = localStorage.getItem("cajero");
  const cajero = stored ? JSON.parse(stored) : { nombreCompleto: "Cajero Demo", idCajero: 1 };
  const primerNombre = cajero?.nombreCompleto?.split(" ")[0] || "Cajero";

  const [cedulaDepositante, setCedulaDepositante] = useState("");
  const [numeroCuentaCliente, setNumeroCuentaCliente] = useState("");

  // Estado nuevo para guardar el ID de la cuenta destino
  const [cuentaInfo, setCuentaInfo] = useState(null);

  const [depositante, setDepositante] = useState({
    nombres: "",
    apellidos: "",
  });

  const [cliente, setCliente] = useState({
    nombres: "",
    apellidos: "",
    cedula: "",
    tipoCuenta: "",
  });

  const [monto, setMonto] = useState("");
  const [error, setError] = useState("");

  // 1. Buscar Depositante (Quien entrega el dinero)
  const buscarDepositante = async () => {
    setError("");

    if (!cedulaDepositante || cedulaDepositante.length !== 10) {
      setError("La cédula del depositante debe tener exactamente 10 dígitos.");
      return;
    }

    try {
      const data = await clientes.getByCedula(cedulaDepositante);
      setDepositante({
        nombres: data.nombres || "",
        apellidos: data.apellidos || "",
      });
    } catch (e) {
      // Si no existe, permitimos continuar pero limpiamos nombres (o podrías bloquear)
      setDepositante({ nombres: "", apellidos: "" });
      setError("No existe un cliente registrado con esa cédula (Puede continuar como anónimo o registrarlo).");
    }
  };

  // 2. Buscar Cuenta Destino (Donde va el dinero)
  const buscarCuentaPorNumero = async () => {
    setError("");
    setCuentaInfo(null); // Resetear búsqueda previa

    if (!numeroCuentaCliente || numeroCuentaCliente.length < 10) {
      setError("El número de cuenta debe tener al menos 10 dígitos.");
      return;
    }

    try {
      // Usamos el endpoint que busca por string y devuelve el objeto con ID
      const data = await cuentas.getByNumeroCuenta(numeroCuentaCliente);

      // Guardamos la info vital (idCuenta)
      setCuentaInfo(data);

      // Ahora buscamos los datos del cliente propietario de la cuenta
      let clienteData = { nombreCompleto: "Cliente", identificacion: "" };
      if (data.idCliente) {
        try {
          clienteData = await clientes.getById(data.idCliente);
        } catch (e) {
          console.warn("No se pudo obtener cliente:", e);
        }
      }

      setCliente({
        nombres: clienteData.nombreCompleto || "Cliente",
        apellidos: "",
        cedula: clienteData.identificacion || String(data.idCliente || ""),
        tipoCuenta: "AHORROS",
      });
    } catch (e) {
      setCliente({ nombres: "", apellidos: "", cedula: "", tipoCuenta: "" });
      setError("No existe una cuenta con ese número.");
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("cajero");
    nav("/");
  };

  const irInicio = () => {
    nav("/seleccionar");
  };

  // 3. Ejecutar Depósito
  const continuarDeposito = async () => {
    setError("");

    // Validar que se haya buscado la cuenta destino
    if (!cuentaInfo || !cuentaInfo.idCuenta) {
      setError("Debe buscar y validar la cuenta de destino antes de continuar.");
      return;
    }

    if (!monto) {
      setError("Debe ingresar un monto válido.");
      return;
    }

    const montoNumber = parseFloat(monto.replace(",", "."));

    try {
      // Construimos el DTO exacto que espera Java (TransaccionRequestDTO)
      const body = {
        tipoOperacion: "DEPOSITO",
        idCuentaDestino: cuentaInfo.idCuenta, // Integer ID obligatorio
        monto: montoNumber,
        canal: "VENTANILLA",
        // Concatenamos info extra en la descripción ya que el DTO no tiene esos campos específicos
        descripcion: `Depósito realizado por CI: ${cedulaDepositante} - ${depositante.nombres}`,
        idSucursal: 1 // Debería venir del objeto cajero
      };

      // Usamos 'crear' del api.js que mapea a POST /api/transacciones
      const response = await transacciones.crear(body);

      // Redirigir al comprobante
      const idTransaccion = response.idTransaccion || response.id;

      nav(`/comprobante/${idTransaccion}`, {
        state: {
          tipo: "DEPOSITO",
          monto: montoNumber,
          costo: response.costo || 0,
          saldoResultante: response.saldoResultante,
          fecha: response.fechaCreacion || new Date().toLocaleDateString("es-EC"),
          sucursal: response.sucursal || "La Napo",
          depositante: {
            nombre: `${depositante.nombres} ${depositante.apellidos}`.trim(),
            identificacion: cedulaDepositante,
          },
          cuenta: {
            nombre: `${cliente.nombres} ${cliente.apellidos}`.trim(),
            cedula: cliente.cedula,
            numero: numeroCuentaCliente,
            banco: "BANTEC",
          },
        },
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "Error al procesar el depósito.");
    }
  };

  return (
    <div className="retiro-page deposito-page">
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

        <div className="rh-center">DEPOSITO</div>

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
        <section className="deposit-panel">
          <div className="deposit-top-row">
            {/* Columna Izquierda: Datos del Depositante */}
            <div className="deposit-col">
              <div className="cedula-label">Número de cédula depositante</div>

              <div className="cedula-input-row">
                <input
                  className="cedula-input"
                  value={cedulaDepositante}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!/^\d*$/.test(val)) return;
                    if (val.length > 10) {
                      setError("La cédula del depositante no puede tener más de 10 dígitos.");
                      return;
                    }
                    if (error && error.includes("cédula")) setError("");
                    setCedulaDepositante(val);
                  }}
                  placeholder="1726589895"
                  onBlur={() => { if (cedulaDepositante.length === 10) buscarDepositante() }}
                />
                {/* Botón opcional para buscar explícitamente */}
                <button className="btn-buscar-small" onClick={buscarDepositante}><i className="fa-solid fa-magnifying-glass"></i></button>
              </div>

              <div className="retiro-field">
                <span className="label">Nombres</span>
                <input
                  className="field-input"
                  value={depositante.nombres}
                  onChange={(e) => setDepositante({ ...depositante, nombres: e.target.value })}
                />
              </div>

              <div className="retiro-field">
                <span className="label">Apellidos</span>
                <input
                  className="field-input"
                  value={depositante.apellidos}
                  onChange={(e) => setDepositante({ ...depositante, apellidos: e.target.value })}
                />
              </div>
            </div>

            <div className="deposit-divider"></div>

            {/* Columna Derecha: Datos de la Cuenta Destino */}
            <div className="deposit-col">
              <div className="cedula-label">Número de cuenta destino</div>

              <div className="cedula-input-row">
                <input
                  className="cedula-input"
                  value={numeroCuentaCliente}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!/^\d*$/.test(val)) return;
                    if (val.length > 12) {
                      setError("El número de cuenta no puede tener más de 12 dígitos.");
                      return;
                    }
                    if (error && error.includes("cuenta")) setError("");
                    setNumeroCuentaCliente(val);
                  }}
                  placeholder="2258102613"
                />

                <button className="btn-buscar" onClick={buscarCuentaPorNumero}>
                  Buscar
                </button>
              </div>

              <div className="retiro-field">
                <span className="label">Nombres</span>
                <input className="field-input" value={cliente.nombres} readOnly />
              </div>

              <div className="retiro-field">
                <span className="label">Apellidos</span>
                <input className="field-input" value={cliente.apellidos} readOnly />
              </div>

              <div className="retiro-field">
                <span className="label">Cédula Titular</span>
                <input className="field-input" value={cliente.cedula} readOnly />
              </div>

              <div className="retiro-field">
                <span className="label">Tipo de Cuenta</span>
                <input
                  className="field-input"
                  value={cliente.tipoCuenta}
                  readOnly
                  placeholder="Ahorros / Corriente"
                />
              </div>
            </div>
          </div>

          <div className="deposit-monto-row">
            <span className="label">Monto a depositar</span>
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

          <div className="deposit-buttons-row">
            <button className="btn-amarillo" onClick={continuarDeposito}>
              Continuar
            </button>

            <button className="btn-amarillo btn-cancelar" onClick={irInicio}>
              Cancelar
            </button>
          </div>
          {error && <div className="retiro-error">{error}</div>}
        </section>
      </main>
    </div>
  );
}