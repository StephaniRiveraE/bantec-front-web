import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiHome, FiList, FiLogOut } from "react-icons/fi";
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

  // Estilos dinámicos
  const hiddenStyle = isOpen ? {} : { display: "none" };
  const mobileOverlayStyle = isMobile && isOpen
    ? {
      position: "fixed",
      left: 0,
      top: 0,
      height: "100%",
      zIndex: 1500,
      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
      background: "#fff",
    }
    : {};

  const sidebarStyle = { ...styles.sidebar, ...mobileOverlayStyle, ...hiddenStyle };

  const handleNavClick = () => {
    if (isMobile && typeof onRequestClose === "function") onRequestClose();
  };

  return (
    <aside className="sidebar" style={sidebarStyle}>
      <div className="brand" style={styles.brand}>BANTEC</div>

      <div className="profile-mini" style={styles.profileMini}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={styles.circleIcon}>👤</div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: "18px" }}>
            <span style={{ fontWeight: 700 }}>
              {state?.user?.name || "Usuario"}
            </span>
            <NavLink
              to="/perfil"
              className="small"
              style={styles.profileLink}
              onClick={handleNavClick}
            >
              Mi perfil
            </NavLink>
          </div>
        </div>
      </div>

      <nav style={styles.menuContainer}>
        <ul className="nav-list" style={styles.navList}>
          <li>
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? "active-link" : "")}
              style={({ isActive }) => isActive ? { ...styles.navItem, ...styles.activeItem } : styles.navItem}
              onClick={handleNavClick}
            >
              <FiHome size={18} /> Inicio
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/movimientos"
              className={({ isActive }) => (isActive ? "active-link" : "")}
              style={({ isActive }) => isActive ? { ...styles.navItem, ...styles.activeItem } : styles.navItem}
              onClick={handleNavClick}
            >
              <FiList size={18} /> Movimientos
            </NavLink>
          </li>

          <li>
            <NavLink
              to={transferirPath}
              className={({ isActive }) => (isActive ? "active-link" : "")}
              style={({ isActive }) => isActive ? { ...styles.navItem, ...styles.activeItem } : styles.navItem}
              onClick={handleNavClick}
            >
              <TbArrowsExchange size={20} /> Transferir
            </NavLink>
          </li>

          <li>
            <NavLink
              to={interbancariasPath}
              className={({ isActive }) => (isActive ? "active-link" : "")}
              style={({ isActive }) => isActive ? { ...styles.navItem, ...styles.activeItem } : styles.navItem}
              onClick={handleNavClick}
            >
              <TbArrowsExchange size={20} /> Interbancarias
            </NavLink>
          </li>
        </ul>
      </nav>

      <div style={styles.logoutContainer}>
        <button
          onClick={() => {
            handleLogout();
            if (isMobile && typeof onRequestClose === "function") onRequestClose();
          }}
          style={styles.logoutButton}
        >
          <FiLogOut size={18} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: "260px",
    background: "#fff",
    borderRight: "1px solid #e5e5e5",
    display: "flex",
    flexDirection: "column",
    padding: "25px 20px",
    height: "100vh",
    transition: "transform 0.3s ease",
  },
  brand: {
    fontSize: 28,
    fontWeight: 800,
    color: "#b8860b",
    marginBottom: 25,
  },
  profileMini: { marginBottom: 40 },
  circleIcon: {
    width: 38,
    height: 38,
    background: "#ffd54f",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 20,
  },
  profileLink: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    textDecoration: "none",
    cursor: "pointer"
  },
  menuContainer: { flexGrow: 1 },
  navList: {
    listStyle: "none",
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    textDecoration: "none",
    color: "#555",
    fontSize: 16,
    padding: "10px 12px",
    borderRadius: "8px",
    transition: "background 0.2s"
  },
  activeItem: {
    background: "#fff8e1", // Un fondo suave para el activo
    color: "#b8860b",
    fontWeight: "600"
  },
  logoutContainer: {
    marginTop: "auto",
    paddingTop: 20,
    borderTop: '1px solid #eee',
  },
  logoutButton: {
    padding: "10px 12px",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
    justifyContent: "flex-start",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#d32f2f", // Rojo suave para logout
    fontWeight: "500"
  },
};