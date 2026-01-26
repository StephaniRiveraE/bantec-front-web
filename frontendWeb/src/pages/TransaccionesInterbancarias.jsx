import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { realizarTransferenciaInterbancaria, getBancos, getTransferStatus } from '../services/bancaApi'
import { useNavigate } from "react-router-dom";
import { FiHash, FiUser, FiArrowRight, FiCheck, FiDownload, FiInfo, FiCreditCard, FiActivity } from 'react-icons/fi';
import { MdOutlineAccountBalance } from 'react-icons/md';
import './Transferir.css';

export default function TransaccionesInterbancarias() {
    const { state, addTransaction, refreshAccounts } = useAuth();
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
    const [loadingBanks, setLoadingBanks] = useState(false);

    // Carga de bancos dinámica desde el Switch vía Backend BANTEC
    useEffect(() => {
        const fetchBanks = async () => {
            setLoadingBanks(true);
            try {
                const data = await realizarTransferenciaInterbancaria.getBancos ? await realizarTransferenciaInterbancaria.getBancos() : await import('../services/bancaApi').then(m => m.getBancos());
                // Nota: El servicio bancaApi.js ya tiene getBancos()
            } catch (err) {
                console.error("Error cargando bancos:", err);
            } finally {
                setLoadingBanks(false);
            }
        };

        // Mejor usamos directamente el servicio importado
        const load = async () => {
            setLoadingBanks(true);
            try {
                const list = await getBancos(); // Directly call the imported getBancos
                if (list && list.length > 0) {
                    setBanks(list);
                } else {
                    // Fallback si el switch no responde
                    setBanks([
                        { id: 'NEXUS_BANK', nombre: 'Nexus Bank', codigo: 'NEXUS_BANK' },
                        { id: 'ECUSOL_BK', nombre: 'Ecusol Bank', codigo: 'ECUSOL_BK' },
                        { id: 'ARCBANK', nombre: 'Banco Arcbank', codigo: 'ARCBANK' },
                    ]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingBanks(false);
            }
        };
        load();

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

    // Estado para Idempotencia (UUID único por intento de pago)
    const [idempotencyKey, setIdempotencyKey] = useState(null);

    // Helpers
    const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // Estados de UI para la Experiencia de Usuario (Máquina de Estados)
    const [processingState, setProcessingState] = useState('IDLE'); // IDLE, CONNECTING, VALIDATING, SUCCESS, ERROR, TIMEOUT
    const [statusMessage, setStatusMessage] = useState('');

    const confirmTransfer = async () => {
        if (!fromAccId) return setError('Seleccione una cuenta de origen válida.');

        const currentRef = idempotencyKey || generateUUID();
        if (!idempotencyKey) setIdempotencyKey(currentRef);

        // Estado A: Iniciando
        setProcessingState('CONNECTING');
        setStatusMessage('Conectando con la red bancaria...');
        setLoading(true);

        // Timers visuales para UX
        const msgTimer = setTimeout(() => {
            if (processingState !== 'ERROR') setStatusMessage('Validando cuenta en banco destino...');
        }, 1500);

        const msgTimer2 = setTimeout(() => {
            if (processingState !== 'ERROR') setStatusMessage('Confirmando fondos...');
        }, 6000);

        try {
            const request = {
                referencia: currentRef,
                tipoOperacion: "TRANSFERENCIA_SALIDA",
                idCuentaOrigen: Number(fromAccId),
                cuentaExterna: toAccount,
                idBancoExterno: bankBic,
                beneficiario: toName,
                monto: Number(amount),
                canal: "WEB",
                descripcion: `Transferencia a ${toName} - Banco ${bankBic}`
            }

            console.log("1. Enviando POST al Switch (TxID: " + currentRef + ")");
            // 1. Envío Inicial (Fase 1)
            const initialRes = await realizarTransferenciaInterbancaria(request);

            // CHECK: Validación inmediata de rechazo (Fail-Fast)
            const initStatus = initialRes.estado || initialRes.status;
            if (initStatus === 'FALLIDA' || initStatus === 'FAILED' || initStatus === 'RECHAZADA') {
                let rawMsg = initialRes.mensaje || initialRes.descripcion || "Operación rechazada por el banco destino.";

                // Limpieza de mensaje para UX
                if (rawMsg.includes("AC01") || rawMsg.includes("Cuenta inválida")) {
                    rawMsg = "La cuenta destino no existe o es inválida.";
                } else if (rawMsg.includes("Fondos insuficientes")) {
                    rawMsg = "Fondos insuficientes en cuenta origen.";
                } else {
                    // CATCH-ALL: Para cualquier otro error (Offline, Técnico, 504, Switch Error, JSON)
                    // El usuario pidió explícitamente "Error de comunicación" y nada técnico.
                    rawMsg = "Error de comunicación con la entidad financiera.";
                }

                throw new Error(rawMsg);
            }

            // Si el backend responde, asumimos que la solicitud fue aceptada (201 Created o similar)
            // IMPORTANTE: NO confirmamos éxito aún. Iniciamos Polling.

            const txIdInstruccion = initialRes.idInstruccion || initialRes.id || currentRef;
            console.log("2. Respuesta Inicial OK. Iniciando Polling para ID: " + txIdInstruccion);

            // Estado B: Validando (Polling)
            setProcessingState('VALIDATING');

            let attempts = 0;
            let finalState = 'PENDING';
            let finalReason = '';

            // Ciclo de Polling (Fase 2) - Máximo 10 intentos (15s aprox)
            while (attempts < 10) {
                await new Promise(r => setTimeout(r, 1500)); // Esperar 1.5s

                try {
                    console.log(`... Polling intento ${attempts + 1}/10`);
                    const pollRes = await getTransferStatus(txIdInstruccion);

                    // Normalizar estado (Soporte para diferentes respuestas del switch)
                    const status = pollRes.estado || pollRes.status;
                    console.log("   Estado recibido: ", status);

                    if (status === 'COMPLETED' || status === 'APROBADA' || status === 'EXITOSA') {
                        finalState = 'COMPLETED';
                        break;
                    }

                    if (status === 'FAILED' || status === 'REJECTED' || status === 'RECHAZADA') {
                        finalState = 'FAILED';
                        finalReason = pollRes.mensaje || pollRes.motivo || pollRes.error || "Operación rechazada por el banco destino.";
                        break;
                    }

                } catch (pollErr) {
                    console.warn("Error en polling (red o 404), reintentando...", pollErr);
                }

                attempts++;
            }

            clearTimeout(msgTimer);
            clearTimeout(msgTimer2);

            // 3. Resolución Final
            if (finalState === 'COMPLETED') {
                // Estado C: Éxito REAL
                await addTransaction({
                    accId: fromAccId,
                    amount: -(Number(amount)),
                    tipo: 'TRANSFERENCIA_SALIDA',
                    desc: `Transf. Interbancaria a ${toName}`,
                    fecha: new Date().toISOString(),
                    ref: txIdInstruccion
                });
                await refreshAccounts();

                setProcessingState('SUCCESS');
                setIdempotencyKey(null); // Limpiar para nueva operación
                setStep(4);

            } else if (finalState === 'FAILED') {
                // Estado D: Fallo Confirmado
                throw new Error(finalReason || "La transferencia fue rechazada por el sistema.");

            } else {
                // Estado E: Timeout (Sigue Pendiente)
                console.warn("Timeout de Polling: Estado sigue pendiente.");
                setProcessingState('WARNING');
                setStep(4);
            }

        } catch (err) {
            clearTimeout(msgTimer);
            clearTimeout(msgTimer2);

            console.error("Error en flujo de transacción:", err);

            // Estado D: Fallo (Rojo)
            setProcessingState('ERROR');

            // Extraer mensaje limpio
            let errorMsg = err.message || 'Error desconocido';
            if (errorMsg.includes("Timeout")) errorMsg = "Tiempo de espera agotado.";

            // Sanitización estricta de errores técnicos
            if (errorMsg.includes("Switch Error") || errorMsg.includes("{") || errorMsg.length > 80 || errorMsg.includes("Unexpected token")) {
                errorMsg = "Error de comunicación con la entidad financiera.";
            }

            setError(errorMsg);

            // Ir al paso 4 para mostrar el resultado Visual (Rojo)
            setStep(4);

        } finally {
            setLoading(false);
        }
    };

    const downloadReceipt = () => {
        const total = Number(amount);
        const text = `TRANSFERENCIA INTERBANCARIA BANTEC\n\n` +
            `Monto Transferido: $${Number(amount).toFixed(2)}\n` +
            `Total Debitado: $${total.toFixed(2)}\n\n` +
            `Desde cuenta: ${fromAccount.number}\n` +
            `Destino: ${getBankName(bankBic)} (${bankBic})\n` +
            `Beneficiario: ${toName}\n` +
            `Cuenta destino: ${toAccount}\n` +
            `Fecha: ${new Date().toLocaleString()}\n`;
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
                        loading ? (
                            <div className="step-content" style={{ textAlign: 'center', padding: '40px 20px', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <div className="spinner-border text-warning" role="status" style={{ width: '4rem', height: '4rem', marginBottom: '24px', borderWidth: '4px' }}></div>
                                <h3 className="animate-pulse" style={{ color: 'var(--accent-gold)', fontSize: '1.4rem', marginBottom: '16px' }}>Enviando al Switch...</h3>
                                <p style={{ fontSize: '1.1rem', color: '#fff', fontWeight: '500' }}>{statusMessage}</p>
                                <div style={{ height: '4px', width: '60px', background: 'rgba(255,255,255,0.1)', margin: '20px auto', borderRadius: '2px' }}>
                                    <div style={{ height: '100%', width: '100%', background: 'var(--accent-gold)', borderRadius: '2px', animation: 'progress 2s infinite ease-in-out' }}></div>
                                </div>
                                <small style={{ color: 'var(--text-muted)', marginTop: '10px' }}>Por favor no cierre esta ventana ni recargue la página.</small>
                                <style>{`
                                    @keyframes progress { 0% { width: 0%; opacity: 0.5; } 50% { width: 100%; opacity: 1; } 100% { width: 0%; left: 100%; opacity: 0.5; } }
                                    .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                                    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .7; } }
                                `}</style>
                            </div>
                        ) : (
                            <div className="step-content">
                                <h3 style={{ marginBottom: 20, color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>Revisión de Datos Final</h3>
                                <div className="transfer-summary">
                                    <div className="summary-item">
                                        <span className="summary-label">Monto</span>
                                        <span className="summary-value amount-highlight">${Number(amount).toFixed(2)}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="summary-label">Comisión</span>
                                        <span className="summary-value">$0.00</span>
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
                                    <button className="btn-back" onClick={() => {
                                        setStep(2);
                                        setIdempotencyKey(null);
                                    }} disabled={loading}>Modificar</button>
                                    <button className="btn btn-transfer" onClick={confirmTransfer} disabled={loading}>
                                        Confirmar y Enviar
                                    </button>
                                </div>
                            </div>
                        )
                    )}

                    {step === 4 && (
                        <div className="step-content success-state" style={{ textAlign: 'center' }}>
                            {processingState === 'WARNING' ? (
                                <>
                                    <div className="success-icon" style={{ background: 'rgba(255, 193, 7, 0.2)', color: '#ffc107' }}>
                                        <FiActivity />
                                    </div>
                                    <h2 className="success-title" style={{ color: '#ffc107' }}>En Proceso de Validación</h2>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: 30 }}>
                                        La operación está tardando más de lo normal. Estamos validando el estado final con el banco destino.
                                        <br /><br />
                                        <strong>Le notificaremos por mensaje cuando se complete.</strong>
                                    </p>
                                    <div className="transfer-button-row">
                                        <button className="btn-back" onClick={() => navigate('/movimientos')}>Ir al Inicio</button>
                                    </div>
                                </>
                            ) : processingState === 'ERROR' ? (
                                <>
                                    <div className="success-icon" style={{ background: 'rgba(220, 53, 69, 0.2)', color: '#dc3545' }}>
                                        <FiInfo />
                                    </div>
                                    <h2 className="success-title" style={{ color: '#dc3545' }}>Transferencia Rechazada</h2>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '10px' }}>
                                        La operación no pudo completarse.
                                    </p>
                                    <div style={{ background: 'rgba(220, 53, 69, 0.1)', border: '1px solid #dc3545', padding: '15px', borderRadius: '8px', marginBottom: '30px', color: '#ffadad', fontSize: '0.9rem' }}>
                                        {error}
                                    </div>
                                    <div className="transfer-button-row">
                                        <button className="btn-back" onClick={() => navigate('/movimientos')}>Cancelar</button>
                                        <button className="btn btn-transfer" onClick={() => {
                                            setStep(2); // Volver a editar
                                            setIdempotencyKey(null); // Nueva intentona
                                            setProcessingState('IDLE');
                                            setError('');
                                        }}>Intentar de Nuevo</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="success-icon"><FiCheck /></div>
                                    <h2 className="success-title">¡Transferencia Exitosa!</h2>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: 30 }}>
                                        Su dinero ha sido transferido correctamente a {toName}.
                                    </p>
                                    <div className="transfer-button-row">
                                        <button className="btn-back" onClick={() => navigate('/movimientos')}>Ir al Inicio</button>
                                        <button className="btn btn-transfer" style={{ background: 'var(--grad-gold)', color: '#000' }} onClick={downloadReceipt}>
                                            <FiDownload style={{ marginRight: 8 }} /> Comprobante
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
