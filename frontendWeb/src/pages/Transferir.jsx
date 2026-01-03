import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { realizarTransferencia, getCuentaPorNumero } from '../services/bancaApi'
import { useNavigate } from "react-router-dom";
import { FiUser, FiHash, FiDollarSign, FiArrowRight, FiArrowLeft, FiCheck, FiDownload, FiInfo, FiCreditCard } from 'react-icons/fi';
import './Transferir.css';

export default function Transfer() {
    const { state, addTransaction } = useAuth();
    const navigate = useNavigate();

    const accounts = state?.user?.accounts || [];
    const [step, setStep] = useState(1);
    const [toAccountNum, setToAccountNum] = useState("");
    const [toName, setToName] = useState("");
    const [fromAccId, setFromAccId] = useState(accounts[0]?.id || '');
    const [destAccountObj, setDestAccountObj] = useState(null);
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (accounts.length > 0 && !fromAccId) setFromAccId(accounts[0].id);
    }, [accounts]);

    const fromAccount = accounts.find(a => a.id === fromAccId) || accounts[0] || { number: '', balance: 0 };

    const goToStep2 = async () => {
        setError("");
        if (!toAccountNum || !toName) return setError("Todos los campos son obligatorios.");
        setLoading(true);
        try {
            const cuentaDestino = await getCuentaPorNumero(toAccountNum);
            if (!cuentaDestino || !cuentaDestino.idCuenta) {
                throw new Error("La cuenta destino no existe en BANTEC.");
            }
            if (String(cuentaDestino.idCuenta) === String(fromAccId)) {
                throw new Error("No puede transferir a la misma cuenta de origen.");
            }
            setDestAccountObj(cuentaDestino);
            setStep(2);
        } catch (e) {
            setError(e.message || "Error validando cuenta destino.");
        } finally {
            setLoading(false);
        }
    };

    const goToStep3 = () => {
        const num = Number(amount);
        if (!num || num <= 0) return setError("Monto inválido.");
        if (num > fromAccount.balance) return setError("Saldo insuficiente.");
        setError("");
        setStep(3);
    };

    const confirmTransfer = async () => {
        if (!fromAccId || !destAccountObj?.idCuenta) return setError('Datos de cuenta inválidos.');
        setLoading(true);
        try {
            const request = {
                tipoOperacion: "TRANSFERENCIA_INTERNA",
                idCuentaOrigen: Number(fromAccId),
                idCuentaDestino: destAccountObj.idCuenta,
                monto: Number(amount),
                canal: "WEB",
                descripcion: `Transferencia a ${toName}`,
                idSucursal: 1
            }
            await realizarTransferencia(request);
            addTransaction({
                accId: fromAccId,
                amount: -Number(amount),
                tipo: 'TRANSFERENCIA_INTERNA',
                desc: `Transferencia a ${toName}`,
                fecha: new Date().toISOString()
            });
            const isOwnAccount = accounts.some(a => String(a.id) === String(destAccountObj.idCuenta));
            if (isOwnAccount) {
                addTransaction({
                    accId: String(destAccountObj.idCuenta),
                    amount: Number(amount),
                    tipo: 'TRANSFERENCIA_ENTRANTE',
                    desc: `Transferencia recibida de ${fromAccount.number}`,
                    fecha: new Date().toISOString()
                });
            }
            setStep(4);
        } catch (err) {
            setError(err.message || 'Error realizando la transferencia.');
        } finally {
            setLoading(false);
        }
    };

    const downloadReceipt = () => {
        const text = `TRANSFERENCIA EXITOSA\n\nMonto: $${Number(amount).toFixed(2)}\nOrigen: ${fromAccount.number}\nDestino: ${toAccountNum} (${toName})\nFecha: ${new Date().toLocaleString()}\n`;
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `comprobante_bantec_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (accounts.length === 0) {
        return <div className="transfer-page"><div className="transfer-error">No tiene cuentas activas para operar.</div></div>;
    }

    return (
        <div className="transfer-page">
            <div className="transfer-container">
                <h2 className="transfer-title text-gradient">Transferir a Cuentas BANTEC</h2>

                <div className="transfer-step-indicator">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`step-dot ${step === s ? 'active' : ''}`} />
                    ))}
                </div>

                <div className="transfer-card">
                    {step === 1 && (
                        <div className="step-content">
                            <div className="transfer-form-group">
                                <label><FiHash /> N° de cuenta destino</label>
                                <input
                                    className="transfer-input"
                                    value={toAccountNum}
                                    maxLength={12}
                                    onChange={(e) => setToAccountNum(e.target.value.replace(/\D/g, ""))}
                                    placeholder="Ingrese los 12 dígitos"
                                />
                            </div>
                            <div className="transfer-form-group">
                                <label><FiUser /> Nombre Beneficiario</label>
                                <input
                                    className="transfer-input"
                                    value={toName}
                                    onChange={e => setToName(e.target.value)}
                                    placeholder="Nombre completo"
                                />
                            </div>
                            {error && <div className="transfer-error"><FiInfo /> {error}</div>}
                            <button className="btn btn-transfer" onClick={goToStep2} disabled={loading}>
                                {loading ? 'Validando...' : 'Siguiente'}
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="step-content">
                            <div className="transfer-form-group">
                                <label><FiCreditCard /> Seleccionar Origen</label>
                                <select className="transfer-input" value={fromAccId} onChange={e => setFromAccId(e.target.value)}>
                                    {accounts.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.type} — {a.number} (${a.balance.toFixed(2)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="transfer-form-group">
                                <label><FiDollarSign /> Monto a enviar</label>
                                <input
                                    className="transfer-input"
                                    value={amount}
                                    onChange={e => {
                                        const val = e.target.value;
                                        if (/^\d*\.?\d{0,2}$/.test(val)) setAmount(val);
                                    }}
                                    placeholder="0.00"
                                />
                            </div>
                            {error && <div className="transfer-error"><FiInfo /> {error}</div>}
                            <div className="transfer-button-row">
                                <button className="btn-back" onClick={() => setStep(1)}>Atrás</button>
                                <button className="btn btn-transfer" onClick={goToStep3}>Continuar</button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="step-content">
                            <h3 style={{ marginBottom: 20, color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>Por favor confirme los detalles</h3>
                            <div className="transfer-summary">
                                <div className="summary-item">
                                    <span className="summary-label">Monto Total</span>
                                    <span className="summary-value amount-highlight">${Number(amount).toFixed(2)}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Desde</span>
                                    <span className="summary-value">{fromAccount.number}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Para</span>
                                    <span className="summary-value">{toName}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">N° Cuenta</span>
                                    <span className="summary-value">{toAccountNum}</span>
                                </div>
                            </div>
                            {error && <div className="transfer-error" style={{ marginTop: 20 }}><FiInfo /> {error}</div>}
                            <div className="transfer-button-row">
                                <button className="btn-back" onClick={() => setStep(2)} disabled={loading}>Modificar</button>
                                <button className="btn btn-transfer" onClick={confirmTransfer} disabled={loading}>
                                    {loading ? 'Procesando...' : 'Confirmar Envío'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="step-content success-state" style={{ textAlign: 'center' }}>
                            <div className="success-icon"><FiCheck /></div>
                            <h2 className="success-title">Envío Exitoso</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 30 }}>Tu transferencia se ha procesado con éxito.</p>
                            <div className="transfer-button-row">
                                <button className="btn-back" onClick={() => navigate('/movimientos')}>Ir a Inicio</button>
                                <button className="btn btn-transfer" style={{ background: 'var(--grad-gold)', color: '#000' }} onClick={downloadReceipt}>
                                    <FiDownload style={{ marginRight: 8 }} /> Recibo
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
