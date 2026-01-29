import React from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar.jsx";
import "./SeleccionarTransaccion.css";

export default function SeleccionarTransaccion() {
  const navigate = useNavigate();

  const cajeroStorage = localStorage.getItem("cajero");
  const cajero = cajeroStorage
    ? JSON.parse(cajeroStorage)
    : { nombreCompleto: "Cajero Demo" };

  return (
    <div className="sel-container">
      <Sidebar cajero={cajero} />

      <main className="sel-main">
        <div className="sel-header-box">
          <div className="sel-header-content">
            <div className="sel-header-icon">
              <i className="fa-solid fa-user"></i>
            </div>

            <div className="sel-header-text">
              <p className="sel-user-name">{cajero?.nombreCompleto}</p>
            </div>
          </div>
        </div>

        <p className="sel-subtitle">Escoge la transacción a realizar</p>

        <div className="sel-options">
          {/* Navega a la ruta /deposito definida en App.js */}
          <div
            className="sel-option-card"
            onClick={() => navigate("/deposito")}
          >
            <i className="fa-solid fa-building-columns sel-option-icon"></i>
            <h3 className="sel-option-title">Depósito</h3>
            <button className="sel-btn">Continuar</button>
          </div>

          {/* Navega a la ruta /valores (Retiro) definida en App.js */}
          <div
            className="sel-option-card"
            onClick={() => navigate("/valores")}
          >
            <i className="fa-solid fa-cash-register sel-option-icon"></i>
            <h3 className="sel-option-title">Retiro</h3>
            <button className="sel-btn">Continuar</button>
          </div>

          {/* Navega a la ruta /devoluciones para gestión de devoluciones */}
          <div
            className="sel-option-card sel-option-devoluciones"
            onClick={() => navigate("/devoluciones")}
          >
            <i className="fa-solid fa-rotate-left sel-option-icon"></i>
            <h3 className="sel-option-title">Devoluciones</h3>
            <button className="sel-btn">Continuar</button>
          </div>
        </div>
      </main>
    </div>
  );
}