import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { realizarTransferenciaInterbancaria, getBancos } from '../services/bancaApi'
import { useNavigate } from "react-router-dom";

export default function TransaccionesInterbancarias() {
    const { state, addTransaction } = useAuth(); // addTransaction es opcional si solo usas backend
    const navigate = useNavigate();

    // Cuentas del usuario (Manejo defensivo si aún no cargan)
    const accounts = (state && Array.isArray(state.user?.accounts) && state.user.accounts.length)
        ? state.user.accounts
        : [];

    // Si no hay cuentas, no se puede operar (o mostrar mock temporal)
    const firstAccId = accounts[0]?.id || '';

    const [step, setStep] = useState(1);
    const [toAccount, setToAccount] = useState("");
    const [bankBic, setBankBic] = useState("");
    const [banks, setBanks] = useState([]);
    const [toName, setToName] = useState("");

    // Estado de cuenta origen seleccionada (ID interno)
    const [fromAccId, setFromAccId] = useState(firstAccId);

    // Objeto cuenta origen completo para mostrar saldo/numero
    const fromAccount = accounts.find(a => a.id === fromAccId) || accounts[0] || { number: '---', balance: 0 };

    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const BANCOS_REGISTRADOS = [
        { id: 'NEXUS_BANK', nombre: 'NEXUS_BANK', codigo: 'NEXUS_BANK', bin: '270100' },
        { id: 'ECUSOL_BK', nombre: 'ECUSOL_BK', codigo: 'ECUSOL_BK', bin: '370100' },
        { id: 'ARCBANK', nombre: 'ARCBANK', codigo: 'ARCBANK', bin: '400000' },
        { id: 'BANTEC', nombre: 'BANTEC', codigo: 'BANTEC', bin: '100000' },
    ];

    useEffect(() => {
        setBanks(BANCOS_REGISTRADOS);

        // Si cambia la lista de cuentas y no hay seleccionada, seleccionar la primera
        if (accounts.length > 0 && !fromAccId) {
            setFromAccId(accounts[0].id)
        }
    }, [accounts, fromAccId]);

    const goToStep2 = () => {
        if (!toAccount || !bankBic || !toName)
            return setError("Todos los campos son obligatorios.");

        // Validation: Only numbers (The input already enforces this via replace, but double check)
        if (!/^\d+$/.test(toAccount))
            return setError("El número de cuenta solo debe contener números.");

        if (toAccount.length < 6)
            return setError("El número de cuenta parece inválido (mínimo 6 dígitos).");

        setError("");
        setStep(2);
    };

    const goToStep3 = () => {
        const num = Number(amount);
        if (!num || num <= 0) return setError("Monto inválido.");

        // Validación de saldo (Opcional, el backend valida también)
        if (num > (fromAccount.balance || 0))
            return setError("Saldo insuficiente en la cuenta.");

        setError("");
        setStep(3);
    };

    const confirmTransfer = async () => {
        // En tu backend Java no usas idUsuarioWeb en el DTO de TransaccionRequest, 
        // usas idCuentaOrigen. El backend sabe de quién es la cuenta por el ID.
        if (!fromAccId) {
            return setError('Seleccione una cuenta de origen válida.');
        }

        setLoading(true);
        setError("");

        try {
            const selectedBank = banks.find(b => (b.codigo || b.id) === bankBic);

            const request = {
                tipoOperacion: "TRANSFERENCIA_SALIDA",
                idCuentaOrigen: fromAccId, // Integer ID interno
                cuentaExterna: toAccount,  // Cuenta destino en otro banco
                bancoDestino: bankBic,     // SENDING BIC (e.g. ARCBANK)
                idBancoExterno: selectedBank ? parseInt(selectedBank.bin) : null,
                beneficiario: toName,
                monto: Number(amount),
                canal: "WEB",
                descripcion: `Transferencia a ${toName} (${bankBic})`
            }

            // Nota: Si tu backend ms-transaccion actual NO soporta transferencias externas (campos bancoDestino/cuentaExterna),
            // esto fallará o requerirá que actualices el DTO Java.
            // Asumiremos que el método realizarTransferenciaInterbancaria maneja la lógica.

            await realizarTransferenciaInterbancaria(request);


            addTransaction({
                accId: fromAccId,
                amount: -Number(amount),
                tipo: 'TRANSFERENCIA_SALIDA',
                desc: `Transferencia a ${toName} (${bankBic})`,
                fecha: new Date().toISOString()
            });

            // Éxito
            setStep(4);

            // Opcional: Actualizar saldo localmente o recargar
            setTimeout(() => {
                navigate('/movimientos');
            }, 3000);

        } catch (err) {
            console.error(err);
            setError(err.message || 'Error en la transferencia interbancaria');
        } finally {
            setLoading(false);
        }
    };

    const downloadReceipt = () => {
        const text =
            `TRANSFERENCIA INTERBANCARIA EXITOSA\n\n` +
            `Monto: $${Number(amount).toFixed(2)}\n` +
            `Desde cuenta: ${fromAccount.number}\n` +
            `A nombre de: ${toName}\n` +
            `Cuenta destino: ${toAccount}\n` +
            `Banco destino: ${bankBic}\n` +
            `Fecha: ${new Date().toLocaleString()}\n`;

        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `comprobante_interbancario_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Helper to find bank name for display
    const getBankName = (bic) => {
        const b = banks.find(x => x.id === bic);
        return b ? b.name : bic;
    };

    return (
        <div style={{ padding: 30 }}>
            {step === 1 && (
                <div style={styles.card}>
                    <h2 style={styles.title}>Transferencia Interbancaria</h2>

                    <label>Banco Destino</label>
                    <select style={styles.input} value={bankBic} onChange={e => setBankBic(e.target.value)}>
                        <option value="">-- Seleccione un banco --</option>
                        {banks.map((b) => (
                            <option key={b.id || b.codigo} value={b.codigo || b.id}>
                                {b.nombre || b.name} - BIN: {b.bin}
                            </option>
                        ))}
                    </select>

                    <label>N° de Cuenta Destino</label>
                    <input
                        style={styles.input}
                        value={toAccount}
                        onChange={(e) => setToAccount(e.target.value.replace(/\D/g, ''))}
                        placeholder="Solo números"
                    />

                    <label>Beneficiario (Nombres)</label>
                    <input
                        style={styles.input}
                        value={toName}
                        onChange={e => setToName(e.target.value)}
                        placeholder="Nombre del titular destino"
                    />

                    {error && <p style={styles.error}>{error}</p>}

                    <button style={styles.btn} onClick={goToStep2}>
                        Continuar
                    </button>
                </div>
            )}

            {step === 2 && (
                <div style={styles.card}>
                    <h2 style={styles.title}>Transferir</h2>

                    <div style={styles.balanceCircle}>
                        <div style={styles.circleLetter}>
                            {(fromAccount.type || 'C')[0]}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 700 }}>
                            {fromAccount.number || '---'}
                        </div>
                        <div style={{ fontSize: 26, marginTop: 5 }}>
                            ${Number(fromAccount.balance || 0).toFixed(2)}
                        </div>
                    </div>

                    <label style={{ fontWeight: 600 }}>Desde la cuenta</label>
                    <select
                        style={styles.input}
                        value={fromAccId}
                        onChange={(e) => setFromAccId(e.target.value)}
                    >
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                                {acc.number} — Saldo ${acc.balance.toFixed(2)}
                            </option>
                        ))}
                    </select>

                    <label>Monto a transferir</label>
                    <input
                        style={styles.input}
                        value={amount}
                        onChange={e => {
                            const val = e.target.value;
                            if (/^\d*\.?\d{0,2}$/.test(val)) setAmount(val);
                        }}
                        placeholder="0.00"
                    />

                    <div style={styles.infoBar}>
                        💡 Esta transacción puede tardar hasta 24 horas laborables.
                    </div>

                    {error && <p style={styles.error}>{error}</p>}

                    <button style={styles.btn} onClick={goToStep3}>
                        Continuar
                    </button>
                </div>
            )}

            {step === 3 && (
                <div style={styles.card}>
                    <h2 style={styles.title}>Confirmación</h2>
                    <h3 style={{ textAlign: "center", marginBottom: 15 }}>Transferencia Interbancaria</h3>

                    <table style={styles.table}>
                        <tbody>
                            <tr>
                                <td>Monto:</td>
                                <td><b>${Number(amount).toFixed(2)}</b></td>
                            </tr>
                            <tr>
                                <td>Costo:</td>
                                <td>$0.40 (Aprox)</td>
                            </tr>
                            <tr><td colSpan={2} style={styles.sectionTitle}>Origen</td></tr>
                            <tr><td>Cuenta:</td><td>{fromAccount.number}</td></tr>

                            <tr><td colSpan={2} style={styles.sectionTitle}>Destino</td></tr>
                            <tr><td>Banco:</td><td>{getBankName(bankBic)}</td></tr>
                            <tr><td>Beneficiario:</td><td>{toName}</td></tr>
                            <tr><td>Cuenta:</td><td>{toAccount}</td></tr>
                        </tbody>
                    </table>

                    {error && <p style={styles.error}>{error}</p>}

                    <div style={styles.buttonRow}>
                        <button style={styles.btnCancel} onClick={() => setStep(2)} disabled={loading}>
                            Atrás
                        </button>
                        <button style={styles.btn} onClick={confirmTransfer} disabled={loading}>
                            {loading ? 'Procesando...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div style={styles.card}>
                    <h2 style={styles.title}>Transacción Exitosa</h2>
                    <p style={{ textAlign: 'center' }}>La transferencia ha sido enviada a procesamiento.</p>
                    <div style={styles.buttonRow}>
                        <button style={styles.btn} onClick={() => navigate('/movimientos')}>Ir a Movimientos</button>
                        <button style={styles.btn} onClick={downloadReceipt}>📄 Descargar</button>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    card: { background: "#fff", padding: 30, borderRadius: 10, width: "100%", maxWidth: "500px", margin: "0 auto", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
    title: { fontSize: 22, marginBottom: 20, fontWeight: 700, textAlign: 'center' },
    input: { width: "100%", padding: 12, borderRadius: 6, border: "1px solid #ddd", marginBottom: 15, fontSize: 16 },
    btn: { background: "#cc8c00", color: "white", padding: "12px 20px", borderRadius: 6, border: "none", cursor: "pointer", marginTop: 10, marginBottom: 10, fontWeight: 600, width: '100%' },
    btnCancel: { background: "#eee", color: "#333", padding: "12px 20px", borderRadius: 6, border: "none", cursor: "pointer", marginTop: 10, fontWeight: 600, width: '100%' },
    error: { color: "red", marginBottom: 10, fontSize: 14, background: '#ffebee', padding: 8, borderRadius: 4 },
    balanceCircle: { textAlign: "center", marginBottom: 20, padding: 10, background: '#f9f9f9', borderRadius: 8 },
    circleLetter: { width: 50, height: 50, borderRadius: "50%", background: "#e3f2fd", color: '#1565c0', margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: "bold" },
    infoBar: { background: "#e3f2fd", padding: 12, borderRadius: 6, marginBottom: 15, fontSize: 13, color: '#0d47a1' },
    table: { width: "100%", fontSize: 14, margin: "0 auto 20px", textAlign: "left" },
    sectionTitle: { fontWeight: 700, paddingTop: 10, color: '#666', fontSize: 12, textTransform: 'uppercase' },
    buttonRow: { display: "flex", gap: 10, marginTop: 20 },
};