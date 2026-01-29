import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar.jsx";
import { transacciones } from "../services/api.js";
import "./GestionDevoluciones.css";

export default function GestionDevoluciones() {
    const navigate = useNavigate();

    const cajeroStorage = localStorage.getItem("cajero");
    const cajero = cajeroStorage
        ? JSON.parse(cajeroStorage)
        : { nombreCompleto: "Cajero Demo" };

    const [referencia, setReferencia] = useState("");
    const [transaccion, setTransaccion] = useState(null);
    const [motivos, setMotivos] = useState([]);
    const [motivoSeleccionado, setMotivoSeleccionado] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Cargar motivos de devolución al montar
    useEffect(() => {
        const cargarMotivos = async () => {
            try {
                const data = await transacciones.getMotivosDevolucion();
                // Esperamos un array de objetos con codigo y descripcion
                if (Array.isArray(data)) {
                    setMotivos(data);
                } else {
                    // Fallback con catálogo local
                    setMotivos([
                        { codigo: "AC01", descripcion: "Número de cuenta incorrecto" },
                        { codigo: "AC04", descripcion: "Cuenta cerrada" },
                        { codigo: "AC06", descripcion: "Cuenta bloqueada" },
                        { codigo: "AG01", descripcion: "Transacción prohibida" },
                        { codigo: "AM04", descripcion: "Fondos insuficientes" },
                        { codigo: "AM05", descripcion: "Duplicado" },
                        { codigo: "MS03", descripcion: "Error técnico en entidad destino" },
                        { codigo: "RC01", descripcion: "Identificador de banco incorrecto" },
                    ]);
                }
            } catch (err) {
                console.error("Error cargando motivos:", err);
                // Fallback con catálogo local
                setMotivos([
                    { codigo: "AC01", descripcion: "Número de cuenta incorrecto" },
                    { codigo: "AC04", descripcion: "Cuenta cerrada" },
                    { codigo: "AC06", descripcion: "Cuenta bloqueada" },
                    { codigo: "AG01", descripcion: "Transacción prohibida" },
                    { codigo: "AM04", descripcion: "Fondos insuficientes" },
                    { codigo: "AM05", descripcion: "Duplicado" },
                    { codigo: "MS03", descripcion: "Error técnico en entidad destino" },
                    { codigo: "RC01", descripcion: "Identificador de banco incorrecto" },
                ]);
            }
        };
        cargarMotivos();
    }, []);

    const handleValidar = async () => {
        if (!referencia.trim()) {
            setError("Ingrese una referencia de transacción.");
            return;
        }

        setError("");
        setSuccess("");
        setTransaccion(null);
        setLoading(true);

        try {
            const data = await transacciones.buscarPorReferencia(referencia.trim());
            setTransaccion(data);
        } catch (err) {
            setError(err.message || "No se encontró la transacción.");
        } finally {
            setLoading(false);
        }
    };

    const handleDevolucion = async () => {
        if (!transaccion) {
            setError("Primero valide una transacción.");
            return;
        }
        if (!motivoSeleccionado) {
            setError("Seleccione un motivo de devolución.");
            return;
        }

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await transacciones.solicitarReverso({
                idTransaccion: transaccion.idTransaccion,
                motivo: motivoSeleccionado,
            });

            setSuccess("¡Devolución procesada exitosamente!");
            setTransaccion(null);
            setReferencia("");
            setMotivoSeleccionado("");
        } catch (err) {
            setError(err.message || "Error al procesar la devolución.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            return new Date(dateStr).toLocaleString("es-EC");
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="dev-container">
            <Sidebar cajero={cajero} />

            <main className="dev-main">
                <div className="dev-header-box">
                    <div className="dev-header-content">
                        <div className="dev-header-icon">
                            <i className="fa-solid fa-rotate-left"></i>
                        </div>
                        <div className="dev-header-text">
                            <p className="dev-title">Gestión de Devoluciones</p>
                        </div>
                    </div>
                </div>

                <div className="dev-card">
                    <div className="dev-form-group">
                        <label>Referencia de Transacción</label>
                        <div className="dev-input-row">
                            <input
                                type="text"
                                className="dev-input"
                                placeholder="Ej: abc123-def456..."
                                value={referencia}
                                onChange={(e) => setReferencia(e.target.value)}
                                disabled={loading}
                            />
                            <button
                                className="dev-btn dev-btn-primary"
                                onClick={handleValidar}
                                disabled={loading || !referencia.trim()}
                            >
                                {loading ? "Buscando..." : "Validar"}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="dev-error">
                            <i className="fa-solid fa-circle-exclamation"></i> {error}
                        </div>
                    )}

                    {success && (
                        <div className="dev-success">
                            <i className="fa-solid fa-circle-check"></i> {success}
                        </div>
                    )}

                    {transaccion && (
                        <div className="dev-transaction-details">
                            <h3>Detalles de la Transacción</h3>
                            <div className="dev-details-grid">
                                <div className="dev-detail-item">
                                    <span className="dev-label">ID</span>
                                    <span className="dev-value">{transaccion.idTransaccion}</span>
                                </div>
                                <div className="dev-detail-item">
                                    <span className="dev-label">Referencia</span>
                                    <span className="dev-value">{transaccion.referencia}</span>
                                </div>
                                <div className="dev-detail-item">
                                    <span className="dev-label">Tipo</span>
                                    <span className="dev-value">{transaccion.tipoOperacion}</span>
                                </div>
                                <div className="dev-detail-item">
                                    <span className="dev-label">Monto</span>
                                    <span className="dev-value dev-amount">
                                        ${Number(transaccion.monto || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="dev-detail-item">
                                    <span className="dev-label">Estado</span>
                                    <span className={`dev-value dev-status dev-status-${(transaccion.estado || "").toLowerCase()}`}>
                                        {transaccion.estado}
                                    </span>
                                </div>
                                <div className="dev-detail-item">
                                    <span className="dev-label">Fecha</span>
                                    <span className="dev-value">{formatDate(transaccion.fechaCreacion)}</span>
                                </div>
                                <div className="dev-detail-item dev-full-width">
                                    <span className="dev-label">Descripción</span>
                                    <span className="dev-value">{transaccion.descripcion || "Sin descripción"}</span>
                                </div>
                            </div>

                            <div className="dev-form-group" style={{ marginTop: 24 }}>
                                <label>Motivo de Devolución</label>
                                <select
                                    className="dev-input"
                                    value={motivoSeleccionado}
                                    onChange={(e) => setMotivoSeleccionado(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="">Seleccione un motivo...</option>
                                    {motivos.map((m) => (
                                        <option key={m.codigo} value={m.codigo}>
                                            {m.codigo} - {m.descripcion}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="dev-actions">
                                <button
                                    className="dev-btn dev-btn-secondary"
                                    onClick={() => {
                                        setTransaccion(null);
                                        setReferencia("");
                                        setMotivoSeleccionado("");
                                        setError("");
                                        setSuccess("");
                                    }}
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="dev-btn dev-btn-danger"
                                    onClick={handleDevolucion}
                                    disabled={loading || !motivoSeleccionado}
                                >
                                    {loading ? "Procesando..." : "Ejecutar Devolución"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    className="dev-back-link"
                    onClick={() => navigate("/seleccionar")}
                >
                    <i className="fa-solid fa-arrow-left"></i> Volver al Inicio
                </button>
            </main>
        </div>
    );
}
