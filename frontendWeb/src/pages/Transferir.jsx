import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { realizarTransferencia, getCuentaPorNumero } from '../services/bancaApi' // Importamos getCuentaPorNumero
import { useNavigate } from "react-router-dom";

export default function Transfer() {
    const { state, addTransaction } = useAuth();
    const navigate = useNavigate();

    // 1. Cargar cuentas origen del usuario
    const accounts = (state && Array.isArray(state.user?.accounts) && state.user.accounts.length)
        ? state.user.accounts
        : [];

    const [step, setStep] = useState(1);

    // Campos formulario
    const [toAccountNum, setToAccountNum] = useState("");
    const [toName, setToName] = useState("");

    // Cuenta Origen
    const [fromAccId, setFromAccId] = useState(accounts[0]?.id || '');
    const fromAccount = accounts.find(a => a.id === fromAccId) || accounts[0] || { number: '', balance: 0 };

    // Cuenta Destino (Objeto completo obtenido del backend)
    const [destAccountObj, setDestAccountObj] = useState(null);

    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Efecto para seleccionar cuenta por defecto si cambia la lista
    useEffect(() => {
        if (accounts.length > 0 && !fromAccId) setFromAccId(accounts[0].id);
    }, [accounts]);

    const goToStep2 = async () => {
        setError("");

        if (!toAccountNum || !toName) return setError("Todos los campos son obligatorios.");

        // Transferencias internas - siempre mismo banco (BANTEC)

        // --- VALIDACIÓN DE CUENTA DESTINO ---
        setLoading(true);
        try {
            // Buscamos la cuenta destino en el backend para obtener su ID interno
            const cuentaDestino = await getCuentaPorNumero(toAccountNum);

            if (!cuentaDestino || !cuentaDestino.idCuenta) {
                throw new Error("La cuenta destino no existe en BANTEC.");
            }

            // Validar que no se transfiera a sí mismo
            if (String(cuentaDestino.idCuenta) === String(fromAccId)) {
                throw new Error("No puede transferir a la misma cuenta de origen.");
            }

            setDestAccountObj(cuentaDestino); // Guardamos para el paso final
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
        if (!fromAccId || !destAccountObj?.idCuenta) {
            return setError('Datos de cuenta inválidos.');
        }

        setLoading(true);
        try {
            // Payload exacto para TransaccionRequestDTO
            const request = {
                tipoOperacion: "TRANSFERENCIA_INTERNA",
                idCuentaOrigen: Number(fromAccId), // ID Integer
                idCuentaDestino: destAccountObj.idCuenta, // ID Integer (obtenido en paso 1)
                monto: Number(amount),
                canal: "WEB",
                descripcion: `Transferencia a ${toName}`,
                idSucursal: 1 // Default Web
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
            setTimeout(() => { navigate('/movimientos'); }, 3000);

        } catch (err) {
            setError(err.message || 'Error realizando la transferencia.');
        } finally {
            setLoading(false);
        }
    };

    const downloadReceipt = () => {
        const text =
            `TRANSFERENCIA EXITOSA\n\n` +
            `Monto: $${Number(amount).toFixed(2)}\n` +
            `Origen: ${fromAccount.number}\n` +
            `Destino: ${toAccountNum} (${toName})\n` +
            `Fecha: ${new Date().toLocaleString()}\n`;

        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `comprobante_transferencia_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (accounts.length === 0) {
        return <div style={{ padding: 30 }}>No tiene cuentas activas para realizar transferencias.</div>;
    }

    return (
        <div style={{ padding: 30 }}>
            {step === 1 && (
                <div style={styles.card}>
                    <h2 style={styles.title}>Transferir (Interna)</h2>
                    <div style={styles.infoBar}>Transferencia entre cuentas BANTEC</div>

                    <label>N° de cuenta destino</label>
                    <input
                        style={styles.input}
                        value={toAccountNum}
                        maxLength={12}
                        onChange={(e) => setToAccountNum(e.target.value.replace(/\D/g, ""))}
                        placeholder="12 dígitos"
                    />

                    <label>Nombre Beneficiario</label>
                    <input
                        style={styles.input}
                        value={toName}
                        onChange={e => setToName(e.target.value)}
                        placeholder="Ej: Juan Perez"
                    />

                    {error && <p style={styles.error}>{error}</p>}

                    <button style={styles.btn} onClick={goToStep2} disabled={loading}>
                        {loading ? 'Validando...' : 'Continuar'}
                    </button>
                </div>
            )}

            {step === 2 && (
                <div style={styles.card}>
                    <h2 style={styles.title}>Monto y Origen</h2>

                    <label style={{ fontWeight: 600 }}>Desde la cuenta</label>
                    <select style={styles.input} value={fromAccId} onChange={e => setFromAccId(e.target.value)}>
                        {accounts.map(a => (
                            <option key={a.id} value={a.id}>
                                {a.number} — Disp: ${a.balance.toFixed(2)}
                            </option>
                        ))}
                    </select>

                    <label>Monto</label>
                    <input
                        style={styles.input}
                        value={amount}
                        onChange={e => {
                            const val = e.target.value;
                            if (/^\d*\.?\d{0,2}$/.test(val)) setAmount(val);
                        }}
                        placeholder="0.00"
                    />

                    {error && <p style={styles.error}>{error}</p>}

                    <div style={styles.buttonRow}>
                        <button style={styles.btnCancel} onClick={() => setStep(1)}>Atrás</button>
                        <button style={styles.btn} onClick={goToStep3}>Continuar</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div style={styles.card}>
                    <h2 style={styles.title}>Confirmar Transferencia</h2>
                    <table style={styles.table}>
                        <tbody>
                            <tr><td>Monto:</td><td><b>${Number(amount).toFixed(2)}</b></td></tr>
                            <tr><td colSpan={2} style={styles.sectionTitle}>Origen</td></tr>
                            <tr><td>Cuenta:</td><td>{fromAccount.number}</td></tr>
                            <tr><td colSpan={2} style={styles.sectionTitle}>Destino</td></tr>
                            <tr><td>Beneficiario:</td><td>{toName}</td></tr>
                            <tr><td>Cuenta:</td><td>{toAccountNum}</td></tr>
                        </tbody>
                    </table>

                    {error && <p style={styles.error}>{error}</p>}

                    <div style={styles.buttonRow}>
                        <button style={styles.btnCancel} onClick={() => setStep(2)} disabled={loading}>Atrás</button>
                        <button style={styles.btn} onClick={confirmTransfer} disabled={loading}>
                            {loading ? 'Procesando...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div style={styles.card}>
                    <h2 style={styles.title}>¡Transferencia Exitosa!</h2>
                    <p style={{ textAlign: 'center', marginBottom: 20 }}>La operación se realizó correctamente.</p>
                    <div style={styles.buttonRow}>
                        <button style={styles.btn} onClick={() => navigate('/movimientos')}>Ver Movimientos</button>
                        <button style={styles.btn} onClick={downloadReceipt}>Descargar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    card: { background: "#fff", padding: 30, borderRadius: 10, width: "100%", maxWidth: "500px", margin: "0 auto", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
    title: { fontSize: 20, marginBottom: 20, fontWeight: 700, textAlign: 'center', color: '#333' },
    input: { width: "100%", padding: 12, borderRadius: 6, border: "1px solid #ccc", marginBottom: 15, fontSize: 16 },
    btn: { background: "#ff9800", color: "white", padding: "12px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, width: '100%' },
    btnCancel: { background: "#f5f5f5", color: "#333", padding: "12px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, width: '100%' },
    error: { color: "#d32f2f", marginBottom: 15, fontSize: 14, background: '#ffcdd2', padding: 10, borderRadius: 4 },
    infoBar: { background: "#e3f2fd", padding: 10, borderRadius: 5, marginBottom: 20, fontSize: 14, color: '#1565c0', textAlign: 'center' },
    table: { width: "100%", fontSize: 15, marginBottom: 20 },
    sectionTitle: { fontWeight: 700, paddingTop: 10, color: '#666', fontSize: 12, textTransform: 'uppercase' },
    buttonRow: { display: "flex", gap: 10, marginTop: 10 },
};