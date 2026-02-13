import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { FiArrowLeft, FiPhone, FiMail, FiHome } from "react-icons/fi";

export default function Perfil() {
    const { state, updateUser } = useAuth(); // updateUser debe llamar a PUT /api/v1/clientes/...

    const [step, setStep] = useState(1);
    const [field, setField] = useState(""); 

    const [value1, setValue1] = useState("");
    const [value2, setValue2] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const saveChanges = async () => {
        setError("");
        
        let payload = {};

        if (field === "phone") {
            if (!/^\d{10}$/.test(value1)) return setError("El número debe tener 10 dígitos.");
            if (value1 !== value2) return setError("Los números no coinciden.");
            payload = { telefono: value1 }; // Ajustar nombre de campo según DTO backend
        }

        if (field === "email") {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value1)) return setError("Correo inválido.");
            payload = { email: value1 };
        }

        if (field === "address") {
            if (value1.trim().length < 4) return setError("Dirección muy corta.");
            payload = { direccion: value1 };
        }

        setLoading(true);
        try {
            // Llamada al contexto que conecta con API Clientes
            await updateUser(payload);
            
            // Éxito: Resetear vista
            setStep(1);
            setValue1("");
            setValue2("");
        } catch (e) {
            setError("Error al actualizar perfil. Intente luego.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 30 }}>

            {step === 1 && (
                <>
                    <div style={styles.headerCard}>
                        <div style={styles.userIcon}>👤</div>
                        <h2 style={styles.userName}>{state.user?.name || "Usuario"}</h2>
                    </div>

                    <h3 style={styles.subtitle}>Información Personal</h3>

                    <div style={styles.cardList}>

                        <div style={styles.cardItem}>
                            <FiPhone size={24} color="#666"/>
                            <div>
                                <div style={styles.itemTitle}>Celular</div>
                                <div style={styles.itemValue}>{state.user?.phone || "--"}</div>
                            </div>
                            <button
                                style={styles.updateBtn}
                                onClick={() => { setField("phone"); setStep(2); }}
                            >
                                Editar
                            </button>
                        </div>

                        <div style={styles.cardItem}>
                            <FiMail size={24} color="#666"/>
                            <div>
                                <div style={styles.itemTitle}>Correo</div>
                                <div style={styles.itemValue}>{state.user?.email || "--"}</div>
                            </div>
                            <button
                                style={styles.updateBtn}
                                onClick={() => { setField("email"); setStep(3); }}
                            >
                                Editar
                            </button>
                        </div>

                        <div style={styles.cardItem}>
                            <FiHome size={24} color="#666"/>
                            <div>
                                <div style={styles.itemTitle}>Dirección</div>
                                <div style={styles.itemValue}>{state.user?.address || "--"}</div>
                            </div>
                            <button
                                style={styles.updateBtn}
                                onClick={() => { setField("address"); setStep(4); }}
                            >
                                Editar
                            </button>
                        </div>
                    </div>
                </>
            )}

            {step > 1 && (
                <div style={{maxWidth: 400, margin: '0 auto'}}>
                    <div style={styles.headerBack}>
                        <FiArrowLeft size={24} onClick={() => {setStep(1); setError('')}} style={styles.backIcon} />
                        <h3 style={{ marginLeft: 10 }}>
                            Actualizar {field === 'phone' ? 'Celular' : field === 'email' ? 'Correo' : 'Dirección'}
                        </h3>
                    </div>

                    {field === 'phone' && (
                        <>
                            <label style={styles.label}>Nuevo número</label>
                            <input style={styles.input} maxLength={10} value={value1} onChange={(e) => setValue1(e.target.value.replace(/\D/g, ""))} />
                            <label style={styles.label}>Confirmar número</label>
                            <input style={styles.input} maxLength={10} value={value2} onChange={(e) => setValue2(e.target.value.replace(/\D/g, ""))} />
                        </>
                    )}

                    {field === 'email' && (
                        <>
                            <label style={styles.label}>Nuevo correo</label>
                            <input style={styles.input} type="email" value={value1} onChange={(e) => setValue1(e.target.value)} />
                        </>
                    )}

                    {field === 'address' && (
                        <>
                            <label style={styles.label}>Nueva dirección</label>
                            <textarea style={{ ...styles.input, height: 80 }} value={value1} onChange={(e) => setValue1(e.target.value)} />
                        </>
                    )}

                    {error && <p style={styles.error}>{error}</p>}

                    <button style={styles.btn} onClick={saveChanges} disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            )}
        </div>
    );
}

const styles = {
    headerCard: {
        background: "white",
        padding: 20,
        textAlign: "center",
        borderRadius: 12,
        marginBottom: 25,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
    },
    userIcon: {
        fontSize: 30,
        background: "#f0f0f0",
        width: 60,
        height: 60,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 10px",
    },
    userName: { margin: 0, color: '#333' },
    subtitle: { marginBottom: 15, color: '#666', fontSize: 16 },
    cardList: { display: "flex", flexDirection: "column", gap: 12 },

    cardItem: {
        display: "flex",
        alignItems: "center",
        gap: 15,
        background: "white",
        padding: 16,
        borderRadius: 10,
        border: "1px solid #eee"
    },
    itemTitle: { fontWeight: 600, fontSize: 14, color: '#333' },
    itemValue: { fontSize: 14, color: "#666", marginTop: 2 },
    updateBtn: {
        marginLeft: "auto",
        background: "#e3f2fd",
        color: "#1976d2",
        border: "none",
        padding: "6px 12px",
        borderRadius: 6,
        cursor: "pointer",
        fontWeight: 600,
        fontSize: 13
    },
    headerBack: {
        display: "flex",
        alignItems: "center",
        marginBottom: 20,
        borderBottom: '1px solid #eee',
        paddingBottom: 10
    },
    backIcon: { cursor: "pointer", color: '#555' },
    input: {
        width: "100%",
        padding: 12,
        marginBottom: 15,
        borderRadius: 8,
        border: "1px solid #ddd",
        fontSize: 15,
        outline: 'none'
    },
    label: { display: 'block', marginBottom: 5, fontSize: 14, fontWeight: 500, color: '#444' },
    btn: {
        width: "100%",
        background: "#ff9800",
        color: "white",
        padding: "12px",
        borderRadius: 8,
        border: "none",
        cursor: "pointer",
        fontSize: 16,
        fontWeight: 600
    },
    error: { color: "red", marginBottom: 15, fontSize: 14, background: '#ffebee', padding: 8, borderRadius: 4 },
};