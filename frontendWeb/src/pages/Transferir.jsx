import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { realizarTransferencia, realizarTransferenciaInterbancaria, getCuentaPorNumero, getBancos, validarCuentaExterna } from '../services/bancaApi'
import { useNavigate } from "react-router-dom";
import { FiUser, FiHash, FiDollarSign, FiArrowRight, FiArrowLeft, FiCheck, FiDownload, FiInfo, FiCreditCard, FiGlobe } from 'react-icons/fi';
import './Transferir.css';

export default function Transfer() {
    const { state, addTransaction } = useAuth();
    const navigate = useNavigate();

    const accounts = state?.user?.accounts || [];
    const [step, setStep] = useState(1);

    // Form State
    const [banks, setBanks] = useState([]);
    const [selectedBank, setSelectedBank] = useState("BANTEC"); // Default to internal
    const [toAccountNum, setToAccountNum] = useState("");
    const [toName, setToName] = useState("");

    const [fromAccId, setFromAccId] = useState(accounts[0]?.id || '');
    const [destAccountObj, setDestAccountObj] = useState(null); // Only for internal
    const [amount, setAmount] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [validationMsg, setValidationMsg] = useState("");
    const [lastTxResponse, setLastTxResponse] = useState(null); // ValidacionCodigo: Estado para guardar respuesta

    useEffect(() => {
        if (accounts.length > 0 && !fromAccId) setFromAccId(accounts[0].id);
        loadBancos();
    }, [accounts]);

    const loadBancos = async () => {
        try {
            const lista = await getBancos();
            setBanks(lista);
            // Ensure BANTEC is selected if available, or default hardcoded
        } catch (e) {
            console.error("Error cargando bancos", e);
        }
    };

    const fromAccount = accounts.find(a => a.id === fromAccId) || accounts[0] || { number: '', balance: 0 };

    const handleValidateAccount = async () => {
        if (!toAccountNum) return setError("Ingrese un número de cuenta.");
        setError("");
        setValidationMsg("");
        setLoading(true);

        try {
            if (selectedBank === "BANTEC" || selectedBank === "ARCBANK") { // Assuming ARCBANK is "Internal" context for this user? Or maybe BANTEC is the internal one?
                // Logic says: BANTEC is the 'current' bank context usually.
                // Adapting to user context: "BnacoBantec" suggests this valid for Bantec.
                // If selectedBank is "BANTEC" (Internal)
                const cuentaDestino = await getCuentaPorNumero(toAccountNum);
                if (!cuentaDestino || !cuentaDestino.idCuenta) {
                    throw new Error("La cuenta no existe en BANTEC.");
                }
                if (String(cuentaDestino.idCuenta) === String(fromAccId)) {
                    throw new Error("No puede transferir a la misma cuenta de origen.");
                }
                setDestAccountObj(cuentaDestino);

                // Auto-fill name if available (mocked or real)
                // In internal API `getCuentaPorNumero` usually returns basic info. 
                // We might need an extra call to get Name if not present.
                // But for now let's assume valid.
                setValidationMsg("✅ Cuenta BANTEC verificada.");
                // BANTEC internal API doesn't always return name in search, let's allow user edit or use "Cliente BANTEC"
                if (!toName) setToName("Cliente BANTEC");

            } else {
                // External Validation
                setDestAccountObj(null);
                const resp = await validarCuentaExterna(selectedBank, toAccountNum);

                if (resp && resp.status === "SUCCESS" && resp.data.exists) {
                    setToName(resp.data.ownerName);
                    setValidationMsg(`✅ Cuenta validada: ${resp.data.ownerName}`);
                } else {
                    throw new Error(resp?.data?.mensaje || "No se pudo validar la cuenta en el banco destino.");
                }
            }
        } catch (e) {
            setError(e.message || "Error en validación.");
            setValidationMsg("");
        } finally {
            setLoading(false);
        }
    };

    const goToStep2 = async () => {
        if (!toAccountNum || !toName) return setError("Debe validar la cuenta o ingresar los datos completos.");
        if (selectedBank === "BANTEC" && !destAccountObj) {
            // Force validation for internal
            // If manual entry was allowed, we'd skip, but better ensure validation.
            // Let's call validate blindly if not done.
            await handleValidateAccount();
            if (error) return;
        }
        setStep(2);
    };

    const goToStep3 = () => {
        const num = Number(amount);
        if (!num || num <= 0) return setError("Monto inválido.");
        if (num > fromAccount.balance) return setError("Saldo insuficiente.");
        setError("");
        setStep(3);
    };

    const confirmTransfer = async () => {
        if (!fromAccId) return setError('Datos de cuenta inválidos.');
        setLoading(true);
        try {
            let responseTx = null;
            if (selectedBank === "BANTEC" || selectedBank === "ARCBANK") {
                // INTERNAL
                const request = {
                    tipoOperacion: "TRANSFERENCIA_INTERNA",
                    idCuentaOrigen: Number(fromAccId),
                    idCuentaDestino: destAccountObj ? destAccountObj.idCuenta : null, // Should exist
                    monto: Number(amount),
                    canal: "WEB",
                    descripcion: `Transferencia a ${toName}`,
                    idSucursal: 1
                }
                if (!request.idCuentaDestino) throw new Error("Error interno: ID Cuenta Destino faltante.");

                responseTx = await realizarTransferencia(request);

                // Add to local context history
                addTransaction({
                    accId: fromAccId,
                    amount: -Number(amount),
                    tipo: 'TRANSFERENCIA_INTERNA',
                    desc: `Transferencia a ${toName}`,
                    fecha: new Date().toISOString()
                });

            } else {
                // EXTERNAL
                const request = {
                    idCuentaOrigen: Number(fromAccId),
                    cuentaExterna: toAccountNum,
                    idBancoExterno: selectedBank,
                    monto: Number(amount),
                    descripcion: `Transferencia a ${toName} (${selectedBank})`,
                    beneficiario: toName,
                    idSucursal: 1
                };
                responseTx = await realizarTransferenciaInterbancaria(request);

                addTransaction({
                    accId: fromAccId,
                    amount: -Number(amount),
                    tipo: 'TRANSFERENCIA_SALIDA',
                    desc: `Transferencia a ${toName} (${selectedBank})`,
                    fecha: new Date().toISOString()
                });
            }

            if (responseTx) {
                setLastTxResponse(responseTx);
            }

            setStep(4);
        } catch (err) {
            setError(err.message || 'Error realizando la transferencia.');
        } finally {
            setLoading(false);
        }
    };

    const downloadReceipt = () => {
        const refCode = lastTxResponse?.codigoReferencia || "N/A";
        const text = `TRANSFERENCIA EXITOSA\n\nCódigo de Referencia: ${refCode}\nMonto: $${Number(amount).toFixed(2)}\nOrigen: ${fromAccount.number}\nBanco Destino: ${selectedBank}\nCuenta Destino: ${toAccountNum}\nBeneficiario: ${toName}\nFecha: ${new Date().toLocaleString()}\n`;
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
                <h2 className="transfer-title text-gradient">Transferencia de Fondos</h2>

                <div className="transfer-step-indicator">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`step-dot ${step === s ? 'active' : ''}`} />
                    ))}
                </div>

                <div className="transfer-card">
                    {step === 1 && (
                        <div className="step-content">
                            <div className="transfer-form-group">
                                <label><FiGlobe /> Banco Destino</label>
                                <select
                                    className="transfer-input"
                                    value={selectedBank}
                                    onChange={(e) => {
                                        setSelectedBank(e.target.value);
                                        setValidationMsg("");
                                        setError("");
                                        setToName("");
                                    }}
                                >
                                    <option value="BANTEC">Banco Bantec (Interno)</option>
                                    {banks.filter(b => b.codigo !== "BANTEC").map(b => (
                                        <option key={b.id} value={b.codigo}>{b.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="transfer-form-group">
                                <label><FiHash /> N° de cuenta destino</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        className="transfer-input"
                                        value={toAccountNum}
                                        maxLength={20}
                                        onChange={(e) => setToAccountNum(e.target.value.replace(/\D/g, ""))}
                                        placeholder="Ingrese número de cuenta"
                                    />
                                    <button
                                        className="btn"
                                        style={{ width: 'auto', padding: '0 15px', background: 'var(--primary)', fontSize: '0.9rem' }}
                                        onClick={handleValidateAccount}
                                        disabled={loading || !toAccountNum}
                                    >
                                        {loading ? '...' : 'Validar'}
                                    </button>
                                </div>
                            </div>

                            {validationMsg && <div className="success-msg" style={{ color: '#4caf50', marginBottom: 15, fontSize: '0.9rem' }}>{validationMsg}</div>}

                            <div className="transfer-form-group">
                                <label><FiUser /> Nombre Beneficiario</label>
                                <input
                                    className="transfer-input"
                                    value={toName}
                                    onChange={e => setToName(e.target.value)}
                                    placeholder="Nombre completo"
                                    readOnly={!!validationMsg} // Readonly if validated successfully?? maybe allow edit just in case
                                />
                            </div>

                            {error && <div className="transfer-error"><FiInfo /> {error}</div>}
                            <button className="btn btn-transfer" onClick={goToStep2} disabled={loading}>
                                Siguiente
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
                                    <span className="summary-label">Banco Destino</span>
                                    <span className="summary-value">{selectedBank}</span>
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
                            <p style={{ color: 'var(--text-muted)', marginBottom: 10 }}>Tu transferencia se ha procesado con éxito.</p>

                            {lastTxResponse && lastTxResponse.codigoReferencia && (
                                <div style={{
                                    background: 'rgba(255, 215, 0, 0.1)',
                                    border: '1px solid var(--primary)',
                                    padding: '15px',
                                    margin: '20px auto',
                                    maxWidth: '350px',
                                    borderRadius: '8px'
                                }}>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Código de Referencia</p>
                                    <p style={{ margin: '5px 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)', letterSpacing: '2px' }}>
                                        {lastTxResponse.codigoReferencia}
                                    </p>
                                    <p style={{ margin: '5px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Guarde este código para consultas o reclamos.
                                    </p>
                                </div>
                            )}

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
