import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { realizarTransferenciaInterbancaria } from '../services/bancaApi'
import { useNavigate } from "react-router-dom";
import { FiHash, FiUser, FiArrowRight, FiCheck, FiDownload, FiInfo, FiCreditCard, FiActivity } from 'react-icons/fi';
import { MdOutlineAccountBalance } from 'react-icons/md';
import './Transferir.css';

export default function TransaccionesInterbancarias() {
    const { state, addTransaction } = useAuth();
    const navigate = useNavigate();

    const accounts = state?.user?.accounts || [];
    const firstAccId = accounts[0]?.id || '';

    const [step, setStep] = useState(1);
    const [toAccount, setToAccount] = useState("");
    const [bankBic, setBankBic] = useState("");
    const [banks, setBanks] = useState([]);
    const [toName, setToName] = useState("");
    const [fromAccId, setFromAccId] = useState(firstAccId);
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const BANCOS_REGISTRADOS = [
        { id: 'NEXUS_BANK', nombre: 'Nexus Bank', codigo: 'NEXUS_BANK', bin: '270100' },
        { id: 'ECUSOL_BK', nombre: 'Ecusol Bank', codigo: 'ECUSOL_BK', bin: '370100' },
        { id: 'ARCBANK', nombre: 'Arcbank', codigo: 'ARCBANK', bin: '400000' },
    ];

    useEffect(() => {
        setBanks(BANCOS_REGISTRADOS);
        if (accounts.length > 0 && !fromAccId) setFromAccId(accounts[0].id);
    }, [accounts, fromAccId]);

    const fromAccount = accounts.find(a => a.id === fromAccId) || accounts[0] || { number: '---', balance: 0 };

    const goToStep2 = () => {
        if (!toAccount || !bankBic || !toName) return setError("Todos los campos son obligatorios.");
        if (!/^\d+$/.test(toAccount)) return setError("El número de cuenta solo debe contener números.");
        if (toAccount.length < 6) return setError("El número de cuenta parece inválido.");
        setError("");
        setStep(2);
    };

    const goToStep3 = () => {
        const num = Number(amount);
        if (!num || num <= 0) return setError("Monto inválido.");
        if (num > (fromAccount.balance || 0)) return setError("Saldo insuficiente.");
        setError("");
        setStep(3);
    };

    const confirmTransfer = async () => {
        if (!fromAccId) return setError('Seleccione una cuenta de origen válida.');
        setLoading(true);
        try {
            const request = {
                tipoOperacion: "TRANSFERENCIA_SALIDA",
                idCuentaOrigen: Number(fromAccId),
                cuentaExterna: toAccount,
                idBancoExterno: bankBic,
                beneficiario: toName,
                monto: Number(amount),
                canal: "WEB",
                descripcion: `Transferencia a ${toName} - Banco ${bankBic}`
            }
            await realizarTransferenciaInterbancaria(request);
            addTransaction({
                accId: fromAccId,
                amount: -Number(amount),
                tipo: 'TRANSFERENCIA_SALIDA',
                desc: `Transferencia a ${toName} (${bankBic})`,
                fecha: new Date().toISOString()
            });
            setStep(4);
        } catch (err) {
            setError(err.message || 'Error en la transferencia interbancaria');
        } finally {
            setLoading(false);
        }
    };

    const downloadReceipt = () => {
        const text = `TRANSFERENCIA INTERBANCARIA EXITOSA\n\nMonto: $${Number(amount).toFixed(2)}\nDesde cuenta: ${fromAccount.number}\nA nombre de: ${toName}\nCuenta destino: ${toAccount}\nBanco destino: ${bankBic}\nFecha: ${new Date().toLocaleString()}\n`;
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `comprobante_bantec_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const getBankName = (bic) => {
        const b = banks.find(x => x.id === bic || x.codigo === bic);
        return b ? b.nombre : bic;
    };

    if (accounts.length === 0) {
        return <div className="transfer-page"><div className="transfer-error">No tiene cuentas activas para operar.</div></div>;
    }

    return (
        <div className="transfer-page">
            <div className="transfer-container">
                <h2 className="transfer-title text-gradient">Pagos Interbancarios</h2>

                <div className="transfer-step-indicator">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`step-dot ${step === s ? 'active' : ''}`} />
                    ))}
                </div>

                <div className="transfer-card">
                    {step === 1 && (
                        <div className="step-content">
                            <div className="transfer-form-group">
                                <label><MdOutlineAccountBalance /> Banco Destino</label>
                                <select className="transfer-input" value={bankBic} onChange={e => setBankBic(e.target.value)}>
                                    <option value="">Seleccione Entidad</option>
                                    {banks.map((b) => (
                                        <option key={b.id || b.codigo} value={b.codigo || b.id}>
                                            {b.nombre} (B.I.C: {b.codigo})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="transfer-form-group">
                                <label><FiHash /> N° de Cuenta Externo</label>
                                <input
                                    className="transfer-input"
                                    value={toAccount}
                                    onChange={(e) => setToAccount(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Ingrese número de cuenta"
                                />
                            </div>
                            <div className="transfer-form-group">
                                <label><FiUser /> Nombre Beneficiario</label>
                                <input
                                    className="transfer-input"
                                    value={toName}
                                    onChange={e => setToName(e.target.value)}
                                    placeholder="Nombre del titular"
                                />
                            </div>
                            {error && <div className="transfer-error"><FiInfo /> {error}</div>}
                            <button className="btn btn-transfer" onClick={goToStep2} disabled={loading}>
                                Continuar
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="step-content">
                            <div className="transfer-form-group">
                                <label><FiCreditCard /> Cuenta de Origen</label>
                                <select className="transfer-input" value={fromAccId} onChange={(e) => setFromAccId(e.target.value)}>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.type} — {acc.number} (${acc.balance?.toFixed(2)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="transfer-form-group">
                                <label><FiActivity /> Monto a Enviar</label>
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
                            <div className="transfer-info-box" style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.1)', padding: 15, borderRadius: 12, marginBottom: 24, fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
                                <FiInfo style={{ marginRight: 8 }} /> Esta transferencia interbancaria puede tardar hasta 24h.
                            </div>
                            {error && <div className="transfer-error"><FiInfo /> {error}</div>}
                            <div className="transfer-button-row">
                                <button className="btn-back" onClick={() => setStep(1)}>Atrás</button>
                                <button className="btn btn-transfer" onClick={goToStep3}>Confirmar Monto</button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="step-content">
                            <h3 style={{ marginBottom: 20, color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>Revisión de Datos Final</h3>
                            <div className="transfer-summary">
                                <div className="summary-item">
                                    <span className="summary-label">Monto</span>
                                    <span className="summary-value amount-highlight">${Number(amount).toFixed(2)}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Comisión</span>
                                    <span className="summary-value">$0.45</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Destino</span>
                                    <span className="summary-value">{getBankName(bankBic)}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Beneficiario</span>
                                    <span className="summary-value">{toName}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">N° Cuenta</span>
                                    <span className="summary-value">{toAccount}</span>
                                </div>
                            </div>
                            {error && <div className="transfer-error" style={{ marginTop: 20 }}><FiInfo /> {error}</div>}
                            <div className="transfer-button-row">
                                <button className="btn-back" onClick={() => setStep(2)} disabled={loading}>Modificar</button>
                                <button className="btn btn-transfer" onClick={confirmTransfer} disabled={loading}>
                                    {loading ? 'Procesando...' : 'Confirmar y Enviar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="step-content success-state" style={{ textAlign: 'center' }}>
                            <div className="success-icon"><FiCheck /></div>
                            <h2 className="success-title">Enviado a Red</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 30 }}>La transferencia está siendo procesada por el Switch Interbancario.</p>
                            <div className="transfer-button-row">
                                <button className="btn-back" onClick={() => navigate('/movimientos')}>Ir al Inicio</button>
                                <button className="btn btn-transfer" style={{ background: 'var(--grad-gold)', color: '#000' }} onClick={downloadReceipt}>
                                    <FiDownload style={{ marginRight: 8 }} /> Comprobante
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
