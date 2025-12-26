import { useLocation, useNavigate, useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import logo from "../../assets/Logo.png";
import "./Comprobante.css";

export default function Comprobante() {
  const { id } = useParams();
  const nav = useNavigate();
  const stored = localStorage.getItem("cajero");
  const cajero = stored ? JSON.parse(stored) : { nombreCompleto: "Cajero Demo" };
  const primerNombre = cajero?.nombreCompleto?.split(" ")[0] || "Cajero";

  const location = useLocation();
  const state = location.state || {};

  // Si no hay estado (ej. refresh F5), mostramos valores por defecto o vacíos
  const tipo = state.tipo || "TRANSACCIÓN";
  const isDeposito = tipo === "DEPOSITO";
  const titulo = isDeposito ? "Depósito Exitoso" : "Retiro Exitoso";

  const monto = state.monto || 0.0;
  const costo = state.costo || 0.0;
  const saldoResultante = state.saldoResultante; // Nuevo campo del backend

  // Formateo de fecha seguro
  const formatFecha = (dateString) => {
    if (!dateString) return new Date().toLocaleString();
    try {
      return new Date(dateString).toLocaleString("es-EC");
    } catch (e) { return dateString; }
  };
  const fecha = formatFecha(state.fecha);
  const sucursal = state.sucursal || "Matriz";

  const depositante = state.depositante || { nombre: "---", identificacion: "---" };
  const cuenta = state.cuenta || { nombre: "---", cedula: "---", numero: "---", banco: "BANTEC" };

  const mascaraCuenta = (num) => {
    if (!num || num.length < 4) return num || "";
    const ultimos = num.slice(-4);
    return "******" + ultimos;
  };

  const cerrarSesion = () => {
    localStorage.removeItem("cajero");
    nav("/");
  };

  const irInicio = () => {
    nav("/seleccionar");
  };

  const handleImprimir = () => {
    const doc = new jsPDF();
    const labelOperacion = isDeposito ? "DEPÓSITO" : "RETIRO";

    doc.setFontSize(18);
    doc.text(`BANTEC`, 105, 20, null, null, "center");
    doc.setFontSize(14);
    doc.text(`Comprobante de ${labelOperacion}`, 105, 30, null, null, "center");

    doc.setFontSize(11);
    doc.text(`Fecha: ${fecha}`, 20, 45);
    doc.text(`Sucursal: ${sucursal}`, 20, 51);
    doc.text(`Cajero: ${cajero.nombreCompleto || "N/A"}`, 20, 57);
    doc.text(`ID Transacción: ${id || "---"}`, 20, 63);

    doc.line(20, 68, 190, 68); // Línea separadora

    doc.setFontSize(12);
    doc.text(`Monto: $ ${Number(monto).toFixed(2)}`, 20, 80);
    doc.text(`Costo: $ ${Number(costo).toFixed(2)}`, 100, 80);

    if (saldoResultante !== undefined) {
      doc.text(`Saldo Contable: $ ${Number(saldoResultante).toFixed(2)}`, 20, 88);
    }

    doc.setFontSize(11);
    doc.text("Detalles de la Cuenta:", 20, 100);
    doc.setFontSize(10);
    doc.text(`Titular: ${cuenta.nombre}`, 20, 106);
    doc.text(`Cuenta: ${cuenta.numero}`, 20, 112);

    if (isDeposito) {
      doc.text("Datos Depositante:", 100, 100);
      doc.text(`Nombre: ${depositante.nombre}`, 100, 106);
      doc.text(`CI: ${depositante.identificacion}`, 100, 112);
    }

    doc.save(`BANTEC_${labelOperacion}_${id}.pdf`);
  };

  return (
    <div className="comp-page">
      <header className="retiro-header">
        <div className="rh-left">
          <img src={logo} alt="BANTEC" className="rh-logo" />
          <div className="rh-cajero">
            <div className="rh-user-icon"><i className="fa-solid fa-user"></i></div>
            <span className="rh-cajero-name">{primerNombre}</span>
          </div>
        </div>
        <div className="rh-center">COMPROBANTE</div>
        <div className="rh-right">
          <button className="rh-link" onClick={irInicio}>
            <i className="fa-solid fa-house-chimney"></i> <span className="link-text">Inicio</span>
          </button>
          <button className="rh-link" onClick={cerrarSesion}>
            <i className="fa-solid fa-right-from-bracket"></i> <span className="link-text">Salir</span>
          </button>
        </div>
      </header>

      <main className="comp-main">
        <section className="comp-card">
          <div className="comp-check">
            <div className="comp-check-circle">
              <i className="fa-solid fa-check"></i>
            </div>
            <h2 className="comp-title">{titulo}</h2>
            <p className="comp-id-transaccion">ID: {id}</p>
          </div>

          <div className="comp-row">
            <div className="comp-col-left">
              <span className="comp-label-strong">Monto Operación</span>
              <span className="comp-label">Costo</span>
              {saldoResultante !== undefined && <span className="comp-label">Saldo Actual</span>}
              <span className="comp-label">Fecha</span>
              <span className="comp-label">Sucursal</span>
            </div>

            <div className="comp-col-right">
              <span className="comp-amount">$ {Number(monto).toFixed(2)}</span>
              <span className="comp-text">$ {Number(costo).toFixed(2)}</span>
              {saldoResultante !== undefined && <span className="comp-text">$ {Number(saldoResultante).toFixed(2)}</span>}
              <span className="comp-text">{fecha}</span>
              <span className="comp-text">{sucursal}</span>
            </div>
          </div>

          <hr className="comp-divider" />

          {isDeposito ? (
            <div className="comp-details-grid">
              <div className="comp-detail-box">
                <div className="comp-section-title">Depositante</div>
                <p><strong>Nombre:</strong> {depositante.nombre}</p>
                <p><strong>CI:</strong> {depositante.identificacion}</p>
              </div>
              <div className="comp-detail-box">
                <div className="comp-section-title">Destino</div>
                <p><strong>Nombre:</strong> {cuenta.nombre}</p>
                <p><strong>Cuenta:</strong> {mascaraCuenta(cuenta.numero)}</p>
              </div>
            </div>
          ) : (
            <div className="comp-details-grid">
              <div className="comp-detail-box">
                <div className="comp-section-title">Cuenta Origen</div>
                <p><strong>Titular:</strong> {cuenta.nombre}</p>
                <p><strong>Cuenta:</strong> {mascaraCuenta(cuenta.numero)}</p>
                <p><strong>CI:</strong> {cuenta.cedula}</p>
              </div>
            </div>
          )}

          <div className="comp-actions">
            <button className="btn-amarillo comp-print-btn" onClick={handleImprimir}>
              <i className="fa-solid fa-file-arrow-down"></i> Descargar PDF
            </button>
            <button className="btn-secondary comp-print-btn" onClick={irInicio} style={{ marginTop: '10px' }}>
              Nueva Transacción
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}