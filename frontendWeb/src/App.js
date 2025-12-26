import React, { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { FiMenu, FiX } from "react-icons/fi";

import Login from "./pages/Login";
import Home from "./pages/Home";
import Movimientos from "./pages/Movimientos";
import Transferir from "./pages/Transferir";
import TransaccionesInterbancarias from "./pages/TransaccionesInterbancarias";
import Perfil from "./pages/Perfil";

export default function App() {
  const location = useLocation();
  const { loggedIn } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Abrir sidebar por defecto solo en pantallas anchas
  useEffect(() => {
    const wide = window.innerWidth > 900;
    setSidebarOpen(wide);

    const onResize = () => {
      setSidebarOpen(window.innerWidth > 900);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isLoginPage = location.pathname === "/login";
  // Permitir cualquier ruta que contenga '-dev' para vista rápida sin login
  const isDevView = location.pathname.includes("-dev");

  return (
    <div className="app-shell">
      {(loggedIn || isDevView) && !isLoginPage && (
        <Sidebar
          isOpen={sidebarOpen}
          onRequestClose={() => setSidebarOpen(false)}
        />
      )}

      <main className="main" style={{ width: "100%" }}>
        {/* Botón hamburguesa visible en pantallas pequeñas */}
        {(loggedIn || isDevView) && !isLoginPage && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              paddingBottom: 8,
            }}
          >
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              aria-label="Toggle sidebar"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: 22,
                padding: 8,
              }}
            >
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        )}

        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/movimientos"
            element={
              <ProtectedRoute>
                <Movimientos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/transferir"
            element={
              <ProtectedRoute>
                <Transferir />
              </ProtectedRoute>
            }
          />

          {/* Ruta temporal: Transferir sin login para desarrollo */}
          <Route
            path="/transferir-dev"
            element={
              <ProtectedRoute allowAnonymous={true}>
                <Transferir />
              </ProtectedRoute>
            }
          />

          {/* Ruta temporal: Movimientos sin login para desarrollo */}
          <Route
            path="/movimientos-dev"
            element={
              <ProtectedRoute allowAnonymous={true}>
                <Movimientos />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interbancarias"
            element={
              <ProtectedRoute>
                <TransaccionesInterbancarias />
              </ProtectedRoute>
            }
          />

          {/* Ruta temporal: Interbancarias sin login para desarrollo */}
          <Route
            path="/interbancarias-dev"
            element={
              <ProtectedRoute allowAnonymous={true}>
                <TransaccionesInterbancarias />
              </ProtectedRoute>
            }
          />

          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />

          {/* Ruta temporal para desarrollo: Home sin login */}
          <Route
            path="/home-dev"
            element={
              <ProtectedRoute allowAnonymous={true}>
                <Home />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
