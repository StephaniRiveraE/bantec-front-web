import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
// Importamos apiFetch directamente si AuthContext lo expone, o usamos fetch
import { FaUser, FaLock, FaEyeSlash, FaEye } from "react-icons/fa";
import "./Login.css";

// Definimos apiFetch local si no viene del context para evitar errores
const GATEWAY = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

export default function Login() {
  const { login, persistIdentification } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Estados de Registro
  const [showRegister, setShowRegister] = useState(false)
  const [regUser, setRegUser] = useState("")
  const [regPass, setRegPass] = useState("")
  const [regTipoId, setRegTipoId] = useState("CEDULA")
  const [regId, setRegId] = useState("")
  const [regSucursal, setRegSucursal] = useState(1)
  const [regMsg, setRegMsg] = useState("")

  const submit = async (e) => {
    e.preventDefault()
    setErr('')

    // Login normal
    const res = await login(user, pass)

    if (!res.ok) {
      setErr(res.error || "Credenciales incorrectas");
      return;
    }

    // Login exitoso
    setTimeout(() => navigate('/'), 100)
  }

  const submitRegister = async (e) => {
    e.preventDefault()
    setRegMsg('')

    try {
      const body = {
        nombreUsuario: regUser,
        clave: regPass,
        tipoIdentificacion: regTipoId,
        identificacion: regId,
        idSucursal: Number(regSucursal)
      }

      // Ajuste: Llamada al endpoint de registro. 
      // Si este endpoint está en el Gateway bajo /api/auth/registro o similar, ajústalo.
      // Asumiremos que AuthContext expone apiFetch o usamos fetch directo al gateway
      const resp = await fetch(`${GATEWAY}/api/usuarios/registro`, { // Ajusta la ruta según tu backend de seguridad
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!resp.ok) throw new Error("Error en registro");

      const data = await resp.json();

      setRegMsg('Registro exitoso')
      setShowRegister(false)
      setUser(regUser)
      // Auto-llenar la identificación en el contexto si es posible
      try { persistIdentification(regId, data.idUsuario) } catch (e) { }

    } catch (e) {
      setRegMsg(e.message || 'Error en registro')
    }
  }


  return (
    <div className="login-page" style={styles.page}>
      <div className="left" style={styles.left}>
        <h1 className="login-logo" style={styles.logo}>BANTEC</h1>

        <div className="login-box" style={styles.loginBox}>
          <h2 style={styles.title}>Bienvenidos</h2>
          <h3 style={styles.subtitle}>Ingresa a tu Banca Web</h3>

          {err && <div style={styles.error}>{err}</div>}

          <form onSubmit={submit}>
            <div className="step-group">
              <div style={styles.inputGroup}>
                <FaUser style={styles.icon} />
                <input
                  style={styles.input}
                  placeholder="Usuario"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                />
              </div>
              <div style={styles.forgot}>¿Olvidaste tu usuario?</div>

              <div style={styles.inputGroup}>
                <FaLock style={styles.icon} />
                <input
                  type={showPass ? "text" : "password"}
                  style={styles.input}
                  placeholder="Contraseña"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                />
                <div
                  style={styles.eyeIcon}
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
              <div style={styles.forgot}>¿Olvidaste tu contraseña?</div>
            </div>

            <button type="submit" style={styles.button}>
              Ingresar
            </button>
            <button
              type="button"
              style={{ ...styles.button, marginTop: 10, background: 'transparent', color: '#315eb3', border: '2px solid #315eb3' }}
              onClick={() => { setShowRegister(s => !s); setRegMsg('') }}
            >
              {showRegister ? 'Cancelar' : 'Registrar'}
            </button>
          </form>

          {showRegister && (
            <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 20 }}>
              <h3 style={{ marginBottom: 8 }}>Registro de Usuario</h3>
              {regMsg && <div style={{ color: regMsg.includes('exitoso') ? 'green' : 'red', marginBottom: 8 }}>{regMsg}</div>}
              <form onSubmit={submitRegister}>
                <div style={styles.inputGroup}>
                  <input style={styles.input} placeholder="Usuario" value={regUser} onChange={e => setRegUser(e.target.value)} />
                </div>
                <div style={styles.inputGroup}>
                  <input type="password" style={styles.input} placeholder="Contraseña" value={regPass} onChange={e => setRegPass(e.target.value)} />
                </div>
                <div style={styles.inputGroup}>
                  <select style={styles.input} value={regTipoId} onChange={e => setRegTipoId(e.target.value)}>
                    <option value="CEDULA">CÉDULA</option>
                    <option value="PASAPORTE">PASAPORTE</option>
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <input style={styles.input} placeholder="Número de identificación" value={regId} onChange={e => setRegId(e.target.value)} />
                </div>
                <div style={styles.inputGroup}>
                  <input type="number" style={styles.input} placeholder="Sucursal (id)" value={regSucursal} onChange={e => setRegSucursal(e.target.value)} />
                </div>
                <button type="submit" style={{ ...styles.button, background: 'linear-gradient(to right, #2e8b57, #3cb371)' }}>Crear cuenta</button>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="right" style={styles.right}>
        <div className="right-card">
          <h2 className="reco-title">Recomendaciones</h2>
          <ol className="reco-list">
            <li>Cuida bien tu usuario y contraseña</li>
            <li>Verifica todo antes de ingresar</li>
            <li>No compartas tus claves</li>
          </ol>

          <div className="reco-avatar">
            <img
              src="https://cdn-icons-png.flaticon.com/512/706/706830.png"
              alt="persona"
              className="reco-icon"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    minHeight: "100vh",
    background: "linear-gradient(to right, #f5f5f5, #e8e8e8)",
  },
  left: {
    flex: 1,
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center", // Centrado en móviles
    justifyContent: "center",
  },
  right: {
    flex: 1,
    padding: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // Ocultar en móviles si se desea con media queries
  },
  logo: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#b8860b",
    marginBottom: 20,
    alignSelf: 'flex-start',
    marginLeft: '10%'
  },
  loginBox: {
    background: "white",
    padding: 32,
    borderRadius: 20,
    width: "100%",
    maxWidth: 460,
    boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 25,
    color: '#666'
  },
  error: {
    color: "red",
    marginBottom: 15,
    padding: 10,
    background: '#ffebee',
    borderRadius: 4
  },
  inputGroup: {
    position: "relative",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    padding: "12px 40px",
    borderRadius: 8,
    border: "2px solid #e0e0e0",
    fontSize: 16,
    outline: "none",
    transition: 'border-color 0.3s'
  },
  icon: {
    position: "absolute",
    top: "50%",
    left: 12,
    transform: "translateY(-50%)",
    color: "#999",
  },
  eyeIcon: {
    position: "absolute",
    top: "50%",
    right: 12,
    transform: "translateY(-50%)",
    cursor: "pointer",
    color: "#999"
  },
  forgot: {
    fontSize: 13,
    textAlign: "right",
    marginBottom: 10,
    color: "#666",
    cursor: 'pointer'
  },
  button: {
    marginTop: 10,
    width: "100%",
    padding: 14,
    fontSize: 16,
    fontWeight: 'bold',
    background: "linear-gradient(to right, #1e88e5, #1565c0)",
    color: 'white',
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    transition: 'transform 0.1s'
  },
  recoTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 20,
  },
  recoList: {
    fontSize: 16,
    lineHeight: 1.8,
    color: '#444'
  }
};