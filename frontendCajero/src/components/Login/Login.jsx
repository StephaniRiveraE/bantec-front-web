import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../services/api";
import "./Login.css";

import logo from "../../assets/Logo.png";
import sideImg from "../../assets/login-side.png";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [error, setError] = useState("");

  // Estado para ver/ocultar contraseña
  const [mostrarClave, setMostrarClave] = useState(false);

  const nav = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!usuario || !clave) {
      setError("Usuario y contraseña son requeridos");
      return;
    }

    // Permite letras, números y espacios (para cédula o nombre de usuario)

    try {
      const res = await auth.login(usuario, clave);

      // Aseguramos guardar el objeto correcto
      // Si tu backend devuelve { token: "...", cajero: { ... } } usamos res.cajero
      // Si devuelve directo el objeto cajero, usamos res
      const cajeroData = res.cajero || res;

      localStorage.setItem("cajero", JSON.stringify(cajeroData));
      nav("/seleccionar");
    } catch (err) {
      console.error(err);
      setError(err.message || "Credenciales inválidas o error de servidor");
    }
  };

  return (
    <div className="login-container">

      <div className="left-section">
        <img src={logo} alt="BANTEC" className="logo" />

        <div className="login-box">

          <h1>Bienvenido</h1>
          <p className="subtitle">
            Ingresa a tu usuario y contraseña, para ingresar al sistema.
          </p>

          <form onSubmit={handleSubmit}>

            <div className="input-group">
              <input
                type="text"
                placeholder="Cédula o Usuario"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
              />
            </div>
            <a className="forgot" href="#">¿Olvidaste tu usuario?</a>

            <div className="input-group">
              <i className="fa-solid fa-lock icon"></i>
              <input
                type={mostrarClave ? "text" : "password"} // Alternar tipo
                placeholder="Contraseña"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
              />
              {/* Ícono funcional para ver contraseña */}
              <i
                className={`fa-solid ${mostrarClave ? "fa-eye" : "fa-eye-slash"} icon-right`}
                onClick={() => setMostrarClave(!mostrarClave)}
                style={{ cursor: "pointer" }}
              ></i>
            </div>
            <a className="forgot" href="#">¿Olvidaste tu contraseña?</a>

            {error && <p className="error">{error}</p>}

            <button className="btn-login">Ingresar</button>
          </form>

        </div>
      </div>

      <div className="right-section">
        <p className="security-text">
          Recuerda cuidar bien tu usuario y contraseña, no lo compartas con tus
          compañeros, recuerda que son datos sensibles.
        </p>

        <img src={sideImg} alt="Imagen informativa" className="side-img" />
      </div>
    </div>
  );
}