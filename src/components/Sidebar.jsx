import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiHome, FiList, FiLogOut, FiUser } from "react-icons/fi";
import { TbArrowsExchange } from "react-icons/tb";

export default function Sidebar({ isOpen = true, onRequestClose }) {
  const { state, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDevView = location.pathname && location.pathname.includes("-dev");

  const interbancariasPath = isDevView ? "/interbancarias-dev" : "/interbancarias";
  const transferirPath = isDevView ? "/transferir-dev" : "/transferir";

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavClick = () => {
    if (isMobile && typeof onRequestClose === "function") onRequestClose();
  };

  return (
    <aside className={`sidebar ${!isOpen ? 'sidebar-hidden' : ''}`}>
      <div className="brand">
        BANTEC<span style={{ color: 'var(--accent-primary)' }}>.</span>
      </div>

      <div className="profile-mini">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="profile-avatar">
            <FiUser />
          </div>
          <div style={{ display: "flex", flexDirection: "column", overflow: 'hidden' }}>
            <span style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {state?.user?.name || "Usuario"}
            </span>
            <NavLink
              to="/perfil"
              className="small"
              style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontSize: 12 }}
              onClick={handleNavClick}
            >
              Ver perfil privado
            </NavLink>
          </div>
        </div>
      </div>

      <nav style={{ flexGrow: 1 }}>
        <ul className="nav-list">
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={handleNavClick}
            >
              <FiHome size={18} /> Inicio
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/movimientos"
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={handleNavClick}
            >
              <FiList size={18} /> Movimientos
            </NavLink>
          </li>

          <li>
            <NavLink
              to={transferirPath}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={handleNavClick}
            >
              <TbArrowsExchange size={20} /> Transferir
            </NavLink>
          </li>

          <li>
            <NavLink
              to={interbancariasPath}
              className={({ isActive }) => (isActive ? "active" : "")}
              onClick={handleNavClick}
            >
              <TbArrowsExchange size={20} /> Interbancarias
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="logout-section" style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--border-glass)' }}>
        <button
          onClick={() => {
            handleLogout();
            if (isMobile && typeof onRequestClose === "function") onRequestClose();
          }}
          className="btn-logout"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'transparent',
            border: 'none',
            color: '#f87171',
            cursor: 'pointer',
            fontWeight: 600,
            width: '100%',
            padding: '12px'
          }}
        >
          <FiLogOut size={18} /> Cerrar Sesión Segura
        </button>
      </div>

      <style>{`
        .profile-avatar {
          width: 40px;
          height: 40px;
          background: rgba(56, 189, 248, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-primary);
          font-size: 20px;
          flex-shrink: 0;
        }
        .sidebar-hidden {
          transform: translateX(-100%);
        }
        @media (max-width: 900px) {
           .sidebar {
              position: fixed;
              z-index: 1000;
              height: 100vh;
           }
        }
      `}</style>
    </aside>
  );
}
