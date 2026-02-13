import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaUser, FaLock, FaEyeSlash, FaEye, FaShieldAlt, FaRocket, FaGlobe } from "react-icons/fa";
import "./Login.css";

const GATEWAY = process.env.REACT_APP_API_BASE_URL || "";

export default function Login() {
  const { login, persistIdentification } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setLoading(true)

    const res = await login(user, pass)
    setLoading(false)

    if (!res.ok) {
      setErr(res.error || "Credenciales incorrectas");
      return;
    }

    setTimeout(() => navigate('/'), 100)
  }

  return (
    <div className="login-container">
      <div className="login-overlay"></div>

      <div className="login-content">
        <div className="login-left-panel">
          <div className="brand-header">
            <span className="brand-name">BANTEC</span>
            <span className="brand-dot">.</span>
          </div>

          <div className="hero-text">
            <h1>Banca Experta <br /> <span className="text-gradient">Para Tu Futuro.</span></h1>
            <p>Gestiona tus activos con la plataforma de seguridad más avanzada del mercado.</p>
          </div>

          <div className="hero-image-container">
            <img src="/login-bg.png" alt="Bantec Premium" className="hero-floating-image" />
          </div>

          <div className="feature-grid">
            <div className="feature-item">
              <FaShieldAlt className="feature-icon" color="var(--accent-gold)" />
              <div>
                <h4 className="text-gold">Protección Total</h4>
                <p>Seguridad de grado militar.</p>
              </div>
            </div>
            <div className="feature-item">
              <FaRocket className="feature-icon" />
              <div>
                <h4>Alta Disponibilidad</h4>
                <p>Acceso continuo 24/7.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right-panel">
          <div className="glass-card login-card">
            <div className="card-header">
              <h2>Inicia Sesión</h2>
              <p>Ingresa tus credenciales de acceso seguro.</p>
            </div>

            {err && <div className="alert-error">{err}</div>}

            <form onSubmit={submit} className="modern-form">
              <div className="input-field">
                <FaUser className="field-icon" />
                <input
                  type="text"
                  placeholder="Usuario"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  required
                />
              </div>

              <div className="input-field">
                <FaLock className="field-icon" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Contraseña"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                />
                <div className="eye-toggle" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-container">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  No cerrar sesión
                </label>
                <span className="forgot-link">¿Olvidaste tu contraseña?</span>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <span className="loader-small"></span> : 'Acceder al Portal'}
              </button>
            </form>
          </div>

          <div className="login-footer">
            <p><FaGlobe /> Conectado mediante TLS 1.3</p>
            <p>© 2026 BANTEC Corp. Todos los derechos reservados.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
